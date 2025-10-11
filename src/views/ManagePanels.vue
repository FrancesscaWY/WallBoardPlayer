<template>
  <v-container fluid>
    <v-row class="pt-4 mt-5">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-2">
          <h2 class="text-h5">管理板块</h2>
          <div class="d-flex ga-2">
            <!-- ✅ 新增板块：mdi-plus -->
            <v-btn color="error" variant="tonal" @click="resetPanels">清除本地缓存</v-btn>
            <v-btn prepend-icon="mdi-plus" @click="addDialog = true">新增板块</v-btn>
            <!-- ✅ 返回播放：mdi-play -->
            <v-btn variant="tonal" prepend-icon="mdi-play" :to="{ name: 'player' }">返回播放</v-btn>
          </div>
        </div>

        <!-- ✅ 信息提示：mdi-information -->
        <v-alert type="info" variant="tonal" class="mb-4" icon="mdi-information">
          提示：拖动左侧手柄可排序；鼠标悬停播放器会暂停自动轮播。
        </v-alert>
      </v-col>

      <v-col cols="12">
        <v-table density="comfortable" class="manage-page"
                 :class="{ 'is-dragging': draggingIndex !== null }">
          <thead>
          <tr>
            <th style="width:48px;"></th>
            <th>标题</th>
            <th>URL</th>
            <th style="width:140px;">时长(ms)</th>
            <th style="width:120px;">启用</th>
            <th style="width:260px;">操作</th>
          </tr>
          </thead>

          <!-- 用 transition-group 包裹，启用行位移动画 -->
          <transition-group tag="tbody" name="row-move">
            <tr
                v-for="(p, i) in panels"
                :key="p.id"
                :ref="el => rowRefs[i] = el as HTMLTableRowElement"
                :class="[{ dragging: draggingIndex === i }]"
            >
              <td>
                <v-btn
                    icon="mdi-drag"
                    variant="text"
                    @mousedown.prevent="startDrag(i, $event)"
                    :disabled="draggingIndex !== null && draggingIndex !== i"
                    :class="{
      'drag-handle': true,
      'drag-handle--active': draggingIndex === i,
      'drag-handle--disabled': draggingIndex !== null && draggingIndex !== i
    }"
                />
              </td>

              <td>
                <v-text-field v-model="p.title" :disabled="!editing[i]" variant="outlined" density="compact" hide-details />
              </td>

              <td>
                <v-text-field v-model="p.url" :disabled="!editing[i]" variant="outlined" density="compact" hide-details />
              </td>

              <td>
                <v-text-field
                    v-model.number="p.durationMs"
                    :disabled="!editing[i]"
                    type="number" min="2000" step="500"
                    variant="outlined" density="compact" hide-details
                />
              </td>

              <td>
                <v-switch
                    :model-value="p.enabled"
                    @update:model-value="(val) => onToggleEnabled(i, val)"
                inset
                hide-details
                :color="p.enabled ? 'success' : 'grey'"
                />
              </td>


              <td>
                <div class="d-flex align-center ga-2">
                  <v-btn size="small" variant="tonal" prepend-icon="mdi-eye" @click="preview(i)">预览</v-btn>
                  <v-btn size="small" variant="outlined" prepend-icon="mdi-pencil" @click="toggleEdit(i)">编辑</v-btn>
                  <v-btn size="small" variant="flat" color="primary" prepend-icon="mdi-content-save" :disabled="!editing[i]" @click="save(i)">保存</v-btn>
                  <v-btn size="small" variant="text" color="error" prepend-icon="mdi-delete" @click="remove(p.id || '')">删除</v-btn>
                </div>
              </td>
            </tr>
          </transition-group>
        </v-table>

      </v-col>
    </v-row>

    <!-- ✅ 新增对话框 -->
    <v-dialog v-model="addDialog" max-width="520">
      <v-card>
        <!-- ✅ 标题图标可选：mdi-view-dashboard -->
        <v-card-title class="d-flex align-center ga-2">
          <v-icon icon="mdi-view-dashboard" />
          新增板块
        </v-card-title>
        <v-card-text class="d-flex flex-column ga-2">
          <v-text-field v-model="form.title" label="标题" />
          <v-text-field
              v-model="form.url"
              label="外链 URL（支持本地 /panels/*.html 或完整 http(s) 链接）"
          />
          <v-text-field v-model.number="form.durationMs" type="number" label="播放时长（毫秒）" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <!-- ✅ 取消：mdi-close -->
          <v-btn variant="text" prepend-icon="mdi-close" @click="addDialog = false">取消</v-btn>
          <!-- ✅ 保存：mdi-content-save -->
          <v-btn variant="flat" prepend-icon="mdi-content-save" @click="submit()">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>


<script setup lang="ts">
import {onBeforeUnmount, onMounted, reactive, ref, watch} from 'vue'
import { storeToRefs } from 'pinia'
import { usePanelStore } from '../store/panels'
import router from "../router";
// import { useRouter } from 'vue-router'

const store = usePanelStore()
const { panels } = storeToRefs(store)

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

// 简易拖拽排序（按下图标后，使用上下箭头快速移动；也可替换为专业拖拽库）

const draggingIndex = ref<number | null>(null)


/** 每行编辑状态（只有点了“编辑”才允许保存） */
const editing = ref<boolean[]>([])

/** 初始化与面板数量联动：增删面板时同步编辑状态数组长度 */
function syncEditingLength() {
  const n = panels.value.length
  if (editing.value.length !== n) {
    const old = editing.value
    editing.value = Array.from({ length: n }, (_, i) => old[i] ?? false)
  }
}
syncEditingLength()
watch(panels, syncEditingLength, { deep: true })

/** 反馈提示（保存成功/失败/删除等） */
const snackbar = reactive({
  show: false,
  text: '',
  color: 'success' as 'success' | 'error' | 'info'
})



/** 预览当前行 */
function preview(index: number) {
  const p = panels.value[index]
  if (!p) return

  // 跳转到展示界面（整个大屏），并从该面板开始播放
  router.push({
    name: 'player',
    query: { index }
  })
}

/** 切换编辑状态：点“编辑”后，行内表单可输入，“保存”按钮可用 */
function toggleEdit(index: number) {
  editing.value[index] = !editing.value[index]
}

/** 基础校验：返回错误信息字符串；通过返回空串 */
function validateRow(index: number): string {
  const p = panels.value[index]
  if (!p) return '无效的行'
  if (!p.title?.trim()) return '标题不能为空'
  if (!p.url?.trim()) return 'URL 不能为空'
  if (typeof p.durationMs !== 'number' || p.durationMs < 500) return '时长至少为 500ms'
  return ''
}

/** 保存当前行到 store（此处直接修改的就是 store.state，通常已“生效”）
 *  若你需要持久化到后端，请在此处调用 API 并根据结果设置 snackbar
 */
async function save(index: number) {
  if (!editing.value[index]) return
  const err = validateRow(index)
  if (err) {
    snackbar.text = err
    snackbar.color = 'error'
    snackbar.show = true
    return
  }
  try {
    await store.persistAll() // <- 关键：写入 OPFS + 本地缓存
    const p = panels.value[index]
    snackbar.text = `「${p?.title}」已保存`
    snackbar.color = 'success'
    snackbar.show = true
    editing.value[index] = false
  } catch (e: any) {
    snackbar.text = `保存失败：${e?.message ?? e}`
    snackbar.color = 'error'
    snackbar.show = true
  }
}

/** 删除行：直接修改 Pinia 的 state */
function remove(id: string) {
  if (!id) return
  store.removePanel(id)   // ✅ 交给 store，里面会统一持久化
  snackbar.text = '已删除'
  snackbar.color = 'info'
  snackbar.show = true
}


/** 记录每一行 <tr> 的 DOM，用于命中测试 */
// const rowRefs = ref<HTMLTableRowElement[]>([])

/** 拖拽状态 */
// let draggingIndex: number | null = null
let mm: ((e: MouseEvent) => void) | null = null
let mu: ((e: MouseEvent) => void) | null = null


/** 组件卸载时兜底清理 */
onBeforeUnmount(() => {
  if (mm) window.removeEventListener('mousemove', mm)
  if (mu) window.removeEventListener('mouseup', mu)
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
})

// ✅ 首次加载：优先 OPFS → localStorage → 内置 panels.json
onMounted(async () => {
  if (!store.loaded) {
    try {
      await store.load()
      console.log('✅ panels 加载完成')
    } catch (err) {
      console.error('加载 panels 失败:', err)
    }
  }
})
/** —— 整行拖拽换位 —— **/
// let lastHoverIndex: number | null = null
let onMM: ((e: MouseEvent) => void) | null = null
let onMU: ((e: MouseEvent) => void) | null = null

onBeforeUnmount(() => {
  if (onMM) window.removeEventListener('mousemove', onMM)
  if (onMU) window.removeEventListener('mouseup', onMU)
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
})

/** 每一行 DOM 引用（命中计算用） */
const rowRefs = ref<HTMLTableRowElement[]>([])

/** 拖拽状态：用 ref，模板才能及时响应 */
let lastHoverIndex: number | null = null
let moveHandler: ((e: MouseEvent) => void) | null = null
let upHandler: ((e: MouseEvent) => void) | null = null

/** rAF 节流 */
let ticking = false
function raf(fn: () => void) {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    fn()
    ticking = false
  })
}

/** 根据鼠标 Y 找最近的行（按中线判断） */
function indexFromClientY(clientY: number): number {
  const rows = rowRefs.value
  let target = 0, min = Infinity
  for (let i = 0; i < rows.length; i++) {
    const el = rows[i]
    if (!el) continue
    const rect = el.getBoundingClientRect()
    const mid = rect.top + rect.height / 2
    const d = Math.abs(clientY - mid)
    if (d < min) { min = d; target = i }
  }
  return target
}

/** 开始拖拽（整行换位 + 行位移动画） */
function startDrag(index: number, ev: MouseEvent) {
  if (draggingIndex.value !== null && draggingIndex.value !== index) return

  draggingIndex.value = index
  lastHoverIndex = index

  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'grabbing'

  moveHandler = (e: MouseEvent) => {
    if (draggingIndex.value === null) return
    raf(() => {
      const hover = indexFromClientY(e.clientY)
      if (
          hover !== lastHoverIndex &&
          hover >= 0 &&
          hover < panels.value.length
      ) {
        // 把当前行插到 hover 位置（其余行交给 transition-group 动画）
        store.reorder(draggingIndex.value!, hover)
        lastHoverIndex = hover
        draggingIndex.value = hover
      }
    })
  }

  upHandler = () => {
    // 松手：清理 + 恢复样式 + 取消“凸起”
    draggingIndex.value = null
    lastHoverIndex = null
    if (moveHandler) window.removeEventListener('mousemove', moveHandler)
    if (upHandler) window.removeEventListener('mouseup', upHandler)
    moveHandler = upHandler = null
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
  }

  window.addEventListener('mousemove', moveHandler!)
  window.addEventListener('mouseup', upHandler!)
}

onBeforeUnmount(() => {
  if (moveHandler) window.removeEventListener('mousemove', moveHandler)
  if (upHandler) window.removeEventListener('mouseup', upHandler)
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
})
/** ✅ 重置面板：
 * 1. 清空 OPFS + localStorage 缓存
 * 2. 从打包内置的 panels.json 恢复默认
 * 3. 自动写入 OPFS 和 localStorage
 */
async function resetPanels() {
  try {
    localStorage.removeItem('swu_panels_cache_json')
    if ((navigator as any).storage?.getDirectory) {
      const root: any = await (navigator as any).storage.getDirectory()
      try { await root.removeEntry('panels.json') } catch {}
    }
    store.panels = []
    store.loaded = false
    await store.load()   // 重新从“内置默认”导入，并初始化一份 OPFS
  } catch (err) {
    console.error('重置失败:', err)
  }
}
// import { watch } from 'vue'
let t: any = null
watch(panels, () => {
  clearTimeout(t)
  t = setTimeout(() => store.persistAll(), 300)
}, { deep: true })

function onToggleEnabled(index: number, val: boolean) {
  const p = panels.value[index]
  if (!p) return
  // 直接更新并持久化（store.updatePanel 内部已 persistAll）
  store.updatePanel(p.id!, { enabled: val })

  // 友好提示（可选）
  snackbar.text = val ? `已启用「${p.title}」` : `已禁用「${p.title}」`
  snackbar.color = val ? 'success' : 'info'
  snackbar.show = true

  // 通知播放器（可选，但建议）：让正在播放页立即刷新启用列表
  window.dispatchEvent(new CustomEvent('panels-updated'))
}

</script>

<style scoped>
/* 让 transition-group 在“数组顺序变化”时对每一行应用位移动画 */


/* 表格内垂直居中更紧凑 */
.v-table th, .v-table td { vertical-align: middle; }

/* —— 重要：修复你截图里的“字符不清晰/重影” —— */
/* 管理页禁用可能导致文本重绘问题的效果（blur/父级 transform 等） */
.manage-page {
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  backdrop-filter: none !important;
  filter: none !important;
}
/* 如果你全局有进入/离开时对容器 scale 的过渡，在管理页禁用它 */
.manage-page :where(.fade-slide-enter-from, .fade-slide-leave-to) {
  transform: none !important;
}

/* 行位移动画（Vue 的 FLIP 会加 *.row-move-move* 类） */
.row-move-move {
  transition: transform 120ms ease-out;
  will-change: transform;
}

/* 正在拖拽的那一行：仅高亮，不参与 transform 动画，防止抖动/糊字 */
tr.dragging {
  position: relative;
  z-index: 2;
  background-color: rgba(0,0,0,.03);
  box-shadow: 0 8px 24px rgba(0,0,0,.16);
  transition: none !important;
}

/* 拖拽时，其它行提示浏览器做 GPU 合成，减小卡顿 */
.is-dragging tr:not(.dragging) {
  will-change: transform;
}

/* 你原有的清晰度修复保留 */
.v-table th, .v-table td { vertical-align: middle; }
.manage-page {
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  backdrop-filter: none !important;
  filter: none !important;
}
.manage-page :where(.fade-slide-enter-from, .fade-slide-leave-to) { transform: none !important; }

/* 拖拽按钮的通用样式 */
.drag-handle { cursor: grab; }
.drag-handle--active { cursor: grabbing; }

/* 其他行在拖拽期间：按钮禁用且不响应鼠标 */
.drag-handle--disabled {
  pointer-events: none;   /* 硬阻断点击/按下 */
  opacity: .35;           /* 视觉弱化 */
}
</style>
