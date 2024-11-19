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
				<div class="flex justify-between">
					<!-- Remember Me -->
					<el-checkbox v-model="form.rememberMe" label="Remember Me" class="text-sm text-gray-700 mb-4"></el-checkbox>
					<!-- Submit Button -->
					<GenericButton @click="handleSubmit" type="success"> Login</GenericButton>
				</div>
			</fieldset>
		</el-form>
	</div>
</template>
<script setup>
	import { onMounted, ref } from "vue";
	import useFireBase from "../api/firebase-apis";
	import { rules } from "../assets/validation-rules";
	import { store } from "../stores/store";
	import { showError, showSuccess } from "../utils/showAlerts";
	import { GenericButton } from "../components/generic-components";
	import { getStoredUser, removeUserFromStorage, setUserInStorage } from "../utils/whoAdded";
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
						showSuccess("Login successful!");
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
