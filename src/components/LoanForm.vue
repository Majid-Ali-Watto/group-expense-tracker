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
                    v-if="isVisible"
                    type="primary"
                    class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg"
                    @click="()=>validateForm()"
                >
                    Add Loan
                </el-button>
                <el-button
                    v-if="!isVisible"
                    type="warning"
                    class="w-16 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg"
                    @click="() => validateForm('Update')"
                    >Update</el-button
                >
                <el-button
                    v-if="!isVisible"
                    class="w-16 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg"
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
import { database, push, ref as dbRef, remove ,update} from "../firebase"; // Firebase setup
const emit = defineEmits(["closeModal"]);
const props = defineProps({
    friends: Array,
    row: Object,
});

const loanForm = ref(null);
const isVisible = ref(true);
console.log(props.row);
// Form data model
const formData = ref({
    loanAmount: null,
    loanGiver: "",
    loanReceiver: "",
    loanDescription: "",
});
// Watch for changes in `row` prop and update formData
watch(
    () => props.row,
    (newRow) => {
        formData.value.loanAmount = newRow?.amount ?? null;
        formData.value.loanGiver = newRow?.giver ?? "";
        formData.value.loanReceiver = newRow?.receiver ?? "";
        formData.value.loanDescription = newRow?.description ?? "";
        isVisible.value = !newRow?.amount;
    },
    { immediate: true, deep: true }
);
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
const validateForm = (whatTask = "Save") => {
    loanForm.value.validate((valid) => {
        if (valid) {
            if (whatTask == "Save") {
                handleLoanSubmit();
            } else if (whatTask == "Update") {
                console.log("Update");
                updateLoan(props.row.id);
                emit("closeModal");
            } else if (whatTask == "Delete") {
                deleteLoan(props.row.id);
                emit("closeModal");
            }
        }
    });
};
function deleteLoan(loanId) {
    console.log("loan Id: ", loanId);
    const loanRef = dbRef(database, `loans/${loanId}`); // Reference to the specific loan node
    console.log(loanRef);
    remove(loanRef)
        .then(() => {
            ElMessage.success(
                `Loan record with ID ${loanId} deleted successfully`
            );
        })
        .catch((error) => {
            ElMessage.error("Error deleting loan record:" + error);
        });
}
function updateLoan(loanId) {
    const loanRef = dbRef(database, `loans/${loanId}`); // Reference to the specific loan node
    update(loanRef, getLoanData())
        .then(() => {
            ElMessage.success(
                `Loan record with ID ${loanId} updated successfully`
            );
            resetForm();
        })
        .catch((error) => {
            ElMessage.error("Error updating loan record: " + error);
        });
}

// Handle loan submission
function handleLoanSubmit() {
    push(dbRef(database, "loans"), getLoanData())
        .then(() => {
            ElMessage.success("Loan added successfully.");
            // Clear form
            resetForm();
        })
        .catch((error) => {
            ElMessage.error("Error saving loan: " + error.message);
        });
}
function getLoanData() {
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
    return loan;
}
function resetForm() {
    formData.value.loanAmount = null;
    formData.value.loanDescription = "";
    formData.value.loanGiver = "";
    formData.value.loanReceiver = "";
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
