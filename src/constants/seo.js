export const SITE_NAME = 'Kharchafy'
export const SITE_NAMES = {
  en: SITE_NAME,
  ur: 'خرچے فائی'
}
export const getSiteName = (locale = 'en') => SITE_NAMES[locale] || SITE_NAME
export const SITE_URL = 'https://kharchafy-khata-application.vercel.app'
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
    { label: 'فیچرز', to: '/ur/features' },
    { label: 'گروپ اخراجات', to: '/ur/group-expense-tracker' },
    { label: 'بجٹ', to: '/ur/personal-budget-tracker' },
    { label: 'مدد', to: '/ur/help' },
    { label: 'اکثر سوالات', to: '/ur/faq' }
  ]
}

export const LANDING_HIGHLIGHTS = {
  en: [
    {
      title: 'Split bills without second guessing',
      description:
        'Add group expenses, choose who paid, attach receipt proof, and see what each member owes.'
    },
    {
      title: 'Track shared loans clearly',
      description:
        'Record who gave money, who received it, and how loan balances change before settlement.'
    },
    {
      title: 'Manage your own budget too',
      description:
        'Track salary, daily spending, personal loans, remaining balance, and monthly reports in one place.'
    },
    {
      title: 'Use approvals, reminders, and reports',
      description:
        'Keep important group changes visible, notify participants, and download clean PDF or Excel records.'
    }
  ],
  ur: [
    {
      title: 'بغیر اندازے کے بل تقسیم کریں',
      description:
        'خرچ شامل کریں، کس نے پیسے دیے منتخب کریں، رسید لگائیں، اور فوراً دیکھیں کس کے ذمے کتنا ہے۔'
    },
    {
      title: 'مشترکہ قرضے صاف حساب کے ساتھ',
      description:
        'کس نے پیسے دیے، کس نے لیے، اور سیٹلمنٹ سے پہلے کتنا باقی ہے، سب ریکارڈ میں رکھیں۔'
    },
    {
      title: 'اپنا ذاتی بجٹ بھی ساتھ رکھیں',
      description:
        'تنخواہ، روزمرہ خرچ، ذاتی قرضے، باقی رقم، اور ماہانہ رپورٹس ایک جگہ دیکھیں۔'
    },
    {
      title: 'منظوریاں، یاد دہانیاں، رپورٹس',
      description:
        'اہم تبدیلیاں سب کے سامنے رکھیں، لوگوں کو اطلاع دیں، اور صاف PDF یا Excel رپورٹ نکالیں۔'
    }
  ]
}

export const PUBLIC_USE_CASES = {
  en: [
    {
      title: 'Roommates',
      description:
        'Split rent, groceries, utilities, fuel, and top-ups while everyone can see the latest balance.'
    },
    {
      title: 'Trips and events',
      description:
        'Track transport, food, tickets, hotel stays, and last-minute costs without hunting through chats.'
    },
    {
      title: 'Couples and families',
      description:
        'Organize household spending, recurring bills, shared purchases, and lending between family members.'
    },
    {
      title: 'Personal money planning',
      description:
        'Keep your monthly salary, personal expenses, private loans, categories, and reports close to your group records.'
    }
  ],
  ur: [
    {
      title: 'روم میٹس',
      description:
        'کرایہ، راشن، بل، فیول، اور ٹاپ اپس کا حساب رکھیں تاکہ سب کو تازہ بیلنس نظر آئے۔'
    },
    {
      title: 'ٹرپس اور تقریبات',
      description:
        'ٹرانسپورٹ، کھانا، ٹکٹ، ہوٹل، اور آخری وقت کے خرچے چیٹس میں ڈھونڈے بغیر ٹریک کریں۔'
    },
    {
      title: 'گھر والے',
      description:
        'گھر کے خرچے، ماہانہ بل، مشترکہ خریداری، اور فیملی کے اندر ادھار کا حساب آسان رکھیں۔'
    },
    {
      title: 'اپنا ذاتی حساب',
      description:
        'اپنی تنخواہ، ذاتی خرچے، نجی قرضے، کیٹیگریز، اور رپورٹس گروپ حساب کے ساتھ ہی رکھیں۔'
    }
  ]
}

export const FEATURE_SECTIONS = {
  en: [
    {
      title: 'Group expense tracker',
      points: [
        'Create group expenses for trips, roommates, family bills, and events.',
        'Choose the payer, members, category, date, amount, description, and receipt when needed.',
        'See who paid, who owes, and how every shared balance changed.'
      ]
    },
    {
      title: 'Shared loans and settlements',
      points: [
        'Track money given and received between group members.',
        'Keep shared loans separate from regular shared expenses for cleaner records.',
        'Use balances and settlement requests to close pending amounts with confidence.'
      ]
    },
    {
      title: 'Personal expenses and salary',
      points: [
        'Record monthly salary, daily expenses, categories, locations, recipients, and notes.',
        'Watch total spending, remaining balance, and monthly transaction history.',
        'Duplicate repeated personal expenses and update only the fields that changed.'
      ]
    },
    {
      title: 'Personal loans',
      points: [
        'Track private loans you gave or received without mixing them into group balances.',
        'Keep loan giver, loan receiver, date, category, amount, and description visible.',
        'Download detailed loan reports when you need a personal record.'
      ]
    },
    {
      title: 'Approvals, receipts, and notifications',
      points: [
        'Use approvals for important group changes so participants stay aligned.',
        'Attach receipt images where proof is useful for later review.',
        'See pending actions, email alerts, and in-app notifications before work slips away.'
      ]
    },
    {
      title: 'Reports and summaries',
      points: [
        'Download PDF or Excel reports for shared expenses, shared loans, personal expenses, and personal loans.',
        'Review summaries, detailed rows, categories, participants, dates, and descriptions.',
        'Run Expense Summary in the background and keep using the app while it prepares.'
      ]
    }
  ],
  ur: [
    {
      title: 'گروپ خرچ کا حساب',
      points: [
        'ٹرپس، روم میٹس، گھر کے بل، اور تقریبات کے لیے گروپ خرچے بنائیں۔',
        'کس نے پیسے دیے، کون شامل ہے، کیٹیگری، تاریخ، رقم، تفصیل، اور رسید سب ساتھ رکھیں۔',
        'دیکھیں کس نے ادا کیا، کس کے ذمے کتنا ہے، اور ہر خرچ کے بعد حساب کیسے بدلا۔'
      ]
    },
    {
      title: 'مشترکہ قرضے اور سیٹلمنٹ',
      points: [
        'گروپ ممبرز کے درمیان دیے اور لیے گئے پیسے ٹریک کریں۔',
        'قرضوں کو عام خرچ سے الگ رکھیں تاکہ حساب صاف رہے۔',
        'بیلنس اور سیٹلمنٹ درخواستوں سے باقی رقم اعتماد سے کلئیر کریں۔'
      ]
    },
    {
      title: 'ذاتی اخراجات اور تنخواہ',
      points: [
        'ماہانہ تنخواہ، روزمرہ خرچ، کیٹیگریز، جگہ، کس کو پیسے دیے، اور نوٹس ریکارڈ کریں۔',
        'کل خرچ، باقی رقم، اور مہینے کی ٹرانزیکشن ہسٹری دیکھیں۔',
        'بار بار ہونے والے خرچے ڈپلیکیٹ کریں اور صرف بدلی ہوئی چیزیں اپ ڈیٹ کریں۔'
      ]
    },
    {
      title: 'ذاتی قرضے',
      points: [
        'جو ذاتی قرض آپ نے دیا یا لیا، اسے گروپ حساب میں ملائے بغیر ٹریک کریں۔',
        'قرض دینے والا، قرض لینے والا، تاریخ، کیٹیگری، رقم، اور تفصیل واضح رکھیں۔',
        'اپنے ریکارڈ کے لیے تفصیلی قرض رپورٹ ڈاؤن لوڈ کریں۔'
      ]
    },
    {
      title: 'منظوریاں، رسیدیں، اور اطلاعات',
      points: [
        'اہم گروپ تبدیلیوں کے لیے منظوری لیں تاکہ سب کا حساب ایک جیسا رہے۔',
        'جہاں ضرورت ہو رسید کی تصویر لگا دیں تاکہ بعد میں ثبوت موجود ہو۔',
        'زیر التوا کام، ای میل الرٹس، اور ایپ نوٹیفکیشن دیکھیں تاکہ کوئی کام رہ نہ جائے۔'
      ]
    },
    {
      title: 'رپورٹس اور خلاصے',
      points: [
        'گروپ خرچ، مشترکہ قرضے، ذاتی خرچ، اور ذاتی قرضوں کی PDF یا Excel رپورٹس نکالیں۔',
        'خلاصہ، مکمل ریکارڈ، کیٹیگریز، لوگ، تاریخیں، اور تفصیل دیکھیں۔',
        'Expense Summary پس منظر میں چلائیں اور رپورٹ تیار ہونے تک ایپ استعمال کرتے رہیں۔'
      ]
    }
  ]
}

export const GROUP_EXPENSE_BENEFITS = {
  en: [
    'Split bills across friends, roommates, families, trips, and events without manual recalculation.',
    'Track payer, participants, category, date, amount, description, and receipt proof in one shared record.',
    'See exactly who paid, who owes, and how balances changed after each expense or loan.',
    'Use approvals and settlement requests so important changes are agreed before they affect the group.',
    'Download detailed reports when you need a clean record for review or follow-up.'
  ],
  ur: [
    'دوستوں، روم میٹس، گھر والوں، ٹرپس، اور تقریبات کے بل بغیر ہاتھ سے حساب کیے تقسیم کریں۔',
    'کس نے پیسے دیے، کون شامل تھا، کیٹیگری، تاریخ، رقم، تفصیل، اور رسید ایک ہی جگہ رکھیں۔',
    'صاف دیکھیں کس نے ادا کیا، کس کے ذمے کتنا ہے، اور ہر خرچ یا قرض کے بعد بیلنس کیسے بدلا۔',
    'منظوری اور سیٹلمنٹ درخواستوں سے اہم تبدیلیاں پہلے سب سے پکی کرائیں۔',
    'جب ضرورت ہو تو فالو اپ یا ریکارڈ کے لیے تفصیلی رپورٹ ڈاؤن لوڈ کریں۔'
  ]
}

export const BUDGET_BENEFITS = {
  en: [
    'Track salary, daily expenses, personal loans, and remaining balance from one personal dashboard.',
    'Organize spending by category, date, description, location, and recipient so reports stay useful.',
    'Review month-wise totals to understand where money went before the month ends.',
    'Duplicate repeated expenses, adjust changed details, and keep daily tracking quick.',
    'Download detailed personal expense and personal loan reports for your own records.'
  ],
  ur: [
    'ایک ذاتی ڈیش بورڈ سے تنخواہ، روزمرہ خرچ، ذاتی قرضے، اور باقی رقم ٹریک کریں۔',
    'خرچ کو کیٹیگری، تاریخ، تفصیل، جگہ، اور جسے پیسے دیے اس کے حساب سے محفوظ کریں۔',
    'مہینہ ختم ہونے سے پہلے دیکھ لیں کہ پیسے کہاں جا رہے ہیں۔',
    'بار بار آنے والے خرچے ڈپلیکیٹ کریں، صرف بدلی ہوئی تفصیل درست کریں، اور روزانہ ٹریکنگ تیز رکھیں۔',
    'اپنے ریکارڈ کے لیے ذاتی خرچ اور ذاتی قرض کی تفصیلی رپورٹس ڈاؤن لوڈ کریں۔'
  ]
}

export const FAQ_ITEMS = {
  en: [
    {
      question: 'What is Kharchafy used for?',
      answer:
        'Kharchafy is used to track shared expenses, shared loans, personal expenses, personal loans, monthly salary, receipts, approvals, settlements, and reports from one web app.'
    },
    {
      question: 'Can I use Kharchafy as a group expense tracker?',
      answer:
        'Yes. Kharchafy supports groups for roommates, trips, family spending, events, and shared bills. Each group can track expenses, loans, members, receipts, and settlements.'
    },
    {
      question: 'Does the app support personal budgeting too?',
      answer:
        'Yes. You can record monthly salary, personal expenses, categories, dates, descriptions, locations, recipients, and personal loans without needing an active shared group.'
    },
    {
      question: 'Can I choose which app features I want to use?',
      answer:
        'Yes. During setup you can choose the tabs you need, such as shared expenses, shared loans, personal expenses, personal loans, users, and email notifications.'
    },
    {
      question: 'Does Kharchafy support Google sign-in?',
      answer:
        'Yes. You can sign in with Google. New Google users complete their mobile number once, and existing users keep their saved account details.'
    },
    {
      question: 'How do approvals work?',
      answer:
        'Sensitive group actions, such as member changes, expense edits or deletes, loan changes, and settlement requests, stay pending until the required participants approve them.'
    },
    {
      question: 'What happens after everyone approves a request?',
      answer:
        'After all required participants approve, the requester can complete the request. Completing it applies the approved change and removes the pending action.'
    },
    {
      question: 'Can I attach receipts?',
      answer:
        'Yes. Supported expense and loan records can include receipt images, so participants can review proof later and include receipt links in detailed reports where available.'
    },
    {
      question: 'Can I duplicate repeated expenses?',
      answer:
        'Yes. Personal expenses include a Duplicate action so you can copy a similar transaction and adjust only the amount, date, note, or other changed fields.'
    },
    {
      question: 'What reports can I download?',
      answer:
        'You can download PDF or Excel reports for shared expenses, shared loans, personal expenses, personal loans, and expense summaries. Reports include summaries plus detailed rows.'
    },
    {
      question: 'Will shared expense links survive refresh?',
      answer:
        'Yes. Shared expense and shared loan links remember the selected group, so refreshing or sharing a link brings the app back to the correct screen after reload.'
    },
    {
      question: 'Does the Expense Summary block the app?',
      answer:
        'No. Expense Summary calculations can run in the background and open the result when ready, so the main app flow remains usable.'
    },
    {
      question: 'Does Kharchafy support English and Urdu?',
      answer:
        'Yes. Public pages are available in English and Urdu, and the app keeps your selected language while you move around private screens.'
    },
    {
      question: 'Who can see my personal and group information?',
      answer:
        'Your personal and group records are available only after login to people who should have access. Public pages only explain what the app does.'
    }
  ],
  ur: [
    {
      question: 'خرچے فائی کس لیے استعمال ہوتا ہے؟',
      answer:
        'خرچے فائی میں آپ گروپ خرچ، مشترکہ قرضے، ذاتی خرچ، ذاتی قرضے، ماہانہ تنخواہ، رسیدیں، منظوریاں، سیٹلمنٹ، اور رپورٹس ایک ہی جگہ سنبھال سکتے ہیں۔'
    },
    {
      question: 'کیا خرچے فائی گروپ خرچ کے لیے استعمال ہو سکتا ہے؟',
      answer:
        'جی ہاں۔ روم میٹس، ٹرپس، فیملی خرچ، تقریبات، اور مشترکہ بلوں کے لیے گروپ بنا سکتے ہیں۔ ہر گروپ میں خرچ، قرضے، ممبرز، رسیدیں، اور سیٹلمنٹ ٹریک ہو جاتی ہے۔'
    },
    {
      question: 'کیا ذاتی بجٹ بھی رکھ سکتے ہیں؟',
      answer:
        'جی ہاں۔ کسی گروپ کے بغیر بھی آپ ماہانہ تنخواہ، ذاتی خرچ، کیٹیگریز، تاریخ، تفصیل، جگہ، جسے پیسے دیے، اور ذاتی قرضے ریکارڈ کر سکتے ہیں۔'
    },
    {
      question: 'کیا میں صرف اپنی ضرورت کے فیچرز رکھ سکتا ہوں؟',
      answer:
        'جی ہاں۔ سیٹ اپ کے دوران آپ وہی ٹیبز منتخب کر سکتے ہیں جو آپ استعمال کرتے ہیں، جیسے گروپ خرچ، مشترکہ قرضے، ذاتی خرچ، ذاتی قرضے، یوزرز، اور ای میل نوٹیفکیشن۔'
    },
    {
      question: 'کیا Google سے لاگ ان ہو سکتا ہے؟',
      answer:
        'جی ہاں۔ آپ Google سے لاگ ان کر سکتے ہیں۔ نئے Google یوزرز کو موبائل نمبر صرف ایک بار دینا ہوتا ہے، اور پرانے یوزرز کی محفوظ معلومات برقرار رہتی ہیں۔'
    },
    {
      question: 'منظوریاں کیسے کام کرتی ہیں؟',
      answer:
        'گروپ کے اہم کام، جیسے ممبر بدلنا، خرچ ایڈٹ یا ڈیلیٹ کرنا، قرض میں تبدیلی، اور سیٹلمنٹ درخواست، متعلقہ لوگوں کی منظوری تک زیر التوا رہتے ہیں۔'
    },
    {
      question: 'جب سب منظوری دے دیں تو کیا ہوتا ہے؟',
      answer:
        'جب سب ضروری لوگ منظوری دے دیں تو درخواست بنانے والا اسے مکمل کر سکتا ہے۔ مکمل کرنے کے بعد تبدیلی لاگو ہو جاتی ہے اور زیر التوا کام ختم ہو جاتا ہے۔'
    },
    {
      question: 'کیا رسید لگا سکتے ہیں؟',
      answer:
        'جی ہاں۔ جہاں سہولت موجود ہو وہاں خرچ یا قرض کے ساتھ رسید کی تصویر لگا سکتے ہیں، تاکہ بعد میں سب ثبوت دیکھ سکیں اور رپورٹس میں بھی تفصیل مل جائے۔'
    },
    {
      question: 'کیا بار بار ہونے والا خرچ کاپی ہو سکتا ہے؟',
      answer:
        'جی ہاں۔ ذاتی خرچ میں ڈپلیکیٹ استعمال کریں، پھر صرف رقم، تاریخ، نوٹ، یا جو چیز بدلی ہو وہ اپ ڈیٹ کر دیں۔'
    },
    {
      question: 'میں کون سی رپورٹس ڈاؤن لوڈ کر سکتا ہوں؟',
      answer:
        'آپ گروپ خرچ، مشترکہ قرضے، ذاتی خرچ، ذاتی قرضے، اور Expense Summary کی PDF یا Excel رپورٹس ڈاؤن لوڈ کر سکتے ہیں۔ رپورٹس میں خلاصہ بھی ہوتا ہے اور مکمل ریکارڈ بھی۔'
    },
    {
      question: 'کیا شیئر کیا ہوا لنک ریفریش کے بعد بھی اسی جگہ کھلے گا؟',
      answer:
        'جی ہاں۔ گروپ خرچ اور قرض کے لنکس منتخب گروپ یاد رکھتے ہیں، اس لیے ریفریش یا شیئر کیا ہوا لنک کھولنے پر ایپ درست اسکرین پر واپس آتی ہے۔'
    },
    {
      question: 'کیا Expense Summary ایپ کو بلاک کرتا ہے؟',
      answer:
        'نہیں۔ Expense Summary کا حساب پس منظر میں چل سکتا ہے۔ نتیجہ تیار ہو تو کھل جاتا ہے، اور اس دوران آپ ایپ استعمال کر سکتے ہیں۔'
    },
    {
      question: 'کیا خرچے فائی English اور Urdu دونوں میں ہے؟',
      answer:
        'جی ہاں۔ عوامی صفحات English اور Urdu دونوں میں ہیں، اور ایپ آپ کی منتخب زبان یاد رکھتی ہے۔'
    },
    {
      question: 'میری ذاتی اور گروپ معلومات کون دیکھ سکتا ہے؟',
      answer:
        'آپ کا ذاتی اور گروپ ریکارڈ لاگ اِن کے بعد صرف انہی لوگوں کو نظر آتا ہے جنہیں رسائی ہونی چاہیے۔ عوامی صفحات صرف ایپ کا تعارف دیتی ہیں۔'
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
      ? 'خرچے فائی گروپ خرچ کا حساب، بل تقسیم، مشترکہ قرضے، ذاتی خرچ، اور تفصیلی رپورٹس ایک جگہ سنبھالنے میں مدد دیتا ہے۔'
      : 'Kharchafy helps track group expenses, split bills, manage shared loans, organize personal expenses, and download detailed reports.'
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
          ? 'خرچے فائی | بل تقسیم، گروپ خرچ، قرضے، اور ذاتی بجٹ'
          : 'Kharchafy | Split Bills, Track Group Expenses, Loans, and Budgets',
      description:
        locale === 'ur'
          ? 'خرچے فائی دوستوں، روم میٹس، گھر والوں، اور ٹرپس کے بل تقسیم کرنے، مشترکہ قرضے سنبھالنے، ذاتی خرچ ٹریک کرنے، رسیدیں محفوظ کرنے، اور رپورٹس نکالنے میں مدد دیتا ہے۔'
          : 'Kharchafy helps friends, roommates, families, and travelers split bills, track shared loans, manage personal expenses, save receipts, and download clear reports.',
      canonicalPath: locale === 'ur' ? '/ur' : '/',
      keywords:
        locale === 'ur'
          ? 'گروپ خرچ ٹریکر, بل تقسیم ایپ, مشترکہ قرض ٹریکر, ذاتی بجٹ ٹریکر, ذاتی خرچ ٹریکر, رسید ٹریکر, پاکستان اخراجات ایپ'
          : 'group expense tracker, split bills app, shared loan tracker, personal budget tracker, personal expense tracker, receipt tracker, Pakistan expense app',
      structuredData: [softwareApplicationSchema(locale), websiteSchema(locale)]
    }),
    features: buildPageSeo({
      title:
        locale === 'ur'
          ? 'خرچے فائی فیچرز | خرچ، قرضے، رسیدیں، منظوری، اور رپورٹس'
          : 'Kharchafy Features | Expenses, Loans, Receipts, Approvals, and Reports',
      description:
        locale === 'ur'
          ? 'گروپ خرچ، مشترکہ قرضے، ذاتی خرچ، ذاتی قرضے، رسیدیں، منظوری، نوٹیفکیشن، Expense Summary، اور PDF یا Excel رپورٹس کے لیے خرچے فائی کے فیچرز دیکھیں۔'
          : 'Explore Kharchafy features for shared expenses, shared loans, personal expenses, personal loans, receipts, approvals, notifications, Expense Summary, and PDF or Excel reports.',
      canonicalPath: `${localePrefix}/features`,
      keywords:
        locale === 'ur'
          ? 'خرچ ٹریکر فیچرز, بل تقسیم فیچرز, مشترکہ خرچ ایپ, ذاتی بجٹ فیچرز, قرض ٹریکر, PDF خرچ رپورٹ'
          : 'expense tracker features, bill splitting features, shared expense app, personal budget features, loan tracker, PDF expense report',
      structuredData: [softwareApplicationSchema(locale)]
    }),
    groupExpenseTracker: buildPageSeo({
      title:
        locale === 'ur'
          ? 'گروپ خرچ ٹریکر | ٹرپس، روم میٹس، گھر والے، اور تقریبات'
          : 'Group Expense Tracker | Split Bills for Trips, Roommates, Families, and Events',
      description:
        locale === 'ur'
          ? 'خرچے فائی سے گروپ کا خرچ ٹریک کریں، بل تقسیم کریں، رسیدیں لگائیں، مشترکہ قرضے دیکھیں، اہم تبدیلیوں کی منظوری لیں، اور بیلنس سیٹل کریں۔'
          : 'Use Kharchafy as a group expense tracker to split bills, save receipts, review shared loans, approve important changes, and settle balances with less confusion.',
      canonicalPath: `${localePrefix}/group-expense-tracker`,
      keywords:
        locale === 'ur'
          ? 'گروپ خرچ ٹریکر, بل تقسیم ایپ, روم میٹ خرچ ٹریکر, ٹرپ خرچ ٹریکر, فیملی خرچ, مشترکہ قرض ٹریکر, سیٹلمنٹ ٹریکر'
          : 'group expense tracker, split bills app, roommate expense tracker, travel expense tracker, family expense tracker, shared loan tracker, settlement tracker',
      structuredData: [softwareApplicationSchema(locale)]
    }),
    personalBudgetTracker: buildPageSeo({
      title:
        locale === 'ur'
          ? 'ذاتی بجٹ ٹریکر | تنخواہ، اخراجات، ذاتی قرضے، اور رپورٹس'
          : 'Personal Budget Tracker | Salary, Expenses, Personal Loans, and Reports',
      description:
        locale === 'ur'
          ? 'خرچے فائی کے ذاتی بجٹ ٹریکر سے ماہانہ تنخواہ، روزمرہ خرچ، کیٹیگریز، جسے پیسے دیے، ذاتی قرضے، باقی رقم، اور تفصیلی رپورٹس ٹریک کریں۔'
          : 'Track monthly salary, daily expenses, categories, recipients, personal loans, remaining balance, and detailed reports with Kharchafy’s personal budget tracker.',
      canonicalPath: `${localePrefix}/personal-budget-tracker`,
      keywords:
        locale === 'ur'
          ? 'ذاتی بجٹ ٹریکر, ماہانہ خرچ ٹریکر, تنخواہ بجٹ پلانر, ذاتی قرض ٹریکر, ذاتی خرچ رپورٹ'
          : 'personal budget tracker, monthly expense tracker, salary budget planner, personal loan tracker, personal expense report',
      structuredData: [softwareApplicationSchema(locale)]
    }),
    faq: buildPageSeo({
      title:
        locale === 'ur'
          ? 'خرچے فائی اکثر سوالات | بل تقسیم، خرچ، قرضے، بجٹ، اور رپورٹس'
          : 'Kharchafy FAQ | Bill Splitting, Expenses, Loans, Budgets, and Reports',
      description:
        locale === 'ur'
          ? 'خرچے فائی کے عام سوالات کے جواب پڑھیں، جیسے گروپس، بل تقسیم، منظوری، رسیدیں، ذاتی بجٹ، قرضے، زبانیں، پرائیویسی، اور رپورٹس۔'
          : 'Read answers to common questions about Kharchafy, including groups, bill splitting, approvals, receipts, personal budgets, loans, languages, privacy, and reports.',
      canonicalPath: `${localePrefix}/faq`,
      keywords:
        locale === 'ur'
          ? 'خرچے فائی سوالات, خرچ ٹریکر سوالات, بل تقسیم سوالات, مشترکہ قرض سوالات, ذاتی بجٹ سوالات'
          : 'Kharchafy FAQ, expense tracker questions, split bills questions, shared loan questions, personal budgeting questions',
      structuredData: [buildFaqSchema(FAQ_ITEMS[locale], locale)]
    }),
    help: buildPageSeo({
      title:
        locale === 'ur'
          ? 'خرچے فائی مدد | گروپس، خرچ، قرضے، بجٹ، منظوری، اور رپورٹس'
          : 'Kharchafy Help | Groups, Expenses, Loans, Budgets, Approvals, and Reports',
      description:
        locale === 'ur'
          ? 'خرچے فائی کی مدد گائیڈ پڑھیں، جس میں اکاؤنٹ، گروپس، گروپ خرچ، مشترکہ قرضے، ذاتی خرچ، ذاتی قرضے، رسیدیں، منظوری، نوٹیفکیشن، اور رپورٹس شامل ہیں۔'
          : 'Read the Kharchafy help guide covering accounts, groups, shared expenses, shared loans, personal expenses, personal loans, receipts, approvals, notifications, and reports.',
      canonicalPath: `${localePrefix}/help`,
      keywords:
        locale === 'ur'
          ? 'خرچے فائی مدد, خرچ ٹریکر مدد, گروپ خرچ گائیڈ, بل تقسیم گائیڈ, ذاتی بجٹ مدد, قرض ٹریکر مدد'
          : 'Kharchafy help, expense tracker help, group expense guide, bill splitting guide, personal budget help, loan tracker help',
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
          ? 'گروپ خرچ اور ذاتی بجٹ سنبھالنے کے لیے خرچے فائی اکاؤنٹ بنائیں۔'
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
