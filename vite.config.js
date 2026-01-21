import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite config: set dev server port to 5174 so you don't need to change many sites
export default defineConfig({
  // When deploying to GitHub Pages (or any static host that may serve the site
  // from a subpath), use a relative base so asset URLs don't start with '/'.
  // This prevents 404s for /assets/... when the site isn't at the domain root.
  base: './',
  // Expose client-side env vars. Keep this list tight to avoid leaking unrelated env.
  envPrefix: ['VITE_', 'EMAILJS_'],
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
  build: {
    // Minify with terser and drop console.* in production builds
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
    rollupOptions: {
      output: {
        // Split large dependencies into separate chunks to reduce main bundle size
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('@supabase') || id.includes('supabase-js')) {
              return 'vendor-supabase';
            }
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            return 'vendor';
          }
        },
      },
    },
  },
})
