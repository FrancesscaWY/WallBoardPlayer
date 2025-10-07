import { createRouter, createWebHashHistory } from 'vue-router'
import PanelPlayer from '../views/PanelPlayer.vue'
import ManagePanels from '../views/ManagePanels.vue'

export default createRouter({
    history: createWebHashHistory(),
    routes: [
        { path: '/', name: 'player', component: PanelPlayer },
        { path: '/manage', name: 'manage', component: ManagePanels },
    ]
})