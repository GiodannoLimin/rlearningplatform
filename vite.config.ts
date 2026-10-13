import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: { dedupe: ['@codemirror/state', '@codemirror/view', '@codemirror/language'] },
  optimizeDeps: { exclude: ['webr'] },
  build: { target: 'es2022' },
});
