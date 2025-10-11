<template>
  <v-container fluid class="pa-0 fill-height">
    <v-row no-gutters class="h-100">
      <v-col cols="12" class="h-100">
        <div class="h-100 panel-viewport" @mouseenter="pause()" @mouseleave="resume()">
          <!-- 丝滑切换：fade-slide-bigscreen -->
          <transition name="fade-slide-bigscreen" mode="out-in">
            <iframe
                v-if="current"
                class="panel-iframe"
            :key="current.id + '-' + playKey"
            :src="current.url"
            referrerpolicy="no-referrer"
            loading="eager"
            allow="fullscreen; autoplay; clipboard-read; clipboard-write"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
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

const index = ref(0)
const timer = ref<number | null>(null)
const playing = ref(true)
const playKey = ref(0)

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

// 配置变动时，避免越界并重启定时器
watch(enabledPanels, (list) => {
  if (!list.length) return
  if (index.value >= list.length) index.value = 0
  playKey.value++
  schedule()
})

/** --- 轻量预取：在切换到下一屏之前，用 <link rel="prefetch"> 预取下一URL --- */
function prefetch(url?: string) {
  if (!url) return
  // 避免重复插入
  const id = `pf-${url}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'prefetch'
  // 在部分浏览器中对跨域文档预取可能被忽略，没关系——是“尽力而为”
  link.href = url
  link.as = 'document'
  link.crossOrigin = 'anonymous'
  document.head.appendChild(link)
}

// 每次确定了 current 后，尝试预取“下一页”
watch([current, enabledPanels], () => {
  const list = enabledPanels.value
  if (!list.length || !current.value) return
  const nextIdx = (index.value + 1) % list.length
  prefetch(list[nextIdx]?.url)
})
</script>
<style scoped>
/* 父层：占满可用空间 */
.panel-viewport {
  position: relative;
  width: 100%;
  height: var(--panel-h, 68vh);
  min-height: 360px;
}

/* 关键：iframe 铺满，并使用独立复合层避免重排卡顿 */
.panel-iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
  background: transparent;
  will-change: transform, opacity;
  transform: translateZ(0); /* 独立图层 */
}

/* ===== 大屏丝滑切换：轻位移 + 微缩放 + 透明度 ===== */
/* 入场/离场的持续时间稍长，适合大屏观看距离 */
.fade-slide-bigscreen-enter-active,
.fade-slide-bigscreen-leave-active {
  transition:
      opacity 560ms cubic-bezier(.2,.8,.2,1),
      transform 560ms cubic-bezier(.2,.8,.2,1);
}

/* 初始入场：从轻微下移 + 轻微缩小 到正常 */
.fade-slide-bigscreen-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(.992);
}

/* 离场：轻微上移 + 轻微放大并淡出 */
.fade-slide-bigscreen-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(1.006);
}

/* 防止两帧叠加期间因 absolute 造成点击穿透 */
.fade-slide-bigscreen-enter-active,
.fade-slide-bigscreen-leave-active {
  pointer-events: none;
}

/* 无障碍：尊重减少动态的偏好 */
@media (prefers-reduced-motion: reduce) {
  .fade-slide-bigscreen-enter-active,
  .fade-slide-bigscreen-leave-active {
    transition: opacity 200ms linear !important;
  }
  .fade-slide-bigscreen-enter-from,
  .fade-slide-bigscreen-leave-to {
    transform: none !important;
  }
}

/* 若外层用了 fill-height 辅助类，这里兜底拉满 */
.v-container.fill-height,
.v-row.fill-height,
.v-col.fill-height { height: 100%; }
</style>
