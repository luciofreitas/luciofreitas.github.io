import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/pecas-automotivas-compativeis/' : '/',
  server: {
  port: 5174,
  strictPort: true,
    open: true,
    proxy: {
      '/api': {
        // use explicit loopback IP to avoid potential localhost resolution issues
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false,
        // increase proxy timeout slightly
        timeout: 120000,
      },
    },
  },
});