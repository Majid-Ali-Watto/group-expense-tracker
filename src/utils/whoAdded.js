export function getStoredUser() {
	const storedData = localStorage.getItem("rememberMeData");
	if (storedData) {
		return JSON.parse(storedData);
	}
	return "";
}
export function setUserInStorage(form) {
	localStorage.setItem(
		"rememberMeData",
		JSON.stringify({
			username: form.value.username,
			password: form.value.password
		})
	);
}
export function removeUserFromStorage(){
	localStorage.removeItem("rememberMeData");
}
export default function getWhoAddedTransaction() {
	const user = getStoredUser();
	return user?.username || "";
}
