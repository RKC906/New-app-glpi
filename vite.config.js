import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      // Intercepte les appels faits à '/api-glpi' et les envoie au serveur GLPI
      '/api-glpi': {
        target: 'http://localhost:8090/apirest.php',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-glpi/, '')
      }
    }
  }
})