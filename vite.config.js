import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cesium from 'vite-plugin-cesium'

export default defineConfig({
  plugins: [
    vue(),
    // vite-plugin-cesium 自动处理 Cesium 的静态资源（Worker、Asset、Widget CSS）
    // 无需手动配置 CopyWebpackPlugin 等
    cesium()
  ],
  server: {
    port: 3000,
    open: true
  }
})
