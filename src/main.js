import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import "./main.css";
import { toCapitalize } from "./utils/string-formatting";
const app = createApp(App);
const PKR = new Intl.NumberFormat("en-PK", {
	style: "currency",
	currency: "PKR",
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});

const formatAmount = (amount) => {
	return PKR.format(amount);
};
app.provide("formatAmount", formatAmount);
String.prototype.toCapitalize = toCapitalize;
app.use(ElementPlus);
app.use(createPinia());
app.mount("#app");
