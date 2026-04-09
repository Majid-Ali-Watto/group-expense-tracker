export const SITE_NAME = 'Kharchafy'
export const SITE_URL = 'https://g-exp-trk.netlify.app'
export const DEFAULT_OG_IMAGE = '/expenses.png'
export const PUBLIC_ROBOTS = 'index, follow'
export const PRIVATE_ROBOTS = 'noindex, nofollow'

export const PUBLIC_NAV_LINKS = [
  { label: 'Features', to: '/features' },
  { label: 'Group Expenses', to: '/group-expense-tracker' },
  { label: 'Budgeting', to: '/personal-budget-tracker' },
  { label: 'Help', to: '/help' },
  { label: 'FAQ', to: '/faq' }
]

export const LANDING_HIGHLIGHTS = [
  {
    title: 'Track shared expenses without messy spreadsheets',
    description:
      'Record who paid, how much each member owes, and how every split was calculated.'
  },
  {
    title: 'Manage shared loans and personal budgets in one place',
    description:
      'Handle group balances, personal monthly expenses, salaries, and private loans from the same account.'
  },
  {
    title: 'Keep changes accountable',
    description:
      'Approval flows, receipts, exports, and notifications make every update easier to verify.'
  }
]

export const PUBLIC_USE_CASES = [
  {
    title: 'Roommates',
    description:
      'Track rent, groceries, utilities, and top-ups without losing sight of who owes whom.'
  },
  {
    title: 'Trips and events',
    description:
      'Split travel, food, tickets, and last-minute costs while keeping settlements transparent.'
  },
  {
    title: 'Couples and families',
    description:
      'Organize household spending, recurring bills, and one-off purchases in a single shared flow.'
  }
]

export const FEATURE_SECTIONS = [
  {
    title: 'Shared expense tracking',
    points: [
      'Create group expenses with flexible split logic and payer options.',
      'Store receipts with each transaction for later review.',
      'Review summaries, balances, and settlement requests per group.'
    ]
  },
  {
    title: 'Shared and personal loans',
    points: [
      'Track who gave, who received, and when the loan was created.',
      'Keep group loans and private loans separate without losing context.',
      'See per-person balances before asking anyone to settle.'
    ]
  },
  {
    title: 'Personal budgeting',
    points: [
      'Record monthly salary and day-to-day personal expenses.',
      'Review category trends and remaining budget for the month.',
      'Keep personal planning available even when no group is selected.'
    ]
  },
  {
    title: 'Operational trust',
    points: [
      'Use approval-based flows for destructive or sensitive updates.',
      'Get notifications for pending actions and important changes.',
      'Export data when you need an external record.'
    ]
  }
]

export const GROUP_EXPENSE_BENEFITS = [
  'Split bills across friends, roommates, or family members without manual recalculation.',
  'See exactly who paid and how balances changed after each expense.',
  'Keep expense history, receipts, and approval-backed edits in one shared record.',
  'Use settlement workflows instead of arguing over stale screenshots and message threads.'
]

export const BUDGET_BENEFITS = [
  'Track salary and monthly spending from a single personal dashboard.',
  'Review category-based expense patterns to spot avoidable leakage.',
  'Manage personal loans alongside monthly expenses without mixing them into group data.',
  'Keep budgeting simple enough to use every day, not only at month-end.'
]

export const FAQ_ITEMS = [
  {
    question: 'What is Kharchafy used for?',
    answer:
      'Kharchafy is used to track shared expenses, shared loans, personal expenses, and monthly budgets from one web app.'
  },
  {
    question: 'Can I use Kharchafy as a group expense tracker?',
    answer:
      'Yes. Kharchafy is built for shared spending scenarios such as roommates, trips, events, and family budgets.'
  },
  {
    question: 'Does the app support personal budgeting too?',
    answer:
      'Yes. You can record salary, monthly expenses, and personal loans without needing an active shared group.'
  },
  {
    question: 'How does Kharchafy reduce disputes in shared spending?',
    answer:
      'It keeps calculations visible, stores receipts, and adds approval flows for sensitive or destructive actions.'
  },
  {
    question: 'Is the logged-in dashboard meant for Google indexing?',
    answer:
      'No. Public marketing pages should be indexed, while private app routes should stay out of search results.'
  }
]

const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: SITE_NAME,
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  url: '__PAGE_URL__',
  image: '__IMAGE_URL__',
  description:
    'Kharchafy helps track group expenses, split bills, manage shared loans, and monitor personal budgets.'
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: '__SITE_URL__'
}

const buildFaqSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer
    }
  }))
})

const buildPageSeo = ({
  title,
  description,
  canonicalPath,
  keywords,
  robots = PUBLIC_ROBOTS,
  structuredData = []
}) => ({
  title,
  description,
  canonicalPath,
  keywords,
  robots,
  image: DEFAULT_OG_IMAGE,
  structuredData
})

export const SEO_PAGES = {
  home: buildPageSeo({
    title: 'Kharchafy | Group Expense Tracker and Shared Budget App',
    description:
      'Track group expenses, split bills, manage shared loans, and stay on top of personal budgets with Kharchafy.',
    canonicalPath: '/',
    keywords:
      'group expense tracker, split bills app, shared budget app, personal budget tracker, shared loan tracker',
    structuredData: [softwareApplicationSchema, websiteSchema]
  }),
  features: buildPageSeo({
    title: 'Kharchafy Features | Shared Expenses, Loans, and Budget Tracking',
    description:
      'Explore Kharchafy features for shared expense tracking, shared loans, personal budgeting, approvals, receipts, and exports.',
    canonicalPath: '/features',
    keywords:
      'expense tracker features, bill splitting features, shared expense software, personal budgeting features',
    structuredData: [softwareApplicationSchema]
  }),
  groupExpenseTracker: buildPageSeo({
    title: 'Group Expense Tracker | Split Bills for Trips, Roommates, and Families',
    description:
      'Use Kharchafy as a group expense tracker to split bills, review balances, and settle shared costs for roommates, travel, and household spending.',
    canonicalPath: '/group-expense-tracker',
    keywords:
      'group expense tracker, split bills app, roommate expense tracker, travel expense tracker, household expense sharing',
    structuredData: [softwareApplicationSchema]
  }),
  personalBudgetTracker: buildPageSeo({
    title: 'Personal Budget Tracker | Monthly Expense and Salary Planning',
    description:
      'Track salary, monthly expenses, and personal loans with Kharchafy’s personal budget tracker and expense planning tools.',
    canonicalPath: '/personal-budget-tracker',
    keywords:
      'personal budget tracker, monthly expense tracker, salary budget planner, personal finance tracker',
    structuredData: [softwareApplicationSchema]
  }),
  faq: buildPageSeo({
    title: 'Kharchafy FAQ | Shared Expenses, Bills, and Budget Tracking Questions',
    description:
      'Read answers to common questions about Kharchafy, including shared expenses, bill splitting, personal budgeting, and how the app works.',
    canonicalPath: '/faq',
    keywords:
      'expense tracker faq, split bills faq, shared budget questions, personal budgeting app faq',
    structuredData: [buildFaqSchema(FAQ_ITEMS)]
  }),
  help: buildPageSeo({
    title: 'How to Use Kharchafy | Complete App Help and Feature Guide',
    description:
      'Read the complete Kharchafy help guide covering registration, groups, shared expenses, shared loans, personal budgeting, exports, charts, and notifications.',
    canonicalPath: '/help',
    keywords:
      'kharchafy help, expense tracker help, group expense guide, bill splitting guide, budgeting app help',
    structuredData: [softwareApplicationSchema]
  }),
  login: buildPageSeo({
    title: 'Login | Kharchafy',
    description: 'Login to your Kharchafy account.',
    canonicalPath: '/login',
    robots: PRIVATE_ROBOTS
  }),
  register: buildPageSeo({
    title: 'Register | Kharchafy',
    description: 'Create a Kharchafy account to manage shared expenses and budgets.',
    canonicalPath: '/register',
    robots: PRIVATE_ROBOTS
  }),
  app: buildPageSeo({
    title: 'Kharchafy App',
    description: 'Private application route for Kharchafy users.',
    robots: PRIVATE_ROBOTS
  })
}
