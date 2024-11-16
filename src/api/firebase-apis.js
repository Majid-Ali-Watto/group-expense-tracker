import { get, ref as fRef, remove, update, push } from "firebase/database";
import { database } from "../firebase";
import { startLoading, stopLoading } from "../utils/loading";
import { showError, showSuccess } from "../utils/showAlerts";
import { resetForm } from "../utils/reset-form";

export default function useFireBase() {
	function dbRef(url) {
		return fRef(database, url);
	}

	async function read(url) {
		const loading = startLoading();
		const db_ref = dbRef(url);
		const snapshot = await get(db_ref);
		stopLoading(loading);
		return snapshot.exists() ? snapshot.val() : null;
	}

	function deleteData(url, message) {
		remove(dbRef(url))
			.then(() => {
				showSuccess(message);
			})
			.catch((error) => {
				showError(error.message);
			});
	}
	function updateData(url, getData, formRef, message) {
		update(dbRef(url), getData())
			.then(() => {
				showSuccess(message);
				resetForm(formRef);
			})
			.catch((error) => {
				showError(error.message);
			});
	}

	// Handle loan submission
	function saveData(url, getData, formRef, message) {
		push(dbRef(url), getData())
			.then(() => {
				showSuccess(message);
				resetForm(formRef);
			})
			.catch((error) => {
				showError(error.message);
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
