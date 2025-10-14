import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineConfig({
  plugins: [
    vue({ template: { transformAssetUrls } }),
    vuetify({ autoImport: true })
  ],
  server: {
    port: 5173,
    proxy: {
      // 把 /proxy/* 转发到目标站点
      '/proxy': {
        target: 'http://222.198.123.127',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/proxy/, ''),
      },
    }
    }
})