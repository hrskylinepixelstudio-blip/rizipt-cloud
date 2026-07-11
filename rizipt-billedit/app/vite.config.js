import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Rizipt Cloud',
        short_name: 'Rizipt',
        description: 'ERP + POS + GST Billing + CRM for Indian MSMEs',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // Allows the POS module to keep billing offline; API calls are
        // handled separately via an IndexedDB outbox queue in services/offlineQueue.js
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.rizipt\.in\/.*/,
            handler: 'NetworkFirst',
            options: { cacheName: 'rizipt-api-cache', networkTimeoutSeconds: 5 },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
