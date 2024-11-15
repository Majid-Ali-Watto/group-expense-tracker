<template>
	<div class="flex flex-col items-center p-6 max-w-sm mx-auto border rounded-lg shadow-xl bg-white">
		<el-form :model="form" :rules="rules" ref="loginForm" label-position="top" class="w-full">
			<fieldset class="w-full p-4 border rounded-lg">
				<legend>Welcome Back</legend>

				<!-- User Name -->
				<el-form-item label="User Name" prop="username">
					<el-input v-model="form.username" placeholder="Enter your username" class="w-full border-gray-300 focus:ring-blue-200 focus:border-blue-300" size="large" />
				</el-form-item>

				<!-- Password with Toggle -->
				<el-form-item label="Password" prop="password">
					<el-input v-model="form.password" type="password" placeholder="Enter your password" class="w-full border-gray-300 focus:ring-blue-200 focus:border-blue-300" size="large" show-password />
				</el-form-item>

				<!-- Remember Me -->
				<el-checkbox v-model="form.rememberMe" label="Remember Me" class="text-sm text-gray-700 mb-4"></el-checkbox>

				<!-- Submit Button -->
				<el-button @click="handleSubmit" type="success" class="w-full py-2 rounded-lg text-white focus:ring focus:ring-blue-200" size="large"> Login </el-button>
			</fieldset>
		</el-form>
	</div>
</template>
<script setup>
	import { onMounted, ref } from "vue";
	import { get } from "../firebase";
	import useFireBase from "../api/firebase-apis";
	import { store } from "../stores/store";
	import { notify } from "../utils/showAlert";
	import { showError } from "../utils/showAlerts";
	import { getStoredUser, removeUserFromStorage, setUserInStorage } from "../utils/whoAdded";
	import { rules } from "../assets/validation-rules";
	const userStore = store();
	const props = defineProps({
		isLoggedIn: Function
	});

	const { read } = useFireBase();
	// Define form data
	const form = ref({
		username: "",
		password: "",
		rememberMe: false
	});

	// Reference to the form for validation
	const loginForm = ref(null);

	// Retrieve stored data if "Remember Me" was checked
	onMounted(() => {
		const data = getStoredUser();
		if (data) {
			form.value.username = data.username;
			form.value.password = data.password;
			form.value.rememberMe = true;
		}
	});

	// Form submission handler
	function handleSubmit() {
		loginForm.value.validate(async (valid) => {
			if (!valid) return;

			// Store data in localStorage if "Remember Me" is checked
			if (form.value.rememberMe) setUserInStorage(form);
			else removeUserFromStorage();

			// Extract the first part of the username
			const userKey = form.value.username.split(" ")[0];
			userStore.setActiveUser(userKey);

			try {
				const user = await read(`users/${userKey}`);
				if (user) {
					if (user.username === form.value.username && user.password === form.value.password) {
						notify("Login successful!", "success");
						props.isLoggedIn(true);
					} else {
						throw "Invalid username or password";
					}
				} else {
					throw "User not found";
				}
			} catch (error) {
				showError(error || "An error occurred while logging you in");
			}
		});
	}
</script>
