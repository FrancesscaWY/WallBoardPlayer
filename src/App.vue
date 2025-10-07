<template>
  <v-app>
    <div class="grid-overlay" />
    <v-app-bar density="comfortable" flat color="transparent">
      <v-app-bar-nav-icon icon="mdi-menu" @click="drawer = !drawer" />
      <v-app-bar-title class="text-h5 font-weight-bold">学校信息办 · 大屏展示</v-app-bar-title>
      <v-spacer />
      <v-chip variant="tonal" class="mr-2">{{ now }}</v-chip>
      <v-btn variant="tonal" :to="{name: 'manage'}">管理</v-btn>
    </v-app-bar>

    <v-navigation-drawer
        v-model="drawer"
        :permanent="true"
        color="surface"
        :width="drawerWidth"
    >
    <SideNav @suggest-width="applySuggestWidth" @navigate="go"/>
    </v-navigation-drawer>


    <v-main>
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import SideNav from './components/SideNav.vue'

const router = useRouter()
const drawer = ref(false) // 默认收起
const now = ref('')

function tick() {
  const d = new Date()
  now.value = d.toLocaleString()
}
function go(path: string) { router.push(path) }

onMounted(() => { tick(); setInterval(tick, 1000) })
// const drawer = ref(true)       // 是否显示抽屉
const isRail  = ref(true)      // 迷你态（rail） or 全展开（false）
const drawerWidth = ref(200)   // 默认宽度，后面由 SideNav 建议覆盖

function openFull() {
  if (!drawer.value) {
    drawer.value = true
    isRail.value = false
    return
  }
  isRail.value = !isRail.value        // 直接切到全展开
}
function applySuggestWidth(px: number) {
  // 限个上/下限，避免太窄或过宽
  drawerWidth.value = Math.max(220, Math.min(px, 440))
}
</script>