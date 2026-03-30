import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: false },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Force new service worker to take over immediately
        skipWaiting: true,
        clientsClaim: true,
      },
      manifest: {
        name: 'Merge Bloom',
        short_name: 'Merge Bloom',
        description: 'A cozy garden merge game',
        theme_color: '#FFF0F5',
        background_color: '#FFF0F5',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
          { src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' }
        ]
      }
    })
  ],
  base: '/',
  build: { target: 'es2020', outDir: 'dist' },
  server: { host: true }
});
