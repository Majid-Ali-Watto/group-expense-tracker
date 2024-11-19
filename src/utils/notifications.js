import { ElMessageBox } from "element-plus";
import { downloadPDF } from "./downloadDataProcedures";
import { showError, showSuccess } from "./showAlerts";
import getCurrentMonth from "./getCurrentMonth";
import { store } from "../stores/store";
import { LAST_DAY, MIDDLE_DAY } from "../assets/data";

export function checkLastDayOfMonth() {
	const today = new Date();
	const tomorrow = new Date(today);
	tomorrow.setDate(today.getDate() + 1);
	const isDownloaded = JSON.parse(localStorage.getItem("isDownloaded"));
	const lastDay = LAST_DAY || 1; // Default to 1 if undefined
	const middleDay = MIDDLE_DAY || 15; // Default to 15 if undefined
	if (tomorrow.getDate() === lastDay && !isDownloaded) {
		return "Today is the last day of the month!";
	} else if (tomorrow.getDate() === middleDay && !isDownloaded) {
		return "Half month passed!";
	}
	// Reset the flag if it's neither the last nor middle day
	if (![lastDay, middleDay].includes(tomorrow.getDate())) {
		localStorage.removeItem("isDownloaded");
	}
	return null;
}

async function confirmDownload(res, pdfContent) {
	try {
		await ElMessageBox.confirm(`${res} Download Expenses PDF?`, "Important Note", {
			confirmButtonText: "OK",
			cancelButtonText: "Cancel",
			type: "info"
		});

		const storePermissions = store();
		await showSuccess("PDF downloading started");
		// Sequential downloads
		await downloadPDF(pdfContent.value, `${getCurrentMonth()}_Expenses_`);
		await downloadPDF(storePermissions.$state.loansRef, `${getCurrentMonth()}_Loans_`);
		await downloadPDF(storePermissions.$state.salaryRef, `${getCurrentMonth()}_Salary_Expense_`);
		localStorage.setItem("isDownloaded", true);
	} catch (error) {
		if (error !== "cancel") {
			showError(error.message || "An unexpected error occurred.");
		} else if (error === "cancel") localStorage.setItem("isDownloaded", true);
	}
}

export function checkDaily(pdfContent) {
	// Immediate check
	const res = checkLastDayOfMonth();
	if (res) {
		confirmDownload(res, pdfContent);
	}

	// Single interval instance
	if (!window.dailyCheckInterval) {
		window.dailyCheckInterval = setInterval(() => {
			const res = checkLastDayOfMonth();
			if (res) {
				confirmDownload(res, pdfContent);
			}
		}, 24 * 60 * 60 * 1000); // Check every 24 hours
	}
}
