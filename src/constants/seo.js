export const SITE_NAME = 'Kharchafy'
export const SITE_NAMES = {
  en: SITE_NAME,
  ur: 'خرچے فائی'
}
export const getSiteName = (locale = 'en') => SITE_NAMES[locale] || SITE_NAME
export const SITE_URL = 'https://g-exp-trk.netlify.app'
export const DEFAULT_OG_IMAGE = '/expenses.png'
export const PUBLIC_ROBOTS = 'index, follow'
export const PRIVATE_ROBOTS = 'noindex, nofollow'

export const OG_LOCALES = {
  en: 'en_US',
  ur: 'ur_PK'
}

export const PUBLIC_NAV_LINKS = {
  en: [
    { label: 'Features', to: '/features' },
    { label: 'Group Expenses', to: '/group-expense-tracker' },
    { label: 'Budgeting', to: '/personal-budget-tracker' },
    { label: 'Help', to: '/help' },
    { label: 'FAQ', to: '/faq' }
  ],
  ur: [
    { label: 'خصوصیات', to: '/ur/features' },
    { label: 'گروپ اخراجات', to: '/ur/group-expense-tracker' },
    { label: 'بجٹنگ', to: '/ur/personal-budget-tracker' },
    { label: 'مدد', to: '/ur/help' },
    { label: 'اکثر سوالات', to: '/ur/faq' }
  ]
}

export const LANDING_HIGHLIGHTS = {
  en: [
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
  ],
  ur: [
    {
      title: 'بغیر گندے سپریڈشیٹس کے مشترکہ اخراجات ٹریک کریں',
      description:
        'ریکارڈ کریں کہ کس نے ادائیگی کی، ہر رکن پر کتنا واجب ہے، اور ہر تقسیم کا حساب کیسے لگایا گیا۔'
    },
    {
      title: 'مشترکہ قرضے اور ذاتی بجٹ ایک ہی جگہ سے منظم کریں',
      description:
        'ایک ہی اکاؤنٹ سے گروپ بیلنس، ذاتی ماہانہ اخراجات، تنخواہیں، اور نجی قرضے سنبھالیں۔'
    },
    {
      title: 'تبدیلیوں کو قابلِ احتساب رکھیں',
      description:
        'منظوری کے مراحل، رسیدیں، ایکسپورٹس، اور اطلاعات ہر اپ ڈیٹ کی تصدیق کو آسان بناتے ہیں۔'
    }
  ]
}

export const PUBLIC_USE_CASES = {
  en: [
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
  ],
  ur: [
    {
      title: 'ہم کمرہ افراد',
      description:
        'کرایہ، گروسری، یوٹیلیٹیز، اور ٹاپ اپس ٹریک کریں بغیر یہ بھولے کہ کس پر کس کا کتنا واجب ہے۔'
    },
    {
      title: 'سفر اور تقریبات',
      description:
        'سفر، کھانا، ٹکٹیں، اور آخری لمحے کے اخراجات تقسیم کریں اور تصفیوں کو شفاف رکھیں۔'
    },
    {
      title: 'جوڑے اور خاندان',
      description:
        'گھریلو اخراجات، بار بار آنے والے بل، اور یک وقتی خریداریوں کو ایک ہی مشترکہ نظام میں منظم کریں۔'
    }
  ]
}

export const FEATURE_SECTIONS = {
  en: [
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
  ],
  ur: [
    {
      title: 'مشترکہ اخراجات کی ٹریکنگ',
      points: [
        'لچکدار تقسیم کے منطق اور ادائیگی کنندہ کے اختیارات کے ساتھ گروپ اخراجات بنائیں۔',
        'بعد میں جائزے کے لیے ہر لین دین کے ساتھ رسیدیں محفوظ کریں۔',
        'ہر گروپ کے خلاصے، بیلنس، اور تصفیہ کی درخواستوں کا جائزہ لیں۔'
      ]
    },
    {
      title: 'مشترکہ اور ذاتی قرضے',
      points: [
        'ٹریک کریں کہ کس نے دیا، کس نے وصول کیا، اور قرض کب بنایا گیا۔',
        'سیاق و سباق کھوئے بغیر گروپ قرضوں اور نجی قرضوں کو الگ رکھیں۔',
        'کسی سے تصفیہ کرنے کو کہنے سے پہلے فی کس بیلنس دیکھیں۔'
      ]
    },
    {
      title: 'ذاتی بجٹ سازی',
      points: [
        'ماہانہ تنخواہ اور روزمرہ کے ذاتی اخراجات ریکارڈ کریں۔',
        'زمرہ جاتی رجحانات اور مہینے کا باقی بجٹ دیکھیں۔',
        'کوئی گروپ منتخب نہ ہونے پر بھی ذاتی منصوبہ بندی دستیاب رکھیں۔'
      ]
    },
    {
      title: 'عملی اعتماد',
      points: [
        'حساس یا نقصان دہ تبدیلیوں کے لیے منظوری پر مبنی طریقہ کار استعمال کریں۔',
        'زیرِ التوا اقدامات اور اہم تبدیلیوں کے لیے اطلاعات حاصل کریں۔',
        'بیرونی ریکارڈ کی ضرورت ہونے پر ڈیٹا ایکسپورٹ کریں۔'
      ]
    }
  ]
}

export const GROUP_EXPENSE_BENEFITS = {
  en: [
    'Split bills across friends, roommates, or family members without manual recalculation.',
    'See exactly who paid and how balances changed after each expense.',
    'Keep expense history, receipts, and approval-backed edits in one shared record.',
    'Use settlement workflows instead of arguing over stale screenshots and message threads.'
  ],
  ur: [
    'دوستوں، ہم کمرہ افراد، یا خاندان کے افراد کے درمیان بل تقسیم کریں بغیر دستی حساب کتاب کے۔',
    'بالکل دیکھیں کہ کس نے ادائیگی کی اور ہر خرچ کے بعد بیلنس کیسے بدلا۔',
    'خرچ کی تاریخ، رسیدیں، اور منظوری شدہ ترامیم ایک ہی مشترکہ ریکارڈ میں رکھیں۔',
    'پرانے اسکرین شاٹس اور پیغامات پر بحث کرنے کے بجائے تصفیے کے طریقہ کار استعمال کریں۔'
  ]
}

export const BUDGET_BENEFITS = {
  en: [
    'Track salary and monthly spending from a single personal dashboard.',
    'Review category-based expense patterns to spot avoidable leakage.',
    'Manage personal loans alongside monthly expenses without mixing them into group data.',
    'Keep budgeting simple enough to use every day, not only at month-end.'
  ],
  ur: [
    'ایک ہی ذاتی ڈیش بورڈ سے تنخواہ اور ماہانہ اخراجات ٹریک کریں۔',
    'قابلِ گریز نقصان کی نشاندہی کے لیے زمرہ جاتی اخراجات کے رجحانات دیکھیں۔',
    'ذاتی قرضوں کو ماہانہ اخراجات کے ساتھ منظم کریں، بغیر انہیں گروپ ڈیٹا میں ملائے۔',
    'بجٹ سازی کو اتنا آسان رکھیں کہ روزانہ استعمال ہو سکے، نہ صرف مہینے کے آخر میں۔'
  ]
}

export const FAQ_ITEMS = {
  en: [
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
    }
  ],
  ur: [
    {
      question: 'خرچے فائی کس لیے استعمال ہوتا ہے؟',
      answer:
        'خرچے فائی ایک ہی ویب ایپ سے مشترکہ اخراجات، مشترکہ قرضے، ذاتی اخراجات، اور ماہانہ بجٹ ٹریک کرنے کے لیے استعمال ہوتا ہے۔'
    },
    {
      question:
        'کیا میں خرچے فائی کو گروپ اخراجات ٹریکر کے طور پر استعمال کر سکتا ہوں؟',
      answer:
        'جی ہاں۔ خرچے فائی مشترکہ اخراجات کے حالات جیسے ہم کمرہ افراد، سفر، تقریبات، اور خاندانی بجٹ کے لیے بنایا گیا ہے۔'
    },
    {
      question: 'کیا ایپ ذاتی بجٹ سازی کی بھی سہولت دیتی ہے؟',
      answer:
        'جی ہاں۔ آپ فعال مشترکہ گروپ کے بغیر بھی تنخواہ، ماہانہ اخراجات، اور ذاتی قرضے ریکارڈ کر سکتے ہیں۔'
    },
    {
      question: 'خرچے فائی مشترکہ اخراجات میں تنازعات کو کیسے کم کرتا ہے؟',
      answer:
        'یہ حسابات کو واضح رکھتا ہے، رسیدیں محفوظ کرتا ہے، اور حساس یا نقصان دہ اقدامات کے لیے منظوری کا نظام شامل کرتا ہے۔'
    }
  ]
}

const softwareApplicationSchema = (locale) => ({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: getSiteName(locale),
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  url: '__PAGE_URL__',
  image: '__IMAGE_URL__',
  inLanguage: locale,
  description:
    locale === 'ur'
      ? 'خرچے فائی گروپ اخراجات ٹریک کرنے، بل تقسیم کرنے، مشترکہ قرضے منظم کرنے، اور ذاتی بجٹ کی نگرانی میں مدد کرتا ہے۔'
      : 'Kharchafy helps track group expenses, split bills, manage shared loans, and monitor personal budgets.'
})

const websiteSchema = (locale) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: getSiteName(locale),
  url: '__SITE_URL__',
  inLanguage: locale
})

const buildFaqSchema = (items, locale) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  inLanguage: locale,
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

// Public, indexable pages get one route per locale (e.g. /features and
// /ur/features) so each language has its own crawlable URL — see
// src/router/index.js. getSeoPages(locale) builds the per-locale
// title/description/keywords/canonicalPath/structured-data for those pages.
// login/register/app stay English-only (PRIVATE_ROBOTS, never indexed, out
// of scope for Urdu).
export function getSeoPages(locale) {
  const localePrefix = locale === 'ur' ? '/ur' : ''

  return {
    home: buildPageSeo({
      title:
        locale === 'ur'
          ? 'خرچے فائی | گروپ اخراجات ٹریکر اور مشترکہ بجٹ ایپ'
          : 'Kharchafy | Group Expense Tracker and Shared Budget App',
      description:
        locale === 'ur'
          ? 'خرچے فائی کے ساتھ گروپ اخراجات ٹریک کریں، بل تقسیم کریں، مشترکہ قرضے منظم کریں، اور ذاتی بجٹ پر نظر رکھیں۔'
          : 'Track group expenses, split bills, manage shared loans, and stay on top of personal budgets with Kharchafy.',
      canonicalPath: locale === 'ur' ? '/ur' : '/',
      keywords:
        locale === 'ur'
          ? 'گروپ اخراجات ٹریکر, بل تقسیم ایپ, مشترکہ بجٹ ایپ, ذاتی بجٹ ٹریکر, مشترکہ قرض ٹریکر'
          : 'group expense tracker, split bills app, shared budget app, personal budget tracker, shared loan tracker',
      structuredData: [softwareApplicationSchema(locale), websiteSchema(locale)]
    }),
    features: buildPageSeo({
      title:
        locale === 'ur'
          ? 'خرچے فائی خصوصیات | مشترکہ اخراجات، قرضے، اور بجٹ ٹریکنگ'
          : 'Kharchafy Features | Shared Expenses, Loans, and Budget Tracking',
      description:
        locale === 'ur'
          ? 'مشترکہ اخراجات کی ٹریکنگ، مشترکہ قرضوں، ذاتی بجٹ، منظوریوں، رسیدوں، اور ایکسپورٹس کے لیے خرچے فائی کی خصوصیات دیکھیں۔'
          : 'Explore Kharchafy features for shared expense tracking, shared loans, personal budgeting, approvals, receipts, and exports.',
      canonicalPath: `${localePrefix}/features`,
      keywords:
        locale === 'ur'
          ? 'اخراجات ٹریکر خصوصیات, بل تقسیم خصوصیات, مشترکہ اخراجات سافٹ ویئر, ذاتی بجٹ سازی خصوصیات'
          : 'expense tracker features, bill splitting features, shared expense software, personal budgeting features',
      structuredData: [softwareApplicationSchema(locale)]
    }),
    groupExpenseTracker: buildPageSeo({
      title:
        locale === 'ur'
          ? 'گروپ اخراجات ٹریکر | سفر، ہم کمرہ افراد، اور خاندانوں کے لیے بل تقسیم'
          : 'Group Expense Tracker | Split Bills for Trips, Roommates, and Families',
      description:
        locale === 'ur'
          ? 'خرچے فائی کو گروپ اخراجات ٹریکر کے طور پر استعمال کریں تاکہ بل تقسیم کریں، بیلنس دیکھیں، اور ہم کمرہ افراد، سفر، اور گھریلو اخراجات کا تصفیہ کریں۔'
          : 'Use Kharchafy as a group expense tracker to split bills, review balances, and settle shared costs for roommates, travel, and household spending.',
      canonicalPath: `${localePrefix}/group-expense-tracker`,
      keywords:
        locale === 'ur'
          ? 'گروپ اخراجات ٹریکر, بل تقسیم ایپ, ہم کمرہ اخراجات ٹریکر, سفر اخراجات ٹریکر, گھریلو اخراجات شراکت'
          : 'group expense tracker, split bills app, roommate expense tracker, travel expense tracker, household expense sharing',
      structuredData: [softwareApplicationSchema(locale)]
    }),
    personalBudgetTracker: buildPageSeo({
      title:
        locale === 'ur'
          ? 'ذاتی بجٹ ٹریکر | ماہانہ اخراجات اور تنخواہ کی منصوبہ بندی'
          : 'Personal Budget Tracker | Monthly Expense and Salary Planning',
      description:
        locale === 'ur'
          ? 'خرچے فائی کے ذاتی بجٹ ٹریکر اور اخراجات کی منصوبہ بندی کے ٹولز کے ساتھ تنخواہ، ماہانہ اخراجات، اور ذاتی قرضے ٹریک کریں۔'
          : 'Track salary, monthly expenses, and personal loans with Kharchafy’s personal budget tracker and expense planning tools.',
      canonicalPath: `${localePrefix}/personal-budget-tracker`,
      keywords:
        locale === 'ur'
          ? 'ذاتی بجٹ ٹریکر, ماہانہ اخراجات ٹریکر, تنخواہ بجٹ پلانر, ذاتی مالیات ٹریکر'
          : 'personal budget tracker, monthly expense tracker, salary budget planner, personal finance tracker',
      structuredData: [softwareApplicationSchema(locale)]
    }),
    faq: buildPageSeo({
      title:
        locale === 'ur'
          ? 'خرچے فائی اکثر سوالات | مشترکہ اخراجات، بل، اور بجٹ ٹریکنگ کے سوالات'
          : 'Kharchafy FAQ | Shared Expenses, Bills, and Budget Tracking Questions',
      description:
        locale === 'ur'
          ? 'خرچے فائی کے بارے میں عام سوالات کے جوابات پڑھیں، بشمول مشترکہ اخراجات، بل تقسیم، ذاتی بجٹ، اور ایپ کیسے کام کرتی ہے۔'
          : 'Read answers to common questions about Kharchafy, including shared expenses, bill splitting, personal budgeting, and how the app works.',
      canonicalPath: `${localePrefix}/faq`,
      keywords:
        locale === 'ur'
          ? 'اخراجات ٹریکر سوالات, بل تقسیم سوالات, مشترکہ بجٹ سوالات, ذاتی بجٹ ایپ سوالات'
          : 'expense tracker faq, split bills faq, shared budget questions, personal budgeting app faq',
      structuredData: [buildFaqSchema(FAQ_ITEMS[locale], locale)]
    }),
    help: buildPageSeo({
      title:
        locale === 'ur'
          ? 'خرچے فائی کیسے استعمال کریں | مکمل ایپ مدد اور خصوصیات گائیڈ'
          : 'How to Use Kharchafy | Complete App Help and Feature Guide',
      description:
        locale === 'ur'
          ? 'خرچے فائی کی مکمل مدد گائیڈ پڑھیں جس میں رجسٹریشن، گروپس، مشترکہ اخراجات، مشترکہ قرضے، ذاتی بجٹ، ایکسپورٹس، چارٹس، اور اطلاعات شامل ہیں۔'
          : 'Read the complete Kharchafy help guide covering registration, groups, shared expenses, shared loans, personal budgeting, exports, charts, and notifications.',
      canonicalPath: `${localePrefix}/help`,
      keywords:
        locale === 'ur'
          ? 'خرچے فائی مدد, اخراجات ٹریکر مدد, گروپ اخراجات گائیڈ, بل تقسیم گائیڈ, بجٹ سازی ایپ مدد'
          : 'kharchafy help, expense tracker help, group expense guide, bill splitting guide, budgeting app help',
      structuredData: [softwareApplicationSchema(locale)]
    }),
    login: buildPageSeo({
      title: locale === 'ur' ? 'لاگ ان | خرچے فائی' : 'Login | Kharchafy',
      description:
        locale === 'ur'
          ? 'اپنے خرچے فائی اکاؤنٹ میں لاگ ان کریں۔'
          : 'Login to your Kharchafy account.',
      canonicalPath: `${localePrefix}/login`,
      robots: PRIVATE_ROBOTS
    }),
    register: buildPageSeo({
      title: locale === 'ur' ? 'رجسٹر | خرچے فائی' : 'Register | Kharchafy',
      description:
        locale === 'ur'
          ? 'مشترکہ اخراجات اور بجٹ کا انتظام کرنے کے لیے خرچے فائی اکاؤنٹ بنائیں۔'
          : 'Create a Kharchafy account to manage shared expenses and budgets.',
      canonicalPath: `${localePrefix}/register`,
      robots: PRIVATE_ROBOTS
    }),
    app: buildPageSeo({
      title: 'Kharchafy App',
      description: 'Private application route for Kharchafy users.',
      robots: PRIVATE_ROBOTS
    })
  }
}

// Static English route metadata — kept for any lingering direct imports.
export const SEO_PAGES = getSeoPages('en')
