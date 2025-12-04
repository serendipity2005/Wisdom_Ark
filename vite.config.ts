import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import UnoCSS from 'unocss/vite';
//自动导入路由
import Pages from 'vite-plugin-pages';

// import generouted from '@generouted/react-router/plugin';
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    UnoCSS(),
    // generouted(),
    Pages({
      // 只对前台页面启用自动路由
      dirs: [
        {
          dir: 'src/pages',
          baseRoute: '/',
        },
      ],
      // extendRoute(route) {
      //   console.log(route.path);

      //   if (route.path === '/') {
      //     return {
      //       ...route,
      //       element: `() => {
      //         const { Navigate } = require('react-router-dom')
      //         return React.createElement(Navigate, { to: '/post/1', replace: true })
      //       }`,
      //     };
      //   }
      //   return route;
      // },
      extensions: ['tsx', 'jsx'],
      // 排除后台相关文件
      exclude: ['**/admin/**', '**/components/**'],
      // 自定义路由生成
      onRoutesGenerated: (routes) => {
        // 可以在这里对自动生成的路由进行处理
        console.log('Generated routes:', routes);
        return routes;
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 自动导入全局SCSS变量
        additionalData: `@import "@/assets/styles/variables.scss";`,
      },
    },
  },
});
