import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite config: set dev server port to 5174 so you don't need to change many sites
export default defineConfig({
  // When deploying to GitHub Pages (or any static host that may serve the site
  // from a subpath), use a relative base so asset URLs don't start with '/'.
  // This prevents 404s for /assets/... when the site isn't at the domain root.
  base: './',
  plugins: [react()],
  server: {
    port: 5174,
    // Proxy API calls to backend running on port 3001
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
    // Remove Cross-Origin-Opener-Policy headers that block OAuth popups
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
  },
})
