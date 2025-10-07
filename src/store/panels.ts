import { defineStore } from 'pinia'
import type { Panel } from '../types'

type State = { panels: Panel[] }

export const usePanelStore = defineStore('panels', {
    state: (): State => ({
        panels: [
            { id: '1', title: '数说西大', url: '/panels/panel1.html', durationMs: 5000, enabled: true },
            { id: '2', title: '安防监控', url: '/panels/panel2.html', durationMs: 5000, enabled: true },
            { id: '3', title: '校园风貌', url: '/panels/panel3.html', durationMs: 6000, enabled: true },
            { id: '4', title: '科研成果', url: '/panels/panel4.html', durationMs: 6000, enabled: true },
            { id: '5', title: '通知公告', url: '/panels/panel5.html', durationMs: 7000, enabled: true },
            { id: '6', title: '后勤服务', url: '/panels/panel6.html', durationMs: 7000, enabled: true },
        ] as Panel[],
    }),

    getters: {
        // 显式标注 s 与回调 p 的类型
        enabledPanels: (s: State): Panel[] => s.panels.filter((p: Panel) => p.enabled !== false),
    },

    actions: {
        addPanel(panel: Partial<Panel>): void {
            const id = Date.now().toString(36)
            this.panels.push({
                id,
                title: panel.title ?? '新面板',
                url: panel.url ?? 'about:blank',
                durationMs: panel.durationMs ?? 8000,
                enabled: true,
            })
        },

        removePanel(id: string): void {
            this.panels = this.panels.filter((p: Panel) => p.id !== id)
        },

        updatePanel(id: string, patch: Partial<Panel>): void {
            const i = this.panels.findIndex((p: Panel) => p.id === id)
            if (i !== -1) this.panels[i] = { ...this.panels[i], ...patch }
        },

        reorder(from: number, to: number): void {
            const list = this.panels
            const [m] = list.splice(from, 1) // m: Panel | undefined
            if (m) {
                list.splice(to, 0, m)
                this.panels = [...list]
            }
        },
    },
})
