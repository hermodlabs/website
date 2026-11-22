import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('./', import.meta.url)),
  base: './',
  plugins: [react()],
  worker: { format: 'es' },
  // Resolve the public installed package in both a linked checkout and a copied
  // consumer. Do not alias SDK source files or copy its worker implementation.
  optimizeDeps: { exclude: ['@decision-lab/sdk'] },
  build: { outDir: 'dist', emptyOutDir: true },
});
