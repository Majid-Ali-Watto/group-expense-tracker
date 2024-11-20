import { get, ref as Ref, remove, update, push } from "firebase/database";
import { database } from "../firebase";
import { startLoading, stopLoading } from "../utils/loading";
import { showError, showSuccess } from "../utils/showAlerts";
import { resetForm } from "../utils/reset-form";
import getCurrentMonth from "../utils/getCurrentMonth";
export default function useFireBase() {
	/**
	 * The function `dbRef` returns a reference to a specific location in a database based on the provided
	 * URL.
	 * @param url - The `url` parameter in the `dbRef` function is a string that represents the path or
	 * location in the database where you want to create a reference. This path can point to a specific
	 * node or location within the database structure.
	 * @returns The `dbRef` function is returning a reference to a location in the database specified by
	 * the `url` parameter.
	 */
	function dbRef(url) {
		return Ref(database, url);
	}

	/**
	 * The `read` function asynchronously reads data from a specified URL using Firebase Realtime Database
	 * and returns the value if it exists, otherwise returns null.
	 * @param url - The `url` parameter is a string that represents the URL of the database reference from
	 * which data needs to be read.
	 * @returns The function `read` returns the value of the snapshot if it exists, otherwise it returns
	 * `null`.
	 */
	async function read(url) {
		const loading = startLoading();
		const db_ref = dbRef(url);
		const snapshot = await get(db_ref);
		stopLoading(loading);
		return snapshot.exists() ? snapshot.val() : null;
	}

	/**
	 * The function `deleteData` sends a request to delete data from a specified URL and displays success
	 * or error messages accordingly.
	 * @param url - The `url` parameter in the `deleteData` function is the URL or path to the location in
	 * the database where the data needs to be deleted.
	 * @param message - The `message` parameter in the `deleteData` function is a message that will be
	 * displayed to the user to indicate the success of the deletion operation. It is typically a string
	 * that provides feedback to the user after the data has been successfully deleted from the specified
	 * URL in the database.
	 */
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
	/**
	 * The `updateData` function sends a request to update data at a specified URL, displaying success or
	 * error messages accordingly.
	 * @param url - The `url` parameter is the endpoint or location where the data will be updated. It is
	 * typically a string representing the URL of the API endpoint or database reference.
	 * @param getData - The `getData` parameter in the `updateData` function is a function that is expected
	 * to return the data that will be updated in the database. This function should be defined outside of
	 * the `updateData` function and passed as an argument when calling `updateData`.
	 * @param message - The `message` parameter in the `updateData` function is a message that will be
	 * displayed to indicate a successful operation after updating the data in the database.
	 */
	function updateData(url, getData, message) {
		const loading = startLoading();
		update(dbRef(url), getData())
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
	/**
	 * The `saveData` function saves data to a specified URL in a database, with additional logic for
	 * handling payments and expenses.
	 * @param url - The `url` parameter is the endpoint where the data will be saved in the database.
	 * @param getData - The `getData` parameter in the `saveData` function is a function that is expected
	 * to return the data that needs to be saved. This function is called within the `saveData` function to
	 * retrieve the data before saving it to the database.
	 * @param formRef - The `formRef` parameter in the `saveData` function is a reference to the form
	 * element that you want to reset after saving the data. This reference is used in the `resetForm`
	 * function to clear the form fields once the data has been successfully saved.
	 * @param message - The `message` parameter in the `saveData` function is a message that will be
	 * displayed to the user upon successful completion of saving the data. This message is typically a
	 * success message indicating that the data has been saved successfully.
	 */
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
