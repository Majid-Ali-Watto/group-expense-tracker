import { get, ref as Ref, remove, update, push } from "firebase/database";
import { database } from "../firebase";
import { startLoading, stopLoading } from "../utils/loading";
import { showError, showSuccess } from "../utils/showAlerts";
import { resetForm } from "../utils/reset-form";
import getCurrentMonth from "../utils/getCurrentMonth";
import { store } from "../stores/store";
export default function useFireBase() {
	function dbRef(url) {
		return Ref(database, url);
	}

	async function read(url) {
		const loading = startLoading();
		const db_ref = dbRef(url);
		const snapshot = await get(db_ref);
		stopLoading(loading);
		return snapshot.exists() ? snapshot.val() : null;
	}

	function deleteData(url, message) {
		const loading = startLoading();
		remove(dbRef(url))
			.then(() => {
				showSuccess(message);
			})
			.catch((error) => {
				showError(error.message);
			})
			.finally(() => {
				stopLoading(loading);
			});
	}
	function updateData(url, getData, formRef, message) {
		const formResetRef = store();
		console.log("🚀 -> file: firebase-apis.js:34 -> updateData -> formRef:", formResetRef.$state);
		const loading = startLoading();
		update(dbRef(url), getData())
			.then(() => {
				showSuccess(message);
				resetForm(formResetRef.$state.formResetRef);
			})
			.catch((error) => {
				showError(error.message);
			})
			.finally(() => {
				stopLoading(loading);
			});
	}

	function getNewData(formData) {
		return {
			amount: formData.amount,
			description: formData.description,
			location: formData.description,
			recipient: formData.payer,
			month: getCurrentMonth(),
			whoAdded: formData.whoAdded,
			date: formData.date,
			whenAdded: formData.whenAdded
		};
	}
	// Handle loan submission
	function saveData(url, getData, formRef, message) {
		const loading = startLoading();
		const data = getData();
		push(dbRef(url), data)
			.then(async () => {
				if (url === "payments") {
					const newUrl = `expenses/${data.payer.split(" ")[0]}/${getCurrentMonth()}`;
					await push(dbRef(newUrl), getNewData(data));
				}
				showSuccess(message);
				resetForm(formRef);
			})
			.catch((error) => {
				showError(error.message);
			})
			.finally(() => {
				stopLoading(loading);
			});
	}
	return {
		dbRef,
		read,
		deleteData,
		updateData,
		saveData
	};
}
