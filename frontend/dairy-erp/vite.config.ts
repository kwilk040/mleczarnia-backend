import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Załaduj zmienne środowiskowe
  const env = loadEnv(mode, process.cwd(), '')
  
  // Określ target dla proxy - użyj VITE_API_TARGET lub domyślnego localhost
  const apiTarget = env.VITE_API_TARGET || 'http://localhost:8081'
  
  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          rewrite: (path) => path, // Nie zmieniaj ścieżki, tylko przekieruj
        },
      },
    },
  }
})
