import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://printsite.vercel.app',
        changeOrigin: true
      }
    }
  }
})
