import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Учебное расписание',
        short_name: 'Расписание',
        description: 'Удобный просмотр учебного расписания КАИ с фильтрами по датам, группам и поиском. Работает офлайн.',
        theme_color: '#6366f1',
        background_color: '#f8fafc',
        display: 'standalone',
        scope: '/web-schedule/',
        start_url: '/web-schedule/',
        orientation: 'portrait',
        lang: 'ru',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  // Базовый путь для GitHub Pages (репозиторий ezy4me/web-schedule)
  base: '/web-schedule/',
  server: {
    port: 5180,
    strictPort: true,
    host: true,
  },
  preview: {
    port: 5181,
    strictPort: true,
    host: true,
  },
})
