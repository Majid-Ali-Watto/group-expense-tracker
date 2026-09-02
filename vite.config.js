import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import generateSitemap from 'vite-ssg-sitemap'
import { existsSync, readdirSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { PUBLIC_BASE_PATHS } from './src/constants/publicPaths'
import { SITE_NAME, SITE_URL } from './src/constants/seo'

// Every `element-plus/es/components/<name>/style/css` subpath the
// Components/ElementPlusResolver plugin below can inject, listed so Vite's
// dev dep-optimizer pre-bundles them all at server start.
//
// Why this is needed: that resolver adds the per-component style import at
// *transform* time, which Vite's startup dependency scanner doesn't see. So
// each subpath is only discovered when the route that uses that <el-xxx> tag
// is first visited — and every route here is a lazy import(). Discovering a
// new dependency mid-session makes Vite re-run pre-bundling and force a full
// browser reload ("new dependencies optimized: ... reloading"), so a plain
// SPA navigation ended up looking like a page refresh — complete with the
// private-route reloader overlay, which index.html correctly shows on any
// real document load (see its inline script). Pre-declaring the full set
// leaves nothing to discover, so navigation never reloads.
//
// Read off disk rather than hand-listed so new <el-xxx> usage needs no
// change here. Dev only — the production build is unaffected, and each
// component's CSS still ships only to the routes that use it.
const ELEMENT_PLUS_COMPONENTS_DIR = fileURLToPath(
  new URL('./node_modules/element-plus/es/components', import.meta.url)
)
const ELEMENT_PLUS_STYLE_DEPS = existsSync(ELEMENT_PLUS_COMPONENTS_DIR)
  ? readdirSync(ELEMENT_PLUS_COMPONENTS_DIR, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isDirectory() &&
          existsSync(
            `${ELEMENT_PLUS_COMPONENTS_DIR}/${entry.name}/style/css.mjs`
          )
      )
      .map((entry) => `element-plus/es/components/${entry.name}/style/css`)
  : []

// The 16 crawlable URLs (8 public pages x en/ur) — the only routes vite-ssg
// prerenders to static HTML. Everything else (login/register/private app
// routes) stays a plain client-rendered SPA, same as before.
const SSG_INCLUDED_ROUTES = Object.values(PUBLIC_BASE_PATHS).flatMap((path) => [
  path,
  path === '/' ? '/ur' : `/ur${path}`
])

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
  optimizeDeps: {
    // Dev-server-only. See ELEMENT_PLUS_STYLE_DEPS above.
    include: ELEMENT_PLUS_STYLE_DEPS
  },
  ssr: {
    // Element Plus's per-component style imports (see the Components
    // plugin below) resolve through to raw .css files. Left external (the
    // default for node_modules during vite-ssg's SSR/prerender pass), Node
    // tries to `import()` those .css files itself at render time and
    // fails — bundling element-plus into the SSR build instead lets Vite's
    // own CSS handling neutralize them like it does everywhere else.
    noExternal: ['element-plus']
  },
  build: {
    chunkSizeWarningLimit: 1600, // Increase chunk size warning limit
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          // element-plus is deliberately NOT force-grouped here — with
          // on-demand imports (see the Components plugin above), forcing
          // everything matching this id into one shared chunk would undo
          // the whole point: every route would go back to loading every
          // Element Plus component used ANYWHERE in the app, even the
          // public marketing pages that use none of them. Rollup's default
          // chunking already hoists genuinely-shared pieces (e.g. whatever
          // Header.vue uses, since it's on every route) while keeping
          // page-specific components (Table, forms, admin panels) in that
          // page's own chunk.
          // Match actual package directory boundaries, not a loose
          // substring — `id.includes('vue')` also matches unrelated
          // packages' internal `*.vue.mjs`-suffixed compiled output (e.g.
          // element-plus's own components), which used to silently pull
          // all of Element Plus back into this "shared everywhere" bucket.
          //
          // Kept as ONE combined bucket (not split into auth-vs-firestore
          // sub-chunks) — the Firebase SDK's internal packages cross-reference
          // each other (auth, app-check, and firestore all sit on shared
          // `@firebase/app`/`component`/`util` foundations), and forcing them
          // into separate manualChunks buckets produced a circular chunk
          // dependency (Rollup warns: "Circular chunk: firebase-auth ->
          // firebase -> firebase-auth") with unpredictable bundling as a
          // result — tried and reverted. The real fix for keeping Firestore
          // off the public marketing pages' *execution* path is at the
          // source level: src/firebase-auth.js gives auth-only code (the
          // router guard's session check, App()'s onAuthStateChanged
          // listener) a way to avoid statically importing this module at
          // all, so `getFirestore()`/`onSnapshot()` etc. never run for an
          // anonymous visitor — see that file's header comment. Byte-level
          // chunk separation of the SDK itself is a separate, lower-value
          // concern given the above.
          if (/\/node_modules\/(firebase|@firebase)\//.test(id))
            return 'firebase'
          if (/\/node_modules\/(vue|@vue|vue-router|pinia)\//.test(id))
            return 'vue-vendor'
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
    // Resolves every <el-xxx> template tag to its own component + CSS
    // import at build time — no more `app.use(ElementPlus)` bundling the
    // entire ~80-component library into every route. See src/main.js for
    // the small handful of Element Plus usages this can't reach (JS APIs
    // like ElMessage, and the 3 files using resolveComponent()).
    Components({ resolvers: [ElementPlusResolver()] }),
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
