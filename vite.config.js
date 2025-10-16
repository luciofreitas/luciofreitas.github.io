import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite config: set dev server port to 5174 so you don't need to change many sites
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
  },
})
