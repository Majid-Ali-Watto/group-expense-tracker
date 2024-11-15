export const rules = {
	username: [{ required: true, message: "Username is required", trigger: "blur" }],
	password: [{ required: true, message: "Password is required", trigger: "blur" }],
	amount: [
		{ required: true, message: "Amount is required", trigger: "blur" },
		{
			type: "number",
			min: 1,
			message: "Amount should be greater than zero",
			trigger: "blur"
		}
	],
	payer: [{ required: true, message: "Payer is required", trigger: "change" }],
	date: [{ required: true, message: "Date is required", trigger: "change" }],
	description: [
		{ required: true, message: "Description is required", trigger: "blur" },
		{
			min: 5,
			message: "Description should be at least 5 characters",
			trigger: "blur"
		}
	],
	loanAmount: [
		{ required: true, message: "Loan amount is required", trigger: "blur" },
		{
			type: "number",
			min: 1,
			message: "Amount cannot be negative or zero",
			trigger: "blur"
		}
	],
	loanGiver: [
		{
			required: true,
			message: "Loan giver is required",
			trigger: "change"
		}
	],
	loanReceiver: [
		{
			required: true,
			message: "Loan receiver is required",
			trigger: "change"
		}
	],
	loanDescription: [
		{ required: true, message: "Description is required", trigger: "blur" },
		{
			min: 5,
			message: "Description should be at least 5 characters",
			trigger: "blur"
		}
	],
	salary: [
		{
			required: true,
			message: "Salary is required",
			trigger: "blur"
		},
		{
			type: "number",
			min: 1,
			message: "Salary should be greater than zero",
			trigger: "blur"
		}
	]
};
