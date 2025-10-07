<template>
  <v-container fluid>
    <v-row class="pt-4">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-2">
          <h2 class="text-h5">管理板块</h2>
          <div class="d-flex ga-2">
            <v-btn prepend-icon="add" @click="addDialog = true">新增板块</v-btn>
            <v-btn variant="tonal" prepend-icon="play_arrow" :to="{name:'player'}">返回播放</v-btn>
          </div>
        </div>
        <v-alert type="info" variant="tonal" class="mb-4">提示：拖动左侧手柄可排序；鼠标悬停播放器会暂停自动轮播。</v-alert>
      </v-col>

      <v-col cols="12">
        <v-table density="comfortable">
          <thead>
          <tr>
            <th style="width:48px;">#</th>
            <th>标题</th>
            <th>URL</th>
            <th style="width:140px;">时长(ms)</th>
            <th style="width:120px;">启用</th>
            <th style="width:160px;">操作</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(p, i) in panels" :key="p.id">
            <td>
              <v-btn icon="drag_indicator" variant="text" @mousedown.prevent="startDrag(i)"></v-btn>
            </td>
            <td>
              <v-text-field v-model="p.title" variant="outlined" density="compact" hide-details/>
            </td>
            <td>
              <v-text-field v-model="p.url" variant="outlined" density="compact" hide-details/>
            </td>
            <td>
              <v-text-field v-model.number="p.durationMs" type="number" min="2000" step="500" variant="outlined" density="compact" hide-details/>
            </td>
            <td>
              <v-switch v-model="p.enabled" inset hide-details />
            </td>
            <td>
              <v-btn size="small" variant="tonal" @click="preview(i)">预览</v-btn>
              <v-btn size="small" variant="text" color="error" @click="remove(p.id)">删除</v-btn>
            </td>
          </tr>
          </tbody>
        </v-table>
      </v-col>
    </v-row>

    <v-dialog v-model="addDialog" max-width="520">
      <v-card>
        <v-card-title>新增板块</v-card-title>
        <v-card-text class="d-flex flex-column ga-2">
          <v-text-field v-model="form.title" label="标题" />
          <v-text-field v-model="form.url" label="外链 URL（支持本地 /panels/*.html 或完整 http(s) 链接）" />
          <v-text-field v-model.number="form.durationMs" type="number" label="播放时长（毫秒）" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="addDialog=false">取消</v-btn>
          <v-btn variant="flat" @click="submit()">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { usePanelStore } from '../store/panels'
import { useRouter } from 'vue-router'

const store = usePanelStore()
const { panels } = storeToRefs(store)
const router = useRouter()

const addDialog = ref(false)
const form = reactive({ title: '', url: '', durationMs: 8000 })

function submit(){
  if(!form.title || !form.url) return
  store.addPanel(form)
  addDialog.value = false
  form.title = ''
  form.url = ''
  form.durationMs = 8000
}
function remove(id: string){ store.removePanel(id) }
function preview(i: number){ router.push({ name: 'player', query: { index: i } }) }

// 简易拖拽排序（按下图标后，使用上下箭头快速移动；也可替换为专业拖拽库）
let draggingIndex: number | null = null
function startDrag(i: number){ draggingIndex = i; window.addEventListener('keydown', onKey) }
function onKey(e: KeyboardEvent){
  if(draggingIndex==null) return
  if(e.key === 'ArrowUp' && draggingIndex>0){ store.reorder(draggingIndex, draggingIndex-1); draggingIndex-- }
  if(e.key === 'ArrowDown' && draggingIndex < panels.value.length-1){ store.reorder(draggingIndex, draggingIndex+1); draggingIndex++ }
  if(e.key === 'Escape' || e.key === 'Enter'){ stopDrag() }
}
function stopDrag(){ draggingIndex = null; window.removeEventListener('keydown', onKey) }
</script>