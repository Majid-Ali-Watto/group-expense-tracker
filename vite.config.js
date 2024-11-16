import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
	base: "./", // Use relative paths for deployment
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)) // Set up alias for cleaner imports
		}
	},
	server: {
		host: "0.0.0.0" // Allow access from local network
	},
	build: {
		chunkSizeWarningLimit: 1600 // Increase chunk size warning limit
	},
	plugins: [
		vue(),
		VitePWA({
			registerType: "autoUpdate", // Automatically update the service worker when a new version is available
			injectRegister: "auto", // Automatically inject the service worker registration
			devOptions: {
				enabled: true // Enable PWA in development mode for testing
			},
			manifest: {
				name: "Group Expense Tracker",
				short_name: "ExpenseTracker",
				description: "Track and manage expenses for a group of friends.",
				theme_color: "#ffffff",
				background_color: "#ffffff",
				start_url: "./", // Ensure it matches the base path
				icons: [
					{
						src: "./expenses.png", // Use relative paths
						sizes: "192x192",
						type: "image/png"
					},
					{
						src: "./expenses.png", // Use relative paths
						sizes: "512x512",
						type: "image/png"
					}
				]
			},
			workbox: {
				maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // Cache files up to 3 MB
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/firebasestorage\.googleapis\.com/, // Cache Firebase storage files
						handler: "CacheFirst",
						options: {
							cacheName: "firebase-images",
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
});
