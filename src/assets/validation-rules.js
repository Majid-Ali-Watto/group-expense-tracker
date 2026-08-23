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

// Both below were plain objects with hard-coded English messages — every
// form using them (expenses, salary, loans, group create/edit) showed raw
// English validation errors regardless of the active locale. Converted to
// locale-aware functions mirroring getLoginRules() above; call sites now
// resolve them reactively via `computed(() => getRules(locale.value))`,
// same pattern as Login.vue's `loginRules`.
export function getRules(locale = 'en') {
  const m = VALIDATION_MESSAGES[locale] || VALIDATION_MESSAGES.en

  return {
    amount: [
      { required: true, message: m.amountRequired, trigger: 'blur' },
      {
        type: 'number',
        min: 1,
        message: m.amountMin,
        trigger: 'blur'
      }
    ],
    payer: [{ required: true, message: m.payerRequired, trigger: 'change' }],
    participants: [
      {
        type: 'array',
        required: true,
        min: 1,
        message: m.participantsRequired,
        trigger: 'change'
      }
    ],
    date: [{ required: true, message: m.dateRequired, trigger: 'change' }],
    category: [
      { required: true, message: m.categoryRequired, trigger: 'change' }
    ],
    description: [
      { required: true, message: m.descriptionRequired, trigger: 'blur' },
      {
        min: 5,
        message: m.descriptionMinLength,
        trigger: 'blur'
      }
    ],

    loanGiver: [
      {
        required: true,
        message: m.loanGiverRequired,
        trigger: ['change', 'blur']
      },
      {
        min: 5,
        message: m.loanGiverMinLength,
        trigger: 'blur'
      }
    ],
    loanReceiver: [
      {
        required: true,
        message: m.loanReceiverRequired,
        trigger: ['change', 'blur']
      },
      {
        min: 2,
        message: m.loanReceiverMinLength,
        trigger: 'blur'
      }
    ],
    loanGiverMobile: [
      { required: true, message: m.giverMobileRequired, trigger: 'blur' },
      {
        pattern: /^03\d{9}$/,
        message: m.loanMobilePattern,
        trigger: 'blur'
      }
    ],
    loanReceiverMobile: [
      { required: true, message: m.receiverMobileRequired, trigger: 'blur' },
      {
        pattern: /^03\d{9}$/,
        message: m.loanMobilePattern,
        trigger: 'blur'
      }
    ],

    salary: [
      { required: true, message: m.salaryRequired, trigger: 'blur' },
      {
        type: 'number',
        min: 1,
        message: m.salaryMin,
        trigger: 'blur'
      }
    ],

    location: [
      { required: true, message: m.locationRequired, trigger: 'blur' },
      {
        min: 5,
        message: m.locationMinLength,
        trigger: 'blur'
      }
    ],
    recipient: [
      { required: true, message: m.recipientRequired, trigger: 'blur' },
      {
        min: 5,
        message: m.recipientMinLength,
        trigger: 'blur'
      }
    ]
  }
}

export const rules = getRules('en')

export function getGroupRules(locale = 'en') {
  const m = VALIDATION_MESSAGES[locale] || VALIDATION_MESSAGES.en

  return {
    name: [
      { required: true, message: m.groupNameRequired, trigger: 'blur' },
      {
        min: 5,
        message: m.groupNameMinLength,
        trigger: 'blur',
        max: 50
      }
    ],
    members: [
      {
        type: 'array',
        required: true,
        min: 1,
        message: m.groupMembersRequired,
        trigger: 'change'
      }
    ]
  }
}

export const groupRules = getGroupRules('en')
