<template>
  <v-app class="app-bg">
    <!-- 用全屏容器捕捉鼠标移动/离开 -->
    <div class="h-screen overflow-hidden" @mousemove="onMouseMove" @mouseleave="onMouseLeave">
      <v-navigation-drawer
          v-model="drawer"
          :permanent="true"
          color="surface"
          :width="drawerWidth"
      >
        <template #prepend>
          <div class="text-center py-4">
            <img src="/imgs/swu-Photoroom.png"
                 style="max-width:160px; max-height:60px; width:auto; height:auto; margin-bottom: 5px" />
            <v-app-bar-title class="text-h6 font-weight-bold ma-0">
              SWU · 大屏展示
            </v-app-bar-title>
          </div>
          <v-divider class="mb-2" />
        </template>

        <!-- 数据加载前显示骨架，防止“空白抽屉”的观感 -->
        <template v-if="store.loaded">
          <SideNav @suggest-width="applySuggestWidth" @navigate="go" />
        </template>
        <template v-else>
          <v-skeleton-loader
              class="px-3 pt-2"
              type="list-item, list-item, list-item, list-item, list-item"
          />
        </template>
      </v-navigation-drawer>


      <v-main>

        <v-app-bar-nav-icon icon="mdi-menu" @click="drawer = !drawer"  class="mt-3 mb-2 ml-5"/>


        <v-container fluid class="fill-height pa-0">
          <v-row class="fill-height" align="center" justify="center" no-gutters>
            <PanelStepper
                :count="panels.length"
                :active="activeIndex"
                magnolia-src="/imgs/magnolia-Photoroom.png"
            />
            <v-col cols="12" class="d-flex align-center justify-center">
              <!-- 顶部切换栏（放在内容前） -->

              <v-card
                  :style="cardStyle"
                  rounded="xl"
                  elevation="16"
                  border
                  class="overflow-hidden pa-0 mt-3"
                  variant="elevated"
                  @mouseenter="pause()"
                  @mouseleave="resume()"
              >

                <!-- 右上角时钟 -->
                <v-chip
                    variant="tonal"
                    color="primary"
                    class="time-chip"
                >
                  {{ now }}
                </v-chip>
<!--                  <template>-->
<!--                <iframe>-->
                    <router-view v-slot="{ Component }">
                      <transition name="fade-slide" mode="out-in">
                        <component :is="Component" />
                      </transition>
                    </router-view>
<!--                  </template>-->
<!--                </iframe>-->
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-main>

    </div>
  </v-app>
</template>

<script setup lang="ts">
import {ref, onMounted, watch, onBeforeUnmount, computed} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import SideNav from './components/SideNav.vue'
import {storeToRefs} from "pinia";
import {usePanelStore} from "./store/panels.ts";
import PanelStepper from "./components/PanelStepper.vue";

const router = useRouter()
const drawer = ref(false) // 默认收起
const now = ref('')

function tick() {
  const d = new Date()
  now.value = d.toLocaleString()
}
function go(path: string) { router.push(path) }

onMounted(() => { tick(); setInterval(tick, 1000) })
const drawerWidth = ref(200)   // 默认宽度，后面由 SideNav 建议覆盖

function applySuggestWidth(px: number) {
  // 限个上/下限，避免太窄或过宽
  drawerWidth.value = Math.max(220, Math.min(px, 440))
}


/** 你已有的状态（示例） */

/** 新增：顶栏显示控制 */
const showAppBar = ref(false)           // 顶栏是否由“悬浮逻辑”显示
const TOP_HOVER_ZONE = 80               // 触发显示的“顶部热区”高度(px)
let hideTimer: number | undefined       // 隐藏定时器句柄
const isPointerOnAppBar = ref(false)    // 鼠标是否在顶栏上


/** 公用函数 */
function clearHideTimer() {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = undefined
  }
}
function revealAppBar() {
  clearHideTimer()
  showAppBar.value = true
}
function scheduleHide() {
  // 抽屉打开时，顶栏必须显示；鼠标悬停在顶栏也不隐藏
  if (drawer.value || isPointerOnAppBar.value) return
  clearHideTimer()
  hideTimer = window.setTimeout(() => {
    showAppBar.value = false
  }, 1000)
}

/** 顶层容器的鼠标事件 */
function onMouseMove(e: MouseEvent) {
  // 进入顶部热区立即显示
  if (e.clientY <= TOP_HOVER_ZONE) {
    revealAppBar()
  } else {
    // 不在热区，若不在顶栏，不在抽屉打开状态，则启动隐藏倒计时
    scheduleHide()
  }
}
function onMouseLeave() {
  scheduleHide()
}
/** 当抽屉开合时，更新顶栏显示策略 */
watch(drawer, (open) => {
  if (open) {
    revealAppBar()   // 抽屉开启 => 顶栏必须显示
  } else {
    scheduleHide()   // 抽屉关闭 => 恢复悬浮隐藏策略
  }
})

/** 清理 */
onBeforeUnmount(() => {
  clearHideTimer()
})


/** 根据你的路由 & 面板数据计算 iframe URL（与之前一致） */
const route = useRoute()
const { panels } = storeToRefs(usePanelStore())

/** 卡片尺寸：窗口 95%，抽屉开时扣掉抽屉宽度 */
const cardStyle = computed(() => ({
  width: drawer.value ? `calc(95vw - ${drawerWidth.value}px)` : '90vw',
  height: '90vh',
  /* 让卡片更像“展示板”的额外质感，可按需保留/调整 */
  boxShadow: '0 28px 60px rgba(0,0,0,.28), 0 8px 20px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.22)'
}))

/** 当前活动面板索引（与路由 query.index 同步） */
const activeIndex = ref( Number(route.query.index ?? 0) || 0 )

/** 轮播定时器控制 */
let timer: number | undefined
const isPaused = ref(false)
const DEFAULT_DURATION = 8000   // 如果某面板未设置 durationMs，用这个默认值

function clearTimer() {
  if (timer) {
    clearTimeout(timer)
    timer = undefined
  }
}
function scheduleNext() {
  clearTimer()
  if (isPaused.value) return
  if (route.name !== 'player') return
  if (!panels.value?.length) return

  const curr = panels.value[activeIndex.value]
  const delay = Math.max(1200, Number(curr?.durationMs ?? DEFAULT_DURATION))
  timer = window.setTimeout(() => {
    goNext()
  }, delay)
}
function goNext() {
  const n = panels.value?.length ?? 0
  if (!n) return
  activeIndex.value = (activeIndex.value + 1) % n
}
function pause() {
  isPaused.value = true
  clearTimer()
}
function resume() {
  isPaused.value = false
  scheduleNext()
}

/** 与路由双向同步 */
watch(
    () => route.query.index,
    (qIdx) => {
      const idx = Number(qIdx ?? 0) || 0
      if (idx !== activeIndex.value) {
        activeIndex.value = Math.min(Math.max(idx, 0), Math.max((panels.value?.length ?? 1) - 1, 0))
      }
    }
)

/** 当轮播索引变化时，同步到路由并重新计时 */
watch(activeIndex, (idx) => {
  // 仅在 player 路由下同步
  if (route.name === 'player') {
    router.replace({ name: 'player', query: { ...route.query, index: idx } })
    scheduleNext()
  }
})

/** 抽屉开合：打开时暂停，关闭时恢复 */
watch(drawer, (open) => {
  if (open) pause()
  else resume()
})

/** 路由切换：进入 player 启动轮播，离开则清理 */
watch(
    () => route.name,
    (name) => {
      if (name === 'player') {
        // 进入 player：根据 query.index 对齐一次索引
        activeIndex.value = Number(route.query.index ?? 0) || 0
        resume()
      } else {
        pause()
      }
    },
    { immediate: true }
)


onMounted(() => {
  if (route.name === 'player') resume()
})
onBeforeUnmount(() => {
  clearTimer()
})

const store = usePanelStore()
const { loaded } = storeToRefs(store)

onMounted(async () => {
  if (!loaded.value) {
    try { await store.loadFromJson('/panels.json') } catch (e) { console.error(e) }
  }
})

</script>

<style scoped>
/* 你的淡入淡出过渡（可沿用） */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity .25s ease, transform .25s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.995);
}

.time-chip {
  position: absolute;  /* ✅ 相对卡片定位 */
  bottom: 16px;
  right: 20px;
  z-index: 10;
  font-size: 1rem;
  font-weight: 600;
  padding: 4px 12px;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.15);
  border: 1px solid rgba(255,255,255,0.15);
}
.app-bg {
  background-image: url('/imgs/swuBG.png');
  background-repeat: no-repeat;
  background-position: center top;
  background-size: 100% 100%; /* ✅ 宽高都拉伸到铺满容器 */
  background-attachment: fixed; /* 固定背景（可选） */

  width: 100vw;
  height: 100vh; /* 全屏 */
  overflow: hidden;
}


.v-application__wrap {
  position: relative;
  z-index: 1;
}
</style>
