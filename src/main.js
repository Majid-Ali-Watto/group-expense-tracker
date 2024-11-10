// main.ts
import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import App from "./App.vue";
import "./main.css";
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
app.use(ElementPlus);
app.mount("#app");
