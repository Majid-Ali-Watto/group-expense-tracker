import { ElMessage } from "element-plus";
const options = {
	showClose: true,
	center: true
	// plain: true
};
/**
 * The function `showSuccess` displays a success message using the ElMessage component.
 * @param message - The `message` parameter is a string that represents the success message that you
 * want to display to the user.
 */
async function showSuccess(message = "") {
	return new Promise((resolve) => {
		ElMessage({
			message,
			type: "success",
			...options
		});
		// Add a slight delay if needed for animations
		setTimeout(resolve, 500); // Adjust the timeout to match the animation duration
	});
}

/**
 * The function showError displays an error message using the ElMessage component.
 * @param message - The `message` parameter is a string that represents the error message to be
 * displayed.
 */
function showError(message = "") {
	// ElMessage.error(message);
	ElMessage({
		message,
		type: "error",
		...options
	});
}
export { showError, showSuccess };
