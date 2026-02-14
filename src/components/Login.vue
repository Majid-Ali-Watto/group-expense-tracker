<template>
  <div
    class="flex flex-col items-center p-6 max-w-sm mx-auto border rounded-lg shadow-xl bg-white"
  >
    <el-form
      :model="form"
      :rules="rules"
      ref="loginForm"
      label-position="top"
      class="w-full"
    >
      <fieldset class="w-full p-4 border rounded-lg">
        <legend>Login / Register</legend>
        <!-- Full Name -->
        <el-form-item label="Full Name" prop="name">
          <el-input
            v-model="form.name"
            placeholder="Enter your full name"
            class="w-full border-gray-300 focus:ring-blue-200 focus:border-blue-300"
            size="large"
          />
        </el-form-item>
        <!-- Mobile Number -->
        <el-form-item label="Mobile Number" prop="mobile">
          <el-input
            v-model="form.mobile"
            placeholder="Enter your mobile number"
            class="w-full border-gray-300 focus:ring-blue-200 focus:border-blue-300"
            size="large"
          />
        </el-form-item>
        <div class="flex justify-between">
          <!-- Remember Me -->
          <el-checkbox
            v-model="form.rememberMe"
            label="Remember Me"
            class="text-sm text-gray-700 mb-4"
          ></el-checkbox>
          <!-- Submit Button -->
          <GenericButton @click="handleSubmit" type="success">
            Login / Continue</GenericButton
          >
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
import {
  getStoredUser,
  removeUserFromStorage,
  setUserInStorage,
} from "../utils/whoAdded";
const userStore = store();
const props = defineProps({
  isLoggedIn: Function,
});

const { read, updateData } = useFireBase();
// Define form data
const form = ref({
  name: "",
  mobile: "",
  rememberMe: false,
});

// Reference to the form for validation
const loginForm = ref(null);

// Retrieve stored data if "Remember Me" was checked
onMounted(() => {
  const data = getStoredUser();
  if (data) {
    form.value.name = data.name || "";
    form.value.mobile = data.mobile || "";
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

    const mobileKey = form.value.mobile;
    if (!mobileKey) return showError("Mobile number is required");
    userStore.setActiveUser(mobileKey);

    try {
      const user = await read(`users/${mobileKey}`);
      if (user) {
        // If exists, proceed
        showSuccess("Login successful!");
        userStore.addUser({ name: user.name, mobile: mobileKey });
        // set active group if user belongs to any
        const groups = userStore.getGroups || [];
        const myGroup = groups.find((g) =>
          (g.members || []).some((m) => m.mobile === mobileKey),
        );
        if (myGroup) userStore.setActiveGroup(myGroup.id);
        props.isLoggedIn(true);
      } else {
        // register new user using provided name
        const payload = { name: form.value.name || "", mobile: mobileKey };
        const getData = () => payload;
        updateData(`users/${mobileKey}`, getData, "User registered");
        userStore.addUser(payload);
        // attempt to set default group
        const groups = userStore.getGroups || [];
        const myGroup = groups.find((g) =>
          (g.members || []).some((m) => m.mobile === mobileKey),
        );
        if (myGroup) userStore.setActiveGroup(myGroup.id);
        showSuccess("User registered and logged in");
        props.isLoggedIn(true);
      }
    } catch (error) {
      showError(error || "An error occurred while logging you in");
    }
  });
}
</script>
