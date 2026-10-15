import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/customers': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/products': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/wishlist': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/cart': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/orders': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
});
