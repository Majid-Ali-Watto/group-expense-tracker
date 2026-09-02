<template>
    <div class="h-dvh w-full flex-col flex justify-center items-center bg-[#333]">
        <p class="flex justify-center items-center font-bold text-white">
            You're offline
        </p>
        <p class="flex justify-center items-center text-gray-200">
            Turn on Wi-Fi or mobile data
        </p>

        <button v-on:click="refresh" class="bg-blue-200 py-2 px-4 rounded-full mt-2 w-full max-w-xs mx-4">Try Again</button>
    </div>

</template>
<script setup>
const refresh = () => {
    const currentLocation = window.location.href;
    window.location.href = currentLocation;
}
</script>