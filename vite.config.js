import { defineConfig } from 'vite';
export default defineConfig({
  base: process.env.BASE_PATH || '/mootiny/',
  build: { outDir: 'dist', chunkSizeWarningLimit: 2000, rollupOptions: { input: { main: 'index.html' } } },
  server: { host: '127.0.0.1', port: 5173 },
  preview: { host: '127.0.0.1', port: 4173 },
});
