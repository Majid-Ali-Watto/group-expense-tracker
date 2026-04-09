import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: './', // Use relative paths for deployment
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)) // Set up alias for cleaner imports
    }
  },
  server: {
    host: '0.0.0.0' // Allow access from local network
  },
  build: {
    chunkSizeWarningLimit: 1600, // Increase chunk size warning limit
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('element-plus')) return 'element-plus'
          if (id.includes('firebase')) return 'firebase'
          if (
            id.includes('vue') ||
            id.includes('pinia') ||
            id.includes('vue-router')
          ) {
            return 'vue-vendor'
          }
        }
      },
      external: (id) => {
        // Exclude test files, test folders, and markdown files from the build
        if (/\/(tests?|__tests?__|e2e|playwright)\//i.test(id)) return true
        if (/\.(spec|test)\.[jt]sx?$/.test(id)) return true
        if (/\.md$/i.test(id)) return true
        return false
      }
    }
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'prompt', // We control when the SW activates so we can show a notification first
      injectRegister: 'auto', // Automatically inject the service worker registration
      devOptions: {
        enabled: true // Enable PWA in development mode for testing
      },
      manifest: {
        name: 'Group Expense Tracker',
        short_name: 'ExpenseTracker',
        description: 'Track and manage expenses for a group of friends.',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        start_url: './', // Ensure it matches the base path
        icons: [
          {
            src: './expenses.png', // Use relative paths
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: './expenses.png', // Use relative paths
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // skipWaiting intentionally omitted — we send SKIP_WAITING manually after the user is notified
        clientsClaim: true, // Take control of all open tabs immediately after activation
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // Cache files up to 3 MB
        globIgnores: [
          '**/*.map',
          '**/*.md',
          '**/AGENTS.md',
          '**/CLAUDE.md',
          '**/copilot-instructions.md',
          '**/robots.txt',
          '**/sitemap.xml'
        ],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com/, // Cache Firebase storage files
            handler: 'CacheFirst',
            options: {
              cacheName: 'firebase-images',
              expiration: {
                maxEntries: 50, // Limit to 50 files
                maxAgeSeconds: 30 * 24 * 60 * 60 // Cache for 30 days
              }
            }
          }
        ]
      }
    })
  ]
})
