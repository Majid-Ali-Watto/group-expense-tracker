import { ElMessage } from "element-plus";
/**
 * The function `showSuccess` displays a success message using the ElMessage component.
 * @param message - The `message` parameter is a string that represents the success message that you
 * want to display to the user.
 */
function showSuccess(message = "") {
	ElMessage.success(message);
}
/**
 * The function showError displays an error message using the ElMessage component.
 * @param message - The `message` parameter is a string that represents the error message to be
 * displayed.
 */
function showError(message = "") {
	ElMessage.error(message);
}
export { showError, showSuccess };
