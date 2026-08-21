import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import generateSitemap from 'vite-ssg-sitemap'
import { fileURLToPath, URL } from 'node:url'
import { PUBLIC_BASE_PATHS } from './src/constants/publicPaths'
import { SITE_NAME, SITE_URL } from './src/constants/seo'

// The 12 crawlable URLs (6 public pages x en/ur) — the only routes vite-ssg
// prerenders to static HTML. Everything else (login/register/private app
// routes) stays a plain client-rendered SPA, same as before.
const SSG_INCLUDED_ROUTES = Object.values(PUBLIC_BASE_PATHS).flatMap(
  (path) => [path, path === '/' ? '/ur' : `/ur${path}`]
)

export default defineConfig({
  base: '/', // Required for SPA deep links on root-hosted deployments like Netlify
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)) // Set up alias for cleaner imports
    }
  },
  server: {
    host: '0.0.0.0', // Allow access from local network
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
    }
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
        if (/\/(tests?|__tests?)\//i.test(id)) return true
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
        name: `${SITE_NAME} - Group Expense & Budget Tracker`,
        short_name: SITE_NAME,
        description:
          'Kharchafy is a group expense, shared loan, and personal budgeting app.',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        start_url: '/',
        icons: [
          {
            src: '/expenses.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/expenses.png',
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
  ],
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
    // '/faq' -> dist/faq/index.html instead of dist/faq.html — every static
    // host (Vercel, Netlify, Firebase Hosting) serves that for a `/faq`
    // request with zero extra rewrite config, unlike the flat default which
    // needs `cleanUrls` support to be reachable at its clean URL.
    dirStyle: 'nested',
    includedRoutes: () => SSG_INCLUDED_ROUTES,
    onFinished() {
      generateSitemap({
        hostname: SITE_URL,
        // public/robots.txt is already hand-authored and correct.
        generateRobotsTxt: false
      })
    }
  }
})
