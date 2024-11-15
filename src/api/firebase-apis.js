import { get, ref } from "firebase/database";
import { database } from "../firebase";
export default function useFireBase() {
	function dbRef(url) {
		return ref(database, url);
	}

	async function read(url) {
		const db_ref = dbRef(url);
		const snapshot = await get(db_ref);
		return snapshot.exists() ? snapshot.val() : null;
	}

	return {
		dbRef,
		read
	};
}
