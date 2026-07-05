import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'favicon.svg'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 // 5 MB
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
      manifest: {
        name: 'Timbel',
        short_name: 'Timbel',
        description: 'Timetable Detector and Management',
        theme_color: '#0F172A',
        background_color: '#060C20',
        display: 'standalone',
        icons: [
          {
            src: 'cosen_brand_logo.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'cosen_brand_logo.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      'lottie-web': 'lottie-web/build/player/lottie_light.js',
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
