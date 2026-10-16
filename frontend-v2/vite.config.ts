import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// 后端 API 地址：构建时不写死，运行时取"当前域名:20011"
// 开发模式下可用 VITE_API_BASE 覆盖（如 http://localhost:20011）
const apiTarget = process.env.VITE_API_BASE || ''

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    proxy: apiTarget
      ? {
          '/api': { target: apiTarget, changeOrigin: true, rewrite: (p) => p.replace(/^\/api/, '') }
        }
      : undefined
  },
  build: {
    chunkSizeWarningLimit: 1500
  }
})
