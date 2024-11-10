<template>
    <!-- Add New Loan Section -->
    <fieldset class="border border-gray-300 rounded-lg p-4">
        <legend class="text-xl font-semibold px-2">Add New Loan</legend>

        <el-form
            :model="formData"
            :rules="rules"
            ref="loanForm"
            @submit.prevent="handleLoanSubmit"
            label-position="top"
            class="space-y-4"
        >
            <el-row :gutter="20">
                <!-- Column for Loan Amount, Giver, and Receiver -->
                <el-col :lg="12" :md="12" :sm="24">
                    <el-form-item
                        label="Loan Amount"
                        prop="loanAmount"
                        required
                    >
                        <el-input
                            v-model.number="formData.loanAmount"
                            type="number"
                            placeholder="Enter loan amount"
                            class="w-full"
                        />
                    </el-form-item>

                    <el-form-item label="Loan Giver" prop="loanGiver" required>
                        <el-select
                            v-model="formData.loanGiver"
                            placeholder="Select loan giver"
                            class="w-full"
                        >
                            <el-option
                                v-for="friend in friends"
                                :key="friend"
                                :label="friend"
                                :value="friend"
                            />
                        </el-select>
                    </el-form-item>

                    <el-form-item
                        label="Loan Receiver"
                        prop="loanReceiver"
                        required
                    >
                        <el-select
                            v-model="formData.loanReceiver"
                            placeholder="Select loan receiver"
                            class="w-full"
                        >
                            <el-option
                                v-for="friend in friends"
                                :key="friend"
                                :label="friend"
                                :value="friend"
                            />
                        </el-select>
                    </el-form-item>
                </el-col>

                <!-- Column for Loan Description -->
                <el-col :lg="12" :md="12" :sm="24">
                    <el-form-item
                        label="Description"
                        prop="loanDescription"
                        required
                    >
                        <el-input
                            rows="8"
                            v-model="formData.loanDescription"
                            type="textarea"
                            placeholder="Loan details"
                            class="w-full"
                        />
                    </el-form-item>
                </el-col>
            </el-row>

            <!-- Submit Button -->
            <el-form-item>
                <el-button
                    type="primary"
                    class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg"
                    @click="validateForm"
                >
                    Add Loan
                </el-button>
            </el-form-item>
        </el-form>
    </fieldset>
</template>


<script setup>
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { database, push, ref as dbRef } from "../firebase"; // Firebase setup

const props = defineProps({
    friends: Array,
});


const loanForm = ref(null);

// Form data model
const formData = ref({
    loanAmount: null,
    loanGiver: "",
    loanReceiver: "",
    loanDescription: "",
});


// Validation rules
const rules = {
    loanAmount: [
        { required: true, message: "Loan amount is required", trigger: "blur" },
        {
            type: "number",
            min: 1,
            message: "Amount cannot be negative or zero",
            trigger: "blur",
        },
    ],
    loanGiver: [
        {
            required: true,
            message: "Loan giver is required",
            trigger: "change",
        },
    ],
    loanReceiver: [
        {
            required: true,
            message: "Loan receiver is required",
            trigger: "change",
        },
    ],
    loanDescription: [
        { required: true, message: "Description is required", trigger: "blur" },
        {
            min: 5,
            message: "Description should be at least 5 characters",
            trigger: "blur",
        },
    ],
};

// Handle form submission with validation
const validateForm = () => {
    loanForm.value.validate((valid) => {
        if (valid) {
            handleLoanSubmit();
        } else {
            console.log("Form validation failed");
        }
    });
};
// Handle loan submission
function handleLoanSubmit() {
    const storedData = localStorage.getItem("rememberMeData");
    let whoAdded = "";
    if (storedData) {
        const data = JSON.parse(storedData);
        whoAdded = data.username;
    }
    const loan = {
        amount: formData.value.loanAmount,
        description: formData.value.loanDescription,
        giver: formData.value.loanGiver,
        receiver: formData.value.loanReceiver,
        date:
            new Date().toLocaleDateString("en-PK") +
            " " +
            new Date().toLocaleTimeString(),
        whoAdded,
    };

    push(dbRef(database, "loans"), loan)
        .then(() => {
            ElMessage.success("Loan added successfully.");
            // Clear form
            formData.value.loanAmount = null;
            formData.value.loanDescription = "";
            formData.value.loanGiver = "";
            formData.value.loanReceiver = "";
        })
        .catch((error) => {
            ElMessage.error("Error saving loan: " + error.message);
        });
}
</script>

<style scoped>
@import "tailwindcss/tailwind.css";

/* Styling for responsive adjustments */
.el-button {
    padding: 10px 20px;
    font-size: 1rem;
}
</style>
