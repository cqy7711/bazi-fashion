import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/** Browsers still request /favicon.ico by default; redirect to our SVG to avoid 404 in dev/preview. */
function faviconIcoRedirect(): Plugin {
  const mount = (server: { middlewares: { use: (fn: (req: any, res: any, next: () => void) => void) => void } }) => {
    server.middlewares.use((req, res, next) => {
      const p = req.url?.split('?')[0];
      if (p === '/favicon.ico') {
        res.statusCode = 302;
        res.setHeader('Location', '/favicon.svg');
        res.end();
        return;
      }
      next();
    });
  };
  return {
    name: 'favicon-ico-redirect',
    configureServer: mount,
    configurePreviewServer: mount,
  };
}

export default defineConfig({
  plugins: [react(), faviconIcoRedirect()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    /** 手机与电脑同 Wi‑Fi 时，用终端打印的 Network 地址访问，便于真机调视觉与排版 */
    host: true,
    /** 避免浏览器强缓存旧 chunk，导致已删除的顶栏「高级版」切换仍显示 */
    headers: { 'Cache-Control': 'no-store' },
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
  preview: {
    port: 4173,
    host: true,
  },
});
