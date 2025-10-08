<template>
  <v-container fluid class="pa-0 fill-height">
    <v-row no-gutters class="h-100">
      <v-col cols="12" class="h-100">
        <div class="h-100" @mouseenter="pause()" @mouseleave="resume()">
          <transition name="fade-slide" mode="out-in">
            <iframe
                v-if="current"
                class="iframe-reset"
                :key="current.id + '-' + playKey"
                :src="current.url"
                referrerpolicy="no-referrer"
                loading="eager"
            />
          </transition>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { usePanelStore } from '../store/panels'

const store = usePanelStore()
const { enabledPanels } = storeToRefs(store)
const route = useRoute()
// const router = useRouter()

const index = ref(0)
const timer = ref<number | null>(null)
const playing = ref(true)
const playKey = ref(0) // 用于强制刷新 iframe

const current = computed(() => enabledPanels.value[index.value])

function next() {
  if (!enabledPanels.value.length) return
  index.value = (index.value + 1) % enabledPanels.value.length
}

function schedule() {
  clearTimer()
  const dur = current.value?.durationMs ?? 8000
  timer.value = window.setTimeout(() => {
    next()
    playKey.value++
    schedule()
  }, dur)
}

function clearTimer() { if (timer.value) { clearTimeout(timer.value); timer.value = null } }
function pause() { playing.value = false; clearTimer() }
function resume() { if (!playing.value) { playing.value = true; schedule() } }

watch(() => route.query.index, (q) => {
  const idx = Number(q)
  if (!Number.isNaN(idx) && idx >= 0 && idx < enabledPanels.value.length) {
    index.value = idx
    playKey.value++
    schedule()
  }
}, { immediate: true })

onMounted(() => { if (!route.query.index) schedule() })

onBeforeUnmount(() => clearTimer())

// 当面板配置变化时，重置索引以避免越界
watch(enabledPanels, (list) => {
  if (!list.length) return
  if (index.value >= list.length) index.value = 0
  playKey.value++
  schedule()
})

</script>

<style scoped>
.h-100{ height: calc(100vh - 64px); }
</style>