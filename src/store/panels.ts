// src/store/panels.ts
import { defineStore } from 'pinia'
import type { Panel } from '../types'
import defaultPanelsJson from '../data/panels.json'

type State = {
    panels: Panel[]
    loaded: boolean
}

const LS_KEY = 'swu_panels_cache_json'
const toJson = (panels: Panel[]) => JSON.stringify({ panels }, null, 2)

export const usePanelStore = defineStore('panels', {
    state: (): State => ({
        panels: [],
        loaded: false,
    }),

    getters: {
        enabledPanels: (s) => s.panels.filter(p => p.enabled !== false),
    },

    actions: {
        /** 首次加载：优先 localStorage → 其次内置默认（打包） */
        async load(): Promise<void> {
            // 1) localStorage
            const cached = localStorage.getItem(LS_KEY)
            if (cached) {
                try {
                    const parsed = JSON.parse(cached)
                    if (Array.isArray(parsed?.panels)) {
                        this.panels = parsed.panels
                        this.loaded = true
                        return
                    }
                } catch {}
            }
            // 2) 内置默认
            if (Array.isArray((defaultPanelsJson as any)?.panels)) {
                this.panels = (defaultPanelsJson as any).panels as Panel[]
                this.loaded = true
                this.saveToLocalStorage()
                return
            }
            throw new Error('未找到可用的 panels 数据')
        },

        /** 统一持久化（仅写 localStorage） */
        async persistAll(): Promise<void> {
            this.saveToLocalStorage()
            // 可加日志便于排查：
            // console.log('[persist] wrote localStorage', this.panels)
        },

        saveToLocalStorage(): void {
            localStorage.setItem(LS_KEY, toJson(this.panels))
        },

        // ---------- CRUD：所有写操作后统一 persist ----------
        addPanel(panel: Partial<Panel>): void {
            const id = Date.now().toString(36)
            this.panels.push({
                id,
                title: panel.title ?? '新面板',
                url: panel.url ?? 'about:blank',
                durationMs: panel.durationMs ?? 8000,
                enabled: panel.enabled ?? true,
            })
            void this.persistAll()
        },

        removePanel(id: string): void {
            this.panels = this.panels.filter(p => p.id !== id)
            void this.persistAll()
        },

        updatePanel(id: string, patch: Partial<Panel>): void {
            const i = this.panels.findIndex(p => p.id === id)
            if (i !== -1) {
                this.panels[i] = { ...this.panels[i], ...patch }
                void this.persistAll()
            }
        },

        reorder(from: number, to: number): void {
            if (from === to) return
            const list = [...this.panels]
            const [m] = list.splice(from, 1)
            if (m) {
                list.splice(to, 0, m)
                this.panels = list
                void this.persistAll()
            }
        },
    },
})
