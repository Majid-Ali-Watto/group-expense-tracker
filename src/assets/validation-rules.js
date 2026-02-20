export const loginRules = {
  name: [
    { required: true, message: 'Full name is required', trigger: 'blur' },
    {
      min: 3,
      message: 'Name should be at least 3 characters',
      trigger: 'blur'
    },
    {
      validator: (rule, value, callback) => {
        if (!value) return callback()
        // Only alphabets and single spaces allowed
        const namePattern = /^[a-zA-Z]+(\s[a-zA-Z]+)*$/
        if (!namePattern.test(value.trim())) {
          callback(
            new Error('Name can only contain alphabets and single spaces')
          )
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  mobile: [
    { required: true, message: 'Mobile number is required', trigger: 'blur' },
    {
      pattern: /^03\d{9}$/,
      message:
        'Mobile number must be 11 digits starting with 03 (e.g., 03009090909)',
      trigger: 'blur'
    }
  ],
  loginCode: [
    { required: true, message: 'Login code is required', trigger: 'blur' },
    {
      min: 4,
      message: 'Login code must be at least 4 characters',
      trigger: 'blur'
    },
    {
      max: 15,
      message: 'Login code must not exceed 15 characters',
      trigger: 'blur'
    }
  ]
}

export const rules = {
  amount: [
    { required: true, message: 'Amount is required', trigger: 'blur' },
    {
      type: 'number',
      min: 1,
      message: 'Amount should be greater than zero',
      trigger: 'blur'
    }
  ],
  payer: [{ required: true, message: 'Payer is required', trigger: 'change' }],
  participants: [
    {
      type: 'array',
      required: true,
      min: 1,
      message: 'At least one participant is required',
      trigger: 'change'
    }
  ],
  date: [{ required: true, message: 'Date is required', trigger: 'change' }],
  description: [
    { required: true, message: 'Description is required', trigger: 'blur' },
    {
      min: 3,
      message: 'Description should be at least 3 characters',
      trigger: 'blur'
    }
  ],

  loanGiver: [
    {
      required: true,
      message: 'Loan giver is required',
      trigger: ['change', 'blur']
    },
    {
      min: 2,
      message: 'Loan giver should be at least 2 characters',
      trigger: 'blur'
    }
  ],
  loanReceiver: [
    {
      required: true,
      message: 'Loan receiver is required',
      trigger: ['change', 'blur']
    },
    {
      min: 2,
      message: 'Loan receiver should be at least 2 characters',
      trigger: 'blur'
    }
  ],

  salary: [
    { required: true, message: 'Salary is required', trigger: 'blur' },
    {
      type: 'number',
      min: 1,
      message: 'Salary should be greater than zero',
      trigger: 'blur'
    }
  ],

  location: [
    { required: true, message: 'Location is required', trigger: 'blur' },
    {
      min: 2,
      message: 'Location should be at least 2 characters',
      trigger: 'blur'
    }
  ],
  recipient: [
    { required: true, message: 'Recipient is required', trigger: 'blur' },
    {
      min: 2,
      message: 'Recipient should be at least 2 characters',
      trigger: 'blur'
    }
  ]
}

export const groupRules = {
  name: [
    { required: true, message: 'Group name is required', trigger: 'blur' },
    {
      min: 2,
      message: 'Group name should be at least 2 characters',
      trigger: 'blur'
    }
  ],
  members: [
    {
      type: 'array',
      required: true,
      min: 2,
      message: 'At least two members are required',
      trigger: 'change'
    }
  ]
}
