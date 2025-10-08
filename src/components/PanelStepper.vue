<template>
  <div class="panel-stepper mt-5">
    <!-- 轨道（实线） -->
    <div class="track"></div>

    <!-- 等距圆点 -->
    <div
        v-for="i in count"
        :key="i"
        class="dot"
        :style="dotPosStyle(i - 1)"
    />

    <!-- 玉兰花（PNG） -->
    <img
        :src="magnoliaSrc"
        alt="magnolia"
        class="magnolia"
        :class="{ reveal: revealFlag }"
        :style="magnoliaStyle"
        @animationend="revealFlag = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

/** props: 步数、当前索引、玉兰图片 */
const props = withDefaults(defineProps<{
  count: number
  active: number
  magnoliaSrc: string
}>(), {})

/** 轨道宽度的有效区域百分比位置（0~1） */
const pct = computed(() => {
  const n = Math.max(props.count - 1, 1)
  const idx = Math.min(Math.max(props.active, 0), props.count - 1)
  return idx / n
})

/** 圆点位置 */
function dotPosStyle(i: number) {
  const n = Math.max(props.count - 1, 1)
  const p = (i / n) * 100
  return {
    left: `calc(${p}% - var(--dot-size)/2)`
  }
}

/** 玉兰花位置（与圆点同坐标系） */
const magnoliaStyle = computed(() => ({
  '--pct': `${pct.value * 100}%`
}))

/** 动画触发 */
const revealFlag = ref(true)
watch(() => props.active, () => {
  revealFlag.value = false
  requestAnimationFrame(() => (revealFlag.value = true))
})
</script>

<style scoped>
.panel-stepper {
  /* 尺寸：宽度为窗口的 50%，居中显示；完整圆点不被裁切 */
  width: 50vw;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 10px;
  height: 44px;
  z-index: 5;

  --dot-size: 12px;
  --magnolia-size: 26px;
  --line-color: #003D83; /* 西大蓝 */
}

/* ✅ 短线轨道 */
.track {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(50% - 1px);
  height: 2px;
  background-color: var(--line-color);
  border-radius: 2px;
  width: 100%;
  opacity: 0.9;
}

/* ✅ 圆点：与轨道颜色一致，居中完整显示 */
.dot {
  position: absolute;
  top: calc(50% - var(--dot-size)/2);
  width: var(--dot-size);
  height: var(--dot-size);
  border-radius: 50%;
  border: 1px solid var(--line-color);
  background-color: #fff;
  box-shadow: 0 0 4px rgba(0,61,131,0.25);
}

/* ✅ 玉兰花 */
.magnolia {
  position: absolute;
  left: calc(var(--pct) - var(--magnolia-size)/2);
  top: calc(50% - var(--magnolia-size)/2 - 2px);
  width: var(--magnolia-size);
  height: var(--magnolia-size);
  object-fit: contain;

  filter:
      brightness(0) saturate(100%)
      invert(9%) sepia(95%) saturate(9000%)
      hue-rotate(205deg) brightness(80%) contrast(110%)
      drop-shadow(0 0 6px rgba(0,61,131,0.4));  /* 轻微发光阴影 */

  transition: left 600ms cubic-bezier(.22,1,.36,1);
  will-change: left;
}

/* ✅ 玉兰花逐渐生成动画（揭示 + 轻微放大） */
.magnolia.reveal {
  animation: reveal 0.5s ease-out forwards;
}
@keyframes reveal {
  0% {
    opacity: 0;
    transform: scale(0.85);
  }
  60% {
    opacity: 1;
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* ✅ 自适应小屏 */
@media (max-width: 992px) {
  .panel-stepper {
    width: 70vw;
    --dot-size: 10px;
    --magnolia-size: 22px;
  }
}
</style>
