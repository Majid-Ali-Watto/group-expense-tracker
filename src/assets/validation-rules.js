import en from '@/i18n/locales/en'
import ur from '@/i18n/locales/ur'

const VALIDATION_MESSAGES = { en: en.validation, ur: ur.validation }

export function getLoginRules(locale = 'en') {
  const m = VALIDATION_MESSAGES[locale] || VALIDATION_MESSAGES.en

  return {
    name: [
      { required: true, message: m.nameRequired, trigger: 'blur' },
      {
        min: 3,
        message: m.nameMinLength,
        trigger: 'blur'
      },
      {
        validator: (rule, value, callback) => {
          if (!value) return callback()
          // Only alphabets and single spaces allowed
          const namePattern = /^[a-zA-Z]+(\s[a-zA-Z]+)*$/
          if (!namePattern.test(value.trim())) {
            callback(new Error(m.nameAlphaOnly))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ],
    mobile: [
      { required: true, message: m.mobileRequired, trigger: 'blur' },
      {
        pattern: /^03\d{9}$/,
        message: m.mobilePattern,
        trigger: 'blur'
      }
    ],
    email: [
      { required: true, message: m.emailRequired, trigger: 'blur' },
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
            callback(new Error(m.emailPattern))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ],
    password: [
      { required: true, message: m.passwordRequired, trigger: 'blur' },
      {
        min: 6,
        message: m.passwordMin,
        trigger: 'blur'
      },
      {
        max: 15,
        message: m.passwordMax,
        trigger: 'blur'
      }
    ]
  }
}

export const loginRules = getLoginRules('en')

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
