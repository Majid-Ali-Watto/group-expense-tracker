import { ElNotification } from "element-plus";
export function notify(message = "", type = "info") {
	ElNotification({
		message,
		type,
		duration: 3000,
		showClose: true,
		center: true
	});
}
