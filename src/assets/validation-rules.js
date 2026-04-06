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
      message: 'Mobile number must be 11 digits starting with 03',
      trigger: 'blur'
    }
  ],
  email: [
    { required: true, message: 'Email is required', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value) return callback()
        // More strict email validation:
        // - At least 3 characters before @
        // - Domain must have at least 2 characters
        // - TLD must have at least 2 characters
        const emailPattern =
          /^[a-zA-Z0-9._-]{3,}@[a-zA-Z0-9.-]{2,}\.[a-zA-Z]{2,}$/
        if (!emailPattern.test(value.trim())) {
          callback(
            new Error(
              'Please enter a valid email address (e.g., user@example.com)'
            )
          )
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  password: [
    { required: true, message: 'Password is required', trigger: 'blur' },
    {
      min: 6,
      message: 'Password must be at least 6 characters',
      trigger: 'blur'
    },
    {
      max: 15,
      message: 'Password must not exceed 15 characters',
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
  category: [
    { required: true, message: 'Category is required', trigger: 'change' }
  ],
  description: [
    { required: true, message: 'Description is required', trigger: 'blur' },
    {
      min: 5,
      message: 'Description should be at least 5 characters',
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
      min: 5,
      message: 'Loan giver should be at least 5 characters',
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
  loanGiverMobile: [
    { required: true, message: 'Giver mobile is required', trigger: 'blur' },
    {
      pattern: /^03\d{9}$/,
      message: 'Mobile must be 11 digits starting with 03',
      trigger: 'blur'
    }
  ],
  loanReceiverMobile: [
    { required: true, message: 'Receiver mobile is required', trigger: 'blur' },
    {
      pattern: /^03\d{9}$/,
      message: 'Mobile must be 11 digits starting with 03',
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
      min: 5,
      message: 'Location should be at least 5 characters',
      trigger: 'blur'
    }
  ],
  recipient: [
    { required: true, message: 'Recipient is required', trigger: 'blur' },
    {
      min: 5,
      message: 'Recipient should be at least 5 characters',
      trigger: 'blur'
    }
  ]
}

export const groupRules = {
  name: [
    { required: true, message: 'Group name is required', trigger: 'blur' },
    {
      min: 5,
      message: 'Group name should be at least 5 characters',
      trigger: 'blur',
      max: 50
    }
  ],
  members: [
    {
      type: 'array',
      required: true,
      min: 1,
      message: 'At least one member is required',
      trigger: 'change'
    }
  ]
}
