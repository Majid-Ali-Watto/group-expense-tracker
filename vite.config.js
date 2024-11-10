// vite.config.js
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	plugins: [
		vue(),
		VitePWA({
			registerType: "autoUpdate", // Automatically updates service worker when a new version is available
			injectRegister: "auto", // Automatically injects the service worker registration
			devOptions: {
				enabled: true // Enable PWA in development mode for testing
			},
			manifest: {
				name: "Group Expense Tracker",
				short_name: "ExpenseTracker",
				description: "Track and manage expenses for a group of friends.",
				theme_color: "#ffffff",
				background_color: "#ffffff",
				start_url: "/",
				icons: [
					{
						src: "/expenses.png",
						sizes: "192x192",
						type: "image/png"
					},
					{
						src: "/expenses.png",
						sizes: "512x512",
						type: "image/png"
					}
				]
			},
			server: {
				host: "0.0.0.0"
			},
			build: {
				chunkSizeWarningLimit: 1600
			},
			workbox: {
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/firebasestorage\.googleapis\.com/,
						handler: "CacheFirst",
						options: {
							cacheName: "firebase-images",
							expiration: {
								maxEntries: 50,
								maxAgeSeconds: 30 * 24 * 60 * 60
							}
						}
					}
				]
			}
		})
	]
});
