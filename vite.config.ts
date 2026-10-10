import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages: नई "dua" रिपॉज़िटरी
  // अपेक्षित URL: https://<username>.github.io/dua/
  base: '/dua/',
  plugins: [react()],
});
