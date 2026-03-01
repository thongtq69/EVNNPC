import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/ai-api': {
        target: 'https://opencode.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ai-api/, '')
      }
    }
  }
})
