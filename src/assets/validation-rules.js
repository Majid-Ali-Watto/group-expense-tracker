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
	],

	location: [
		{
			required: true,
			message: "Location is required",
			trigger: "blur"
		}
	],
	recipient: [
		{
			required: true,
			message: "Recipient is required",
			trigger: "blur"
		}
	]
};
