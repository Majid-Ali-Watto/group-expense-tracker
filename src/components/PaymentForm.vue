<template>
    <fieldset class="border border-gray-300 rounded-lg p-4">
        <legend>Transaction Details</legend>
        <el-form
            :model="formData"
            :rules="rules"
            ref="transactionForm"
            label-position="top"
            class="space-y-4"
        >
            <el-row :gutter="20">
                <!-- Left Column -->
                <el-col :lg="12" :md="12" :sm="24">
                    <!-- Amount Input -->
                    <el-form-item label="Amount" prop="amount" required>
                        <el-input
                            v-model.number="formData.amount"
                            type="number"
                            placeholder="0.00"
                            class="w-full"
                        />
                    </el-form-item>

                    <!-- Payer Selection -->
                    <el-form-item label="Payer" prop="payer" required>
                        <el-select
                            v-model="formData.payer"
                            placeholder="Select payer"
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

                    <!-- Date Selection -->
                    <el-form-item label="Date" prop="date" required>
                        <el-date-picker
                            v-model="formData.date"
                            type="datetime"
                            :placeholder="formData.date"
                            format="YYYY/MM/DD hh:mm:ss"
                            value-format="YYYY-MM-DD HH:mm:ss"
                            class="w-full"
                        />
                    </el-form-item>
                </el-col>

                <!-- Right Column -->
                <el-col :lg="12" :md="12" :sm="24">
                    <!-- Description Textarea -->
                    <el-form-item
                        label="Description"
                        prop="description"
                        required
                    >
                        <el-input
                            v-model="formData.description"
                            type="textarea"
                            placeholder="Enter description"
                            class="w-full"
                            rows="8"
                        />
                    </el-form-item>
                </el-col>
            </el-row>

            <!-- Submit Button -->
            <el-form-item>
                <el-button
                    v-if="isVisible"
                    type="success"
                    class="text-white py-2 rounded-lg"
                    @click="() => validateForm()"
                >
                    Add Payment
                </el-button>
                <el-button
                    v-if="!isVisible"
                    type="warning"
                    class="text-white py-2 rounded-lg"
                    @click="() => validateForm('Update')"
                    >Update</el-button
                >
                <el-button
                    v-if="!isVisible"
                    class="text-white py-2 rounded-lg"
                    type="danger"
                    @click="() => validateForm('Delete')"
                >
                    Delete
                </el-button>
            </el-form-item>
        </el-form>
    </fieldset>
</template>

<script setup>
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { database, push, ref as dbRef, update, remove } from "../firebase"; // Firebase setup
const emit = defineEmits(["closeModal"]);
const props = defineProps({
    friends: Array,
    row: Object,
});
const isVisible = ref(true);
// Form data model
const formData = ref({
    amount: null,
    description: "",
    payer: "",
    date: "",
});
// Watch for changes in `row` prop and update formData
watch(
    () => props.row,
    (newRow) => {
        formData.value.amount = newRow?.amount ?? null;
        formData.value.description = newRow?.description ?? "";
        formData.value.payer = newRow?.payer ?? "";
        formData.value.date = newRow?.date ?? "";
        isVisible.value = !newRow?.amount;
    },
    { immediate: true, deep: true }
);
// Validation rules
const rules = {
    amount: [
        { required: true, message: "Amount is required", trigger: "blur" },
        {
            type: "number",
            min: 1,
            message: "Amount should be greater than zero",
            trigger: "blur",
        },
    ],
    payer: [
        { required: true, message: "Payer is required", trigger: "change" },
    ],
    date: [{ required: true, message: "Date is required", trigger: "change" }],
    description: [
        { required: true, message: "Description is required", trigger: "blur" },
        {
            min: 5,
            message: "Description should be at least 5 characters",
            trigger: "blur",
        },
    ],
};

// Form submission handler
const transactionForm = ref(null);

const validateForm = (whatTask = "Save") => {
    transactionForm.value.validate((valid) => {
        if (valid) {
            if (whatTask == "Save") {
                handleSubmit();
            } else if (whatTask == "Update") {
                updatePayment(props.row.id);
                emit("closeModal");
            } else if (whatTask == "Delete") {
                deletePayment(props.row.id);
                emit("closeModal");
            }
        }
    });
};

function deletePayment(paymentId) {
    console.log("payment Id: ", paymentId);
    const paymentRef = dbRef(database, `payments/${paymentId}`); // Reference to the specific payment node
    console.log(paymentRef);
    remove(paymentRef)
        .then(() => {
            ElMessage.success(
                `Payment record with ID ${paymentId} deleted successfully`
            );
        })
        .catch((error) => {
            ElMessage.error("Error deleting payment record:" + error);
        });
}
function updatePayment(paymentId) {
    const paymentRef = dbRef(database, `payments/${paymentId}`); // Reference to the specific payment node
    update(paymentRef, getPaymentData())
        .then(() => {
            ElMessage.success(
                `Payment record with ID ${paymentId} updated successfully`
            );
            resetForm();
        })
        .catch((error) => {
            ElMessage.error("Error updating payment record: " + error);
        });
}

function handleSubmit() {
    // Log data and push to Firebase

    push(dbRef(database, "payments"), getPaymentData())
        .then(() => {
            // Clear form fields after successful submission
            resetForm();
            ElMessage.success("Transaction successfully saved.");
        })
        .catch((error) => {
            ElMessage.error("Error saving payment: " + error.message);
        });
}
function getPaymentData() {
    const storedData = localStorage.getItem("rememberMeData");
    let whoAdded = "";
    if (storedData) {
        const data = JSON.parse(storedData);
        whoAdded = data.username;
    }
    const payment = {
        amount: parseFloat(formData.value.amount),
        description: formData.value.description,
        payer: formData.value.payer,
        date: new Date(formData.value.date).toLocaleString("en-PK"),
        whoAdded,
    };
    return payment;
}
function resetForm() {
    formData.value.amount = null;
    formData.value.description = "";
    formData.value.date = "";
    formData.value.payer = "";
}
</script>
