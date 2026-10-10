import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages पर repository के /dua/ पथ के लिए
  base: '/dua/',

  // React और JSX/TSX फाइलों के लिए
  plugins: [react()],
});
