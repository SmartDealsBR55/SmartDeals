import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.source.html'),
        admin: resolve(import.meta.dirname, 'pages/admin.source.html'),
        login: resolve(import.meta.dirname, 'pages/login.source.html'),
      },
    },
  },
});
