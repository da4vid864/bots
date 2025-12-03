import { defineConfig } from 'vite'
// Trigger config reload
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'https://botinteligente.com.mx',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'https://botinteligente.com.mx',
        changeOrigin: true,
        secure: false,
      },
      '/subs': {
        target: 'https://botinteligente.com.mx',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
