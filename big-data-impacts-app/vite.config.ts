import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    port: 5174, // Port utilisé par l'application
    strictPort: false, // Permet d'utiliser un autre port si 5174 est occupé
    open: false, // Ne pas ouvrir automatiquement quand lancé depuis le script
    headers: {
      'X-Frame-Options': 'SAMEORIGIN' // Permet l'intégration en iframe
    }
  }
})
