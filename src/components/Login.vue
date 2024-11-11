<template>
    <div
        class="flex flex-col items-center p-6 max-w-sm mx-auto border rounded-lg shadow-xl bg-white"
    >
        <!-- User Name -->
        <div class="w-full mb-4">
            <label
                for="username"
                class="block text-sm font-medium text-gray-700 mb-2"
                >User Name</label
            >
            <el-input
                id="username"
                v-model="username"
                placeholder="Enter your username"
                class="w-full border-gray-300 focus:ring-blue-200 focus:border-blue-300"
                size="large"
            />
        </div>

        <!-- Password -->
        <div class="w-full mb-4">
            <label
                for="password"
                class="block text-sm font-medium text-gray-700 mb-2"
                >Password</label
            >
            <el-input
                id="password"
                v-model="password"
                type="password"
                placeholder="Enter your password"
                class="w-full border-gray-300 focus:ring-blue-200 focus:border-blue-300"
                size="large"
            />
        </div>

        <!-- Remember Me -->
        <div class="flex items-center mb-4 w-full">
            <el-checkbox
                v-model="rememberMe"
                label="Remember Me"
                class="text-sm text-gray-700"
            ></el-checkbox>
        </div>

        <!-- Submit Button -->
        <el-button
            @click="handleSubmit"
            type="primary"
            class="w-full py-2 rounded-lg text-white bg-blue-500 hover:bg-blue-600 focus:ring focus:ring-blue-200"
            size="large"
        >
            Login
        </el-button>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { database, ref as dbRef, get } from "../firebase"; // Firebase methods
import { ElNotification } from "element-plus";

const props = defineProps({
    isLoggedIn: Function,
});

// Local state for user input and checkbox state
const username = ref("");
const password = ref("");
const rememberMe = ref(false);

// Retrieve stored username from localStorage if "Remember Me" was checked previously
onMounted(() => {
    const storedData = localStorage.getItem("rememberMeData");
    if (storedData) {
        const data = JSON.parse(storedData);
        username.value = data.username;
        password.value = data.password;
        rememberMe.value = true; // Automatically check the "Remember Me" checkbox
    }
});

// Handle form submission
function handleSubmit() {
    // First, validate the user input
    if (!username.value || !password.value) {
        ElNotification({
            message: "Please enter both username and password",
            type: "warning",
            duration: 3000,
            showClose: true,
            center: true,
        });
        return;
    }

    // If "Remember Me" is checked, store the username and password in localStorage
    if (rememberMe.value) {
        localStorage.setItem(
            "rememberMeData",
            JSON.stringify({
                username: username.value,
                password: password.value,
            })
        );
    } else {
        localStorage.removeItem("rememberMeData");
    }

    // Extract the first part of the username (assuming it's "Majid" from "Majid Ali")
    const userKey = username.value.split(" ")[0];

    // Fetch data from Firebase (users/<username>/username), then check the username and password fields
    const userRef = dbRef(database, `users/${userKey}`); // Use the extracted key

    get(userRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const user = snapshot.val(); // This will return the user data under the username key

                // Check if the username and password match the ones in Firebase
                if (
                    user.username === username.value &&
                    user.password === password.value
                ) {
                    ElNotification({
                        message: "Login successful!",
                        type: "success",
                        duration: 3000,
                        showClose: true,
                        center: true,
                    });
                    props.isLoggedIn(true);
                } else {
                    ElNotification({
                        message: "Invalid username or password",
                        type: "error",
                        duration: 3000,
                        showClose: true,
                        center: true,
                    });
                }
            } else {
                ElNotification({
                    message: "User not found",
                    type: "error",
                    duration: 3000,
                    showClose: true,
                    center: true,
                });
            }
        })
        .catch((error) => {
            ElNotification({
                message: "An error occurred while fetching data",
                type: "error",
                duration: 3000,
                showClose: true,
                center: true,
            });
        });
}
</script>

<style scoped>
@import "tailwindcss/tailwind.css";
</style>
