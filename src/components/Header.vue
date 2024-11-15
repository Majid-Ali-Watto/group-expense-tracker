<template>
	<header class="flex items-center justify-between mb-6 fixed top-0 left-0 w-full p-3 md:p-4 bg-white shadow-md z-50 transition-all duration-300">
		<span class="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-center px-4 text-black"> FinTrack </span>
		<button v-if="loggedIn" @click="isLoggedIn" class="text-blue-500 hover:text-white hover:bg-blue-500 border border-blue-500 rounded-lg p-1 sm:p-2 md:px-4 md:py-2 transition duration-200">Logout</button>
	</header>
</template>

<script>
	export default {
		props: {
			loggedIn: false
		},

		setup(props, { emit }) {
			function isLoggedIn() {
				emit("click-log", false);
			}
			return {
				isLoggedIn
			};
		}
	};
</script>

