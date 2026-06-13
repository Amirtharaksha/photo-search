import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/uploads': { target: 'https://amirtharaksha1234-photosearch-backend.hf.space', changeOrigin: true },
    }
  }
})
