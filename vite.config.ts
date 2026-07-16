import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: {
        '/api/tmdb': {
          target: 'https://api.themoviedb.org/3',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/tmdb/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              const customKey = req.headers['x-tmdb-key'];
              const tmdbKey = (typeof customKey === 'string' && customKey.trim() !== '')
                ? customKey.trim()
                : (process.env.VITE_TMDB_API_KEY || '').trim();
              
              if (tmdbKey) {
                if (tmdbKey.startsWith('eyJ')) {
                  proxyReq.setHeader('Authorization', `Bearer ${tmdbKey}`);
                } else {
                  const url = new URL(proxyReq.path, 'https://api.themoviedb.org');
                  url.searchParams.set('api_key', tmdbKey);
                  proxyReq.path = url.pathname + url.search;
                }
              }
            });
          }
        },
        '/api/relay': {
          target: process.env.RELAY_API_URL || 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/relay/, '')
        }
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
