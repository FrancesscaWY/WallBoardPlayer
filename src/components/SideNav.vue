<!-- SideNavTabs.vue -->
<template>
  <v-tabs
      v-model="tab"
      direction="vertical"
      color="primary"
      slider-color="primary"
      class="side-tabs"
  >
    <v-tab
        v-for="(p, idx) in panels"
        :key="p.id"
        :value="idx"
        class="tab-item "
        @click="go({ name:'player', query:{ index: idx } })"
    >
      {{ p.title }}
    </v-tab>

    <v-divider class="my-2" />

    <v-tab
        :value="'manage'"
        prepend-icon="mdi-cog"
        class="tab-item"
        @click="go({ name:'manage' })"
    >
      管理板块
    </v-tab>
  </v-tabs>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import { storeToRefs } from 'pinia'
import { usePanelStore } from '../store/panels'

const router = useRouter()
const route = useRoute()
const store = usePanelStore()
const { panels } = storeToRefs(store)

function go(to: RouteLocationRaw) { router.push(to) }

const tab = computed({
  get() {
    if (route.name === 'manage') return 'manage'
    const q = route.query.index
    const idx = Number(Array.isArray(q) ? q[0] : q)
    return Number.isFinite(idx) ? idx : 0
  },
  set(v:any) { /* 由 @click 处理路由，这里无需实现 */ }
})
</script>

<style scoped>
.side-tabs {
  padding: 8px 6px;
}
.tab-item {
  justify-content: flex-start;
  text-transform: none;
  font-weight: 500;
  letter-spacing: .2px;
  border-radius: 12px;
  margin: 2px 4px;
}
</style>
