import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import UnoCSS from 'unocss/vite';
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), UnoCSS()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  // css: {
  //   preprocessorOptions: {
  //     scss: {
  //       // 自动导入全局SCSS变量
  //       additionalData: `@use "@/assets/styles/variables.scss";`,
  //     },
  //   },

  // },
});
