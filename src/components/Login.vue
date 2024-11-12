<template>
    <div
        class="flex flex-col items-center p-6 max-w-sm mx-auto border rounded-lg shadow-xl bg-white"
    >
        <fieldset class="w-full p-4 border rounded-lg">
            <legend>Login Form</legend>

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
                    :error="errors.username"
                />
                <p v-if="errors.username" class="text-red-500 text-sm">
                    {{ errors.username }}
                </p>
            </div>

            <!-- Password with Toggle -->
            <div class="w-full mb-4">
                <label
                    for="password"
                    class="block text-sm font-medium text-gray-700 mb-2"
                    >Password</label
                >
                <el-input
                    id="password"
                    v-model="password"
                    :type="passwordVisible ? 'text' : 'password'"
                    placeholder="Enter your password"
                    class="w-full border-gray-300 focus:ring-blue-200 focus:border-blue-300"
                    size="large"
                />
                <button
                    type="button"
                    @click="togglePasswordVisibility"
                    class="text-sm text-blue-500 hover:text-blue-700 mt-1"
                >
                    {{ passwordVisible ? "Hide" : "Show" }} Password
                </button>
                <p v-if="errors.password" class="text-red-500 text-sm">
                    {{ errors.password }}
                </p>
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
                type="success"
                class="w-full py-2 rounded-lg text-white focus:ring focus:ring-blue-200"
                size="large"
            >
                Login
            </el-button>
        </fieldset>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { database, ref as dbRef, get } from "../firebase";
import { store } from "../stores/store";
import { notify } from "../utils/showAlert";

const userStore = store();
const props = defineProps({
    isLoggedIn: Function,
});

const username = ref("");
const password = ref("");
const rememberMe = ref(false);
const passwordVisible = ref(false); // Toggle for password visibility
const errors = ref({ username: "", password: "" }); // Validation error messages

// Retrieve stored data if "Remember Me" was checked
onMounted(() => {
    const storedData = localStorage.getItem("rememberMeData");
    if (storedData) {
        const data = JSON.parse(storedData);
        username.value = data.username;
        password.value = data.password;
        rememberMe.value = true;
    }
});

// Toggle password visibility
function togglePasswordVisibility() {
    passwordVisible.value = !passwordVisible.value;
}

// Form submission handler with validations
function handleSubmit() {
    errors.value = { username: "", password: "" };

    // Basic validations for username and password
    if (!username.value) errors.value.username = "Username is required";
    if (!password.value) errors.value.password = "Password is required";

    if (errors.value.username || errors.value.password) return;

    // Store data in localStorage if "Remember Me" is checked
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

    // Extract the first part of the username
    const userKey = username.value.split(" ")[0];
    userStore.setActiveUser(userKey);

    const userRef = dbRef(database, `users/${userKey}`);

    get(userRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const user = snapshot.val();
                if (
                    user.username === username.value &&
                    user.password === password.value
                ) {
                    notify("Login successful!", "success");
                    props.isLoggedIn(true);
                } else {
                    notify("Invalid username or password", "error");
                }
            } else {
                notify("User not found", "error");
            }
        })
        .catch(() => {
            notify("An error occurred while logging you in", "error");
        });
}
</script>

