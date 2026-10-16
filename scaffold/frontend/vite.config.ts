import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5175,
    // 后端 api 走 5000，本地开发代理
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})
