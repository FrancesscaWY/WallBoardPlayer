// src/store/panels.ts
import { defineStore } from 'pinia'
import type { Panel } from '../types'

type State = { panels: Panel[]; loaded: boolean }
const LS_KEY = 'swu_panels_json'

export const usePanelStore = defineStore('panels', {
    state: (): State => ({
        panels: [] as Panel[],
        loaded: false
    }),

    getters: {
        enabledPanels: (s): Panel[] => s.panels.filter(p => p.enabled !== false),
    },

    actions: {
        /** 优先从 localStorage 读；否则从 /panels.json 读 */
        async loadFromJson(url = '/panels.json'): Promise<void> {
            // 1) localStorage 优先
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
            // 2) 远端 JSON
            const res = await fetch(url, { cache: 'no-cache' })
            if (!res.ok) throw new Error(`加载 ${url} 失败: ${res.status}`)
            const data = await res.json()
            if (!Array.isArray(data?.panels)) throw new Error('panels.json 结构错误')
            this.panels = data.panels
            this.loaded = true
            this.saveToLocalStorage()
        },

        /** 写入 localStorage（前端无后端的持久化） */
        saveToLocalStorage(): void {
            localStorage.setItem(LS_KEY, JSON.stringify({ panels: this.panels }, null, 2))
        },

        /** 下载当前面板配置为 panels.json（用于部署覆盖服务器） */
        exportToJsonFile(filename = 'panels.json'): void {
            const blob = new Blob(
                [JSON.stringify({ panels: this.panels }, null, 2)],
                { type: 'application/json;charset=utf-8' }
            )
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            a.click()
            URL.revokeObjectURL(url)
        },

        /** CRUD —— 所有写操作都顺便保存到 localStorage */
        addPanel(panel: Partial<Panel>): void {
            const id = Date.now().toString(36)
            this.panels.push({
                id,
                title: panel.title ?? '新面板',
                url: panel.url ?? 'about:blank',
                durationMs: panel.durationMs ?? 8000,
                enabled: panel.enabled ?? true,
            })
            this.saveToLocalStorage()
        },

        removePanel(id: string): void {
            this.panels = this.panels.filter(p => p.id !== id)
            this.saveToLocalStorage()
        },

        updatePanel(id: string, patch: Partial<Panel>): void {
            const i = this.panels.findIndex(p => p.id === id)
            if (i !== -1) {
                this.panels[i] = { ...this.panels[i], ...patch }
                this.saveToLocalStorage()
            }
        },

        /** 交换顺序（from -> to），用于“整行拖拽换位” */
        reorder(from: number, to: number): void {
            if (from === to) return
            const list = [...this.panels]
            const [m] = list.splice(from, 1)
            if (m) {
                list.splice(to, 0, m)
                this.panels = list
                this.saveToLocalStorage()
            }
        },
    },
})
