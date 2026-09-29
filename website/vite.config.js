import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  root: '.',
  publicDir: 'public',
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    open: false,
    cors: true
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
    open: false
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: true
  }
});
