// Content for the Terms of Service and Privacy Policy public pages
// (src/components/public/TermsPage.vue, PrivacyPage.vue). Same convention as
// FEATURE_SECTIONS/FAQ_ITEMS in ./seo.js — locale-keyed arrays of section
// content, kept out of the i18n files because these are long-form blocks,
// not short UI chrome strings. Section icons are assigned separately, in
// each page component, index-matched to these arrays (see FeaturesPage.vue's
// FEATURE_ICONS for the established pattern).
//
// Facts in this content were verified against the actual codebase (auth
// flow, Firestore rules, Cloudinary usage, third-party SDKs, session
// storage, account deletion) rather than written from a generic template —
// see the "Terms of Service & Privacy Policy pages" plan for the full
// evidence trail. Operator identity, jurisdiction, minimum age, and the
// OCR/AI disclosure were confirmed directly with the app's owner.

export const LEGAL_LAST_UPDATED = {
  en: 'August 26, 2026',
  ur: '26 اگست 2026'
}

export const PRIVACY_SECTIONS = {
  en: [
    {
      title: 'Overview & who operates Kharchafy',
      paragraphs: [
        'Kharchafy is a personal and group expense, loan, and budget tracking app. This Privacy Policy explains what information we collect when you use Kharchafy, how we use it, who we share it with, and the choices you have.',
        'Kharchafy is owned and operated by Majid Ali, trading as LocalhostOnly.tech (majidev.netlify.app). If you have questions about this policy or your data, contact us at kharchafykhataapplication@gmail.com.'
      ]
    },
    {
      title: 'Information you provide',
      paragraphs: ['You choose to give us the following information:'],
      items: [
        'Account details: your name, mobile number, email address, and password when you register — or your name and email from Google if you sign in with Google.',
        'Profile photo: an optional photo you upload to your profile.',
        'Financial records you enter: shared expenses, shared loans, personal expenses, personal loans, monthly salary, categories, descriptions, dates, and settlement requests.',
        'Receipts: images you attach to expenses or loans as proof, and any text our OCR and AI tools extract from them to help fill in the amount, date, or description automatically.',
        'Bug reports: the title, category, description, and any screenshots you submit, along with your name and email so we can respond.'
      ]
    },
    {
      title: 'Information collected automatically',
      paragraphs: [
        'Some information is collected automatically as part of running the app:'
      ],
      items: [
        "Session data: a session identifier and your basic profile fields, encrypted and stored only in your browser's session storage while you're logged in — never as a cookie.",
        'Login protection: before checking your password, we send a one-way hash of the email you typed (not the email itself) to detect repeated failed attempts and slow down abuse.',
        'Preferences: your theme (light/dark) and language — and, only if you check "Remember Me", your email, name, and mobile saved in your browser so the login form can be pre-filled next time.',
        'Usage analytics: when enabled, Firebase Analytics records page views and sign-up, login, and logout events; Vercel Analytics and Speed Insights record anonymous page-performance and traffic statistics. Neither uses cookies.'
      ]
    },
    {
      title: 'How we use your information',
      paragraphs: ['We use the information above to:'],
      items: [
        'Create and secure your account, and let you sign in.',
        "Let you record, view, and manage your own and your group's expenses, loans, salary, and budgets.",
        "Read text from receipts you upload (using on-device OCR) and use AI to help structure that text into an expense's amount, date, or description — you can always review and correct anything before saving.",
        "Send optional email notifications about shared expense or loan activity in your groups, if you've turned this on in Settings.",
        'Investigate and respond to bug reports you submit.',
        'Protect the app from bots and abuse, using Firebase App Check and reCAPTCHA.',
        'Understand overall usage and performance so we can improve reliability, where analytics is enabled.'
      ]
    },
    {
      title: 'Third-party service providers',
      paragraphs: [
        'We rely on the following service providers to run Kharchafy. Each only receives what it needs to do its job, and none of them are permitted to sell your data:'
      ],
      items: [
        'Google Firebase — authentication, our database (Cloud Firestore), bot/abuse protection (App Check with reCAPTCHA), and optional usage analytics.',
        'Cloudinary — stores receipt images, profile photos, and bug-report screenshots (up to 1MB each).',
        'Vercel — hosts the app and provides privacy-friendly, cookie-less page analytics and performance monitoring.',
        'Atlassian Jira — stores and tracks the bug reports you submit, including your name, email, and any screenshots.',
        'Our own backend service — signs and manages Cloudinary uploads, sends notification and bug-report emails, structures OCR text with AI, and checks login attempts. It runs on infrastructure we control.'
      ]
    },
    {
      title: 'What other group members can see',
      paragraphs: [
        'When you join a group, the other members of that group can see your name, a masked version of your mobile number (for example, 03******67), your profile photo if you’ve set one, and the shared expenses, loans, and settlements you’re part of.',
        'Your real, unmasked mobile number and your email address are never shown to other members — only you can see them.'
      ]
    },
    {
      title: 'Data storage & security',
      paragraphs: [
        'Your account and financial records are stored in Google Cloud Firestore. Files (receipts, photos, screenshots) are stored with Cloudinary. Both providers encrypt data in transit (HTTPS) and at rest.',
        "Your in-browser session is encrypted before it's written to your browser's session storage, and access to sensitive account fields is restricted by server-side rules.",
        'No method of storage or transmission is 100% secure, and we cannot guarantee absolute security.'
      ]
    },
    {
      title: 'Data retention & account deletion',
      paragraphs: [
        'You can delete your account at any time from your Profile settings.',
        "If you don't own any group, deleting your account removes your Kharchafy sign-in and your profile record.",
        "If you own a group, deleting your account requires approval from the group's other owners first, since the group and its shared records depend on that ownership.",
        'Because shared expenses and loans are joint records that other group members rely on for their own accounting, deleting your account does not automatically erase the historical shared transactions you were part of — those remain visible to the group members who share them, even after your account is closed.',
        'You can already download your own expense and loan records as PDF or Excel reports at any time, if you want a personal copy of your data.'
      ]
    },
    {
      title: "Children's privacy",
      paragraphs: [
        'Kharchafy is intended for users who are 18 years of age or older. We do not knowingly collect information from anyone under 18. If you believe a minor has created an account, contact us and we will remove it.'
      ]
    },
    {
      title: 'Your choices',
      paragraphs: ['You have control over the following:'],
      items: [
        'Turn shared expense/loan email notifications on or off in Settings.',
        'Uncheck "Remember Me" at login, or clear your browser’s local storage, to remove saved login details.',
        'Update your profile name, photo, or password at any time.',
        'Delete your account, subject to the group-ownership approval described above.',
        'Contact us to ask what data we hold about you.'
      ]
    },
    {
      title: 'Changes to this policy',
      paragraphs: [
        'We may update this Privacy Policy as Kharchafy changes. We will update the "Last updated" date at the top of this page when we do. Continuing to use Kharchafy after a change means you accept the updated policy.'
      ]
    },
    {
      title: 'Contact us',
      paragraphs: [
        'Questions about this Privacy Policy or your data? Email us at kharchafykhataapplication@gmail.com.'
      ]
    }
  ],
  ur: [
    {
      title: 'خرچے فائی کون چلاتا ہے — تعارف',
      paragraphs: [
        'خرچے فائی ذاتی اور گروپ کے خرچ، قرضے، اور بجٹ ٹریک کرنے کی ایپ ہے۔ یہ پرائیویسی پالیسی بتاتی ہے کہ خرچے فائی استعمال کرتے وقت ہم کون سی معلومات جمع کرتے ہیں، انہیں کیسے استعمال کرتے ہیں، کس کے ساتھ شیئر کرتے ہیں، اور آپ کے پاس کیا اختیارات ہیں۔',
        'خرچے فائی کے مالک اور آپریٹر ماجد علی ہیں، برانڈ نیم LocalhostOnly.tech کے تحت (majidev.netlify.app)۔ اس پالیسی یا اپنے ڈیٹا سے متعلق کسی بھی سوال کے لیے kharchafykhataapplication@gmail.com پر رابطہ کریں۔'
      ]
    },
    {
      title: 'وہ معلومات جو آپ خود دیتے ہیں',
      paragraphs: ['آپ اپنی مرضی سے ہمیں یہ معلومات دیتے ہیں:'],
      items: [
        'اکاؤنٹ کی تفصیلات: رجسٹریشن کے وقت آپ کا نام، موبائل نمبر، ای میل، اور پاس ورڈ — یا اگر آپ Google سے لاگ ان کریں تو Google سے ملنے والا نام اور ای میل۔',
        'پروفائل فوٹو: ایک اختیاری تصویر جو آپ اپنے پروفائل پر لگاتے ہیں۔',
        'آپ کے درج کردہ مالی ریکارڈ: گروپ خرچ، مشترکہ قرضے، ذاتی خرچ، ذاتی قرضے، ماہانہ تنخواہ، کیٹیگریز، تفصیل، تاریخیں، اور سیٹلمنٹ درخواستیں۔',
        'رسیدیں: وہ تصاویر جو آپ ثبوت کے طور پر خرچ یا قرض کے ساتھ لگاتے ہیں، اور ہمارے OCR اور AI ٹولز ان سے جو متن نکالتے ہیں تاکہ رقم، تاریخ، یا تفصیل خودکار طریقے سے پُر ہو سکے۔',
        'بگ رپورٹس: آپ کی جمع کرائی گئی عنوان، کیٹیگری، تفصیل، اور کوئی بھی اسکرین شاٹ، ساتھ آپ کا نام اور ای میل تاکہ ہم جواب دے سکیں۔'
      ]
    },
    {
      title: 'وہ معلومات جو خودکار طور پر جمع ہوتی ہیں',
      paragraphs: [
        'ایپ چلانے کے دوران کچھ معلومات خودکار طور پر جمع ہوتی ہیں:'
      ],
      items: [
        'سیشن ڈیٹا: ایک سیشن آئی ڈی اور آپ کے بنیادی پروفائل فیلڈز، لاگ ان رہنے کے دوران خفیہ (encrypted) کر کے صرف براؤزر کے سیشن اسٹوریج میں رکھے جاتے ہیں — کبھی کوکی کے طور پر نہیں۔',
        'لاگ ان تحفظ: پاس ورڈ چیک کرنے سے پہلے، ہم آپ کے درج کردہ ای میل کا ون-وے ہیش (خود ای میل نہیں) بھیجتے ہیں تاکہ بار بار ناکام کوششیں پکڑی جا سکیں اور بدنیتی سست کی جا سکے۔',
        'ترجیحات: آپ کی تھیم (لائٹ/ڈارک) اور زبان — اور صرف اگر آپ "Remember Me" منتخب کریں تو آپ کا ای میل، نام، اور موبائل براؤزر میں محفوظ ہوتا ہے تاکہ اگلی بار لاگ ان فارم خودکار پُر ہو۔',
        'استعمال کے اعداد و شمار: جب فعال ہو تو Firebase Analytics صفحہ وزٹس اور سائن اپ، لاگ ان، اور لاگ آؤٹ ایونٹس ریکارڈ کرتا ہے؛ Vercel Analytics اور Speed Insights گمنام صفحہ کارکردگی اور ٹریفک کے اعداد و شمار ریکارڈ کرتے ہیں۔ دونوں میں سے کوئی بھی کوکی استعمال نہیں کرتا۔'
      ]
    },
    {
      title: 'ہم آپ کی معلومات کیسے استعمال کرتے ہیں',
      paragraphs: ['اوپر دی گئی معلومات ہم اس لیے استعمال کرتے ہیں:'],
      items: [
        'آپ کا اکاؤنٹ بنانے، محفوظ رکھنے، اور لاگ ان کرنے دینے کے لیے۔',
        'آپ کو اپنے اور اپنے گروپ کے خرچ، قرضے، تنخواہ، اور بجٹ ریکارڈ کرنے، دیکھنے، اور سنبھالنے دینے کے لیے۔',
        'آپ کی اپلوڈ کردہ رسیدوں سے متن پڑھنے (ڈیوائس پر OCR کے ذریعے) اور AI کی مدد سے اسے رقم، تاریخ، یا تفصیل میں ترتیب دینے کے لیے — محفوظ کرنے سے پہلے آپ ہمیشہ اسے چیک اور درست کر سکتے ہیں۔',
        'اگر آپ نے سیٹنگز میں فعال کیا ہو تو گروپ میں مشترکہ خرچ یا قرض کی سرگرمی پر اختیاری ای میل اطلاعات بھیجنے کے لیے۔',
        'آپ کی جمع کرائی گئی بگ رپورٹس کی تحقیق اور جواب دینے کے لیے۔',
        'Firebase App Check اور reCAPTCHA کے ذریعے ایپ کو بوٹس اور بدنیتی سے بچانے کے لیے۔',
        'جہاں اینالیٹکس فعال ہو، مجموعی استعمال اور کارکردگی سمجھنے کے لیے تاکہ ہم بھروسہ مندی بہتر بنا سکیں۔'
      ]
    },
    {
      title: 'تھرڈ پارٹی سروس فراہم کنندگان',
      paragraphs: [
        'خرچے فائی چلانے کے لیے ہم درج ذیل سروس فراہم کنندگان پر انحصار کرتے ہیں۔ ہر ایک کو صرف وہی ملتا ہے جو اس کے کام کے لیے ضروری ہو، اور کسی کو بھی آپ کا ڈیٹا بیچنے کی اجازت نہیں:'
      ],
      items: [
        'Google Firebase — تصدیق (authentication)، ہمارا ڈیٹا بیس (Cloud Firestore)، بوٹ/بدنیتی تحفظ (App Check اور reCAPTCHA)، اور اختیاری استعمال اینالیٹکس۔',
        'Cloudinary — رسید کی تصاویر، پروفائل فوٹوز، اور بگ رپورٹ اسکرین شاٹس محفوظ کرتا ہے (فی فائل 1MB تک)۔',
        'Vercel — ایپ ہوسٹ کرتا ہے اور پرائیویسی دوست، کوکی کے بغیر صفحہ اینالیٹکس اور کارکردگی مانیٹرنگ فراہم کرتا ہے۔',
        'Atlassian Jira — آپ کی جمع کرائی گئی بگ رپورٹس، بشمول نام، ای میل، اور اسکرین شاٹس، محفوظ اور ٹریک کرتا ہے۔',
        'ہماری اپنی بیک اینڈ سروس — Cloudinary اپلوڈز سائن اور سنبھالتی ہے، نوٹیفکیشن اور بگ رپورٹ ای میلز بھیجتی ہے، AI سے OCR متن ترتیب دیتی ہے، اور لاگ ان کوششیں چیک کرتی ہے۔ یہ ہمارے اپنے کنٹرول کردہ انفراسٹرکچر پر چلتی ہے۔'
      ]
    },
    {
      title: 'گروپ کے دوسرے ممبرز کیا دیکھ سکتے ہیں',
      paragraphs: [
        'جب آپ کسی گروپ میں شامل ہوتے ہیں تو اس گروپ کے دوسرے ممبرز آپ کا نام، آپ کے موبائل نمبر کا چھپا ہوا ورژن (مثلاً 03******67)، اگر لگایا ہو تو آپ کی پروفائل فوٹو، اور وہ مشترکہ خرچ، قرضے، اور سیٹلمنٹس دیکھ سکتے ہیں جن میں آپ شامل ہیں۔',
        'آپ کا اصل موبائل نمبر اور ای میل ایڈریس کبھی بھی دوسرے ممبرز کو نہیں دکھایا جاتا — صرف آپ انہیں دیکھ سکتے ہیں۔'
      ]
    },
    {
      title: 'ڈیٹا کا ذخیرہ اور سیکیورٹی',
      paragraphs: [
        'آپ کا اکاؤنٹ اور مالی ریکارڈ Google Cloud Firestore میں محفوظ ہوتے ہیں۔ فائلیں (رسیدیں، فوٹوز، اسکرین شاٹس) Cloudinary کے ساتھ محفوظ ہوتی ہیں۔ دونوں فراہم کنندگان ڈیٹا کو ٹرانسمیشن (HTTPS) اور آرام کی حالت میں خفیہ رکھتے ہیں۔',
        'آپ کا براؤزر سیشن، سیشن اسٹوریج میں لکھے جانے سے پہلے خفیہ کیا جاتا ہے، اور حساس اکاؤنٹ فیلڈز تک رسائی سرور سائیڈ قوانین سے محدود ہے۔',
        'کوئی بھی ذخیرہ یا ترسیل کا طریقہ 100% محفوظ نہیں ہوتا، اور ہم مکمل سیکیورٹی کی ضمانت نہیں دے سکتے۔'
      ]
    },
    {
      title: 'ڈیٹا کی مدت اور اکاؤنٹ ڈیلیٹ کرنا',
      paragraphs: [
        'آپ کسی بھی وقت اپنے پروفائل سیٹنگز سے اپنا اکاؤنٹ ڈیلیٹ کر سکتے ہیں۔',
        'اگر آپ کسی گروپ کے مالک نہیں ہیں، تو اکاؤنٹ ڈیلیٹ کرنے سے آپ کا خرچے فائی سائن ان اور پروفائل ریکارڈ ختم ہو جاتا ہے۔',
        'اگر آپ کسی گروپ کے مالک ہیں، تو اکاؤنٹ ڈیلیٹ کرنے کے لیے پہلے گروپ کے دوسرے مالکان کی منظوری درکار ہے، کیونکہ گروپ اور اس کے مشترکہ ریکارڈ اسی ملکیت پر منحصر ہیں۔',
        'چونکہ مشترکہ خرچ اور قرضے مشترکہ ریکارڈ ہیں جن پر گروپ کے دوسرے ممبرز اپنے حساب کے لیے انحصار کرتے ہیں، اکاؤنٹ ڈیلیٹ کرنے سے آپ کے ماضی کے مشترکہ لین دین خودکار طور پر مٹتے نہیں — وہ گروپ ممبرز کو نظر آتے رہتے ہیں جن کے ساتھ وہ مشترک تھے، اکاؤنٹ بند ہونے کے بعد بھی۔',
        'اگر آپ اپنے ڈیٹا کی ذاتی کاپی چاہتے ہیں تو آپ کسی بھی وقت اپنے خرچ اور قرض کے ریکارڈ PDF یا Excel رپورٹ کے طور پر پہلے ہی ڈاؤن لوڈ کر سکتے ہیں۔'
      ]
    },
    {
      title: 'بچوں کی پرائیویسی',
      paragraphs: [
        'خرچے فائی 18 سال یا اس سے زائد عمر کے صارفین کے لیے ہے۔ ہم جان بوجھ کر 18 سال سے کم عمر کسی سے معلومات جمع نہیں کرتے۔ اگر آپ کو لگے کہ کسی نابالغ نے اکاؤنٹ بنایا ہے تو ہم سے رابطہ کریں، ہم اسے ہٹا دیں گے۔'
      ]
    },
    {
      title: 'آپ کے اختیارات',
      paragraphs: ['درج ذیل پر آپ کا مکمل اختیار ہے:'],
      items: [
        'سیٹنگز میں مشترکہ خرچ/قرض کی ای میل اطلاعات آن یا آف کریں۔',
        'لاگ ان پر "Remember Me" ان چیک کریں، یا محفوظ لاگ ان تفصیلات ہٹانے کے لیے اپنے براؤزر کا لوکل اسٹوریج صاف کریں۔',
        'اپنی پروفائل کا نام، فوٹو، یا پاس ورڈ کسی بھی وقت اپ ڈیٹ کریں۔',
        'اوپر بیان کردہ گروپ ملکیت کی منظوری کے تابع، اپنا اکاؤنٹ ڈیلیٹ کریں۔',
        'ہم سے پوچھیں کہ ہمارے پاس آپ کا کیا ڈیٹا موجود ہے۔'
      ]
    },
    {
      title: 'اس پالیسی میں تبدیلیاں',
      paragraphs: [
        'خرچے فائی میں تبدیلیوں کے ساتھ ہم اس پرائیویسی پالیسی کو اپ ڈیٹ کر سکتے ہیں۔ ایسا کرنے پر ہم اس صفحے کے اوپر "آخری اپ ڈیٹ" کی تاریخ بدل دیں گے۔ تبدیلی کے بعد خرچے فائی استعمال جاری رکھنے کا مطلب ہے کہ آپ نئی پالیسی سے متفق ہیں۔'
      ]
    },
    {
      title: 'ہم سے رابطہ کریں',
      paragraphs: [
        'اس پرائیویسی پالیسی یا اپنے ڈیٹا سے متعلق سوالات؟ kharchafykhataapplication@gmail.com پر ای میل کریں۔'
      ]
    }
  ]
}

export const TERMS_SECTIONS = {
  en: [
    {
      title: 'Acceptance of terms',
      paragraphs: [
        'These Terms of Service ("Terms") govern your use of Kharchafy, operated by Majid Ali / LocalhostOnly.tech. By creating an account or using Kharchafy, you agree to these Terms and to our Privacy Policy. If you don’t agree, please don’t use the app.'
      ]
    },
    {
      title: 'Description of service',
      paragraphs: [
        'Kharchafy is a bookkeeping and tracking tool for shared and personal expenses, loans, and budgets. It helps you record who paid what, who owes what, and how balances change over time.',
        'Kharchafy does not move, hold, or transfer real money. All actual payments and settlements between you and other users happen outside the app, by whatever method you agree on. Kharchafy only keeps a record of what you tell it.'
      ]
    },
    {
      title: 'Eligibility',
      paragraphs: [
        'You must be at least 18 years old to create a Kharchafy account.'
      ]
    },
    {
      title: 'Your account & responsibilities',
      paragraphs: [
        "You're responsible for the accuracy of the information you provide and for keeping your password confidential."
      ],
      items: [
        "One account per person — don't create or use an account on someone else's behalf without their permission.",
        'Notify us immediately at kharchafykhataapplication@gmail.com if you suspect unauthorized access to your account.',
        "You're responsible for the financial entries, receipts, and other content you add to Kharchafy."
      ]
    },
    {
      title: 'Acceptable use',
      paragraphs: ['When using Kharchafy, you agree not to:'],
      items: [
        'Use the app for anything illegal, fraudulent, or to misrepresent real transactions.',
        "Upload receipts, screenshots, or other content that is illegal, abusive, or infringes someone else's rights.",
        'Attempt to bypass approval workflows, impersonate another member, or manipulate group balances dishonestly.',
        'Scrape, reverse-engineer, or use automated tools against Kharchafy outside of normal app use.',
        "Interfere with the app's security, including Firebase App Check / reCAPTCHA protections."
      ]
    },
    {
      title: 'Groups & shared data',
      paragraphs: [
        'Joining a group means the other members of that group can see your name, masked mobile number, profile photo, and the shared expenses, loans, and settlements you’re part of — see our Privacy Policy for details.',
        "Sensitive group changes (like adding or removing a member, or editing/deleting a shared expense) require approval from the group's other members before they take effect.",
        "You're responsible for who you invite into your groups."
      ]
    },
    {
      title: 'Financial disclaimer',
      paragraphs: [
        "Kharchafy is a record-keeping tool, not a bank, payment processor, escrow service, or financial advisor. We don't verify that a recorded payment actually happened, and we're not a party to any debt or agreement between you and another user.",
        'Disputes about money owed between group members are between those members. Kharchafy is not responsible for unpaid debts, incorrect entries made by another member, or disagreements about a settlement.'
      ]
    },
    {
      title: 'Your content',
      paragraphs: [
        'You keep ownership of the expense, loan, and budget data you enter into Kharchafy.',
        "By entering shared data into a group, you grant the other members of that group — and Kharchafy, as needed to run the service — a license to store, process, and display that data as part of the group's records."
      ]
    },
    {
      title: 'Third-party services',
      paragraphs: [
        'Kharchafy relies on third-party services — including Firebase, Cloudinary, Vercel, and Atlassian Jira — described in our Privacy Policy. Your use of Kharchafy is also subject to those providers’ own terms where applicable.'
      ]
    },
    {
      title: 'Termination',
      paragraphs: [
        'You may stop using Kharchafy and delete your account at any time, as described in our Privacy Policy.',
        'We may suspend or terminate an account that violates these Terms, misuses the app, or poses a risk to other users.'
      ]
    },
    {
      title: 'Disclaimers',
      paragraphs: [
        'Kharchafy is provided "as is" and "as available." We don’t guarantee the app will be uninterrupted, error-free, or that OCR/AI-extracted receipt data will always be accurate — always review entries before relying on them.'
      ]
    },
    {
      title: 'Limitation of liability',
      paragraphs: [
        'To the maximum extent permitted by law, Kharchafy, Majid Ali, and LocalhostOnly.tech are not liable for indirect, incidental, or consequential damages, lost data, or disputes between users arising from your use of the app.'
      ]
    },
    {
      title: 'Governing law',
      paragraphs: [
        'These Terms are governed by the laws of Pakistan, and any dispute will be subject to the jurisdiction of the courts of Pakistan.'
      ]
    },
    {
      title: 'Changes to these terms',
      paragraphs: [
        'We may update these Terms from time to time. We’ll update the "Last updated" date when we do. Continuing to use Kharchafy after a change means you accept the updated Terms.'
      ]
    },
    {
      title: 'Contact us',
      paragraphs: [
        'Questions about these Terms? Email us at kharchafykhataapplication@gmail.com.'
      ]
    }
  ],
  ur: [
    {
      title: 'شرائط کی منظوری',
      paragraphs: [
        'یہ شرائط و ضوابط ("شرائط") خرچے فائی کے استعمال کو کنٹرول کرتی ہیں، جو ماجد علی / LocalhostOnly.tech چلاتے ہیں۔ اکاؤنٹ بنا کر یا خرچے فائی استعمال کر کے آپ ان شرائط اور ہماری پرائیویسی پالیسی سے متفق ہوتے ہیں۔ اگر آپ متفق نہیں تو براہ کرم ایپ استعمال نہ کریں۔'
      ]
    },
    {
      title: 'سروس کی تفصیل',
      paragraphs: [
        'خرچے فائی مشترکہ اور ذاتی خرچ، قرضے، اور بجٹ کے لیے ایک حساب رکھنے کا ٹول ہے۔ یہ ریکارڈ رکھنے میں مدد دیتا ہے کہ کس نے کیا ادا کیا، کس کے ذمے کیا ہے، اور وقت کے ساتھ بیلنس کیسے بدلا۔',
        'خرچے فائی اصل پیسے منتقل، محفوظ، یا ٹرانسفر نہیں کرتا۔ آپ اور دوسرے صارفین کے درمیان اصل ادائیگیاں اور سیٹلمنٹ ایپ سے باہر، آپ کے طے کردہ کسی بھی طریقے سے ہوتی ہیں۔ خرچے فائی صرف وہی ریکارڈ رکھتا ہے جو آپ اسے بتاتے ہیں۔'
      ]
    },
    {
      title: 'اہلیت',
      paragraphs: [
        'خرچے فائی اکاؤنٹ بنانے کے لیے آپ کی عمر کم از کم 18 سال ہونی چاہیے۔'
      ]
    },
    {
      title: 'آپ کا اکاؤنٹ اور ذمہ داریاں',
      paragraphs: [
        'آپ اپنی دی گئی معلومات کی درستگی اور اپنے پاس ورڈ کو خفیہ رکھنے کے ذمہ دار ہیں۔'
      ],
      items: [
        'فی شخص ایک اکاؤنٹ — کسی اور کی اجازت کے بغیر اس کی طرف سے اکاؤنٹ نہ بنائیں یا استعمال نہ کریں۔',
        'اگر آپ کو اپنے اکاؤنٹ تک غیر مجاز رسائی کا شبہ ہو تو فوراً kharchafykhataapplication@gmail.com پر ہمیں بتائیں۔',
        'آپ خرچے فائی میں شامل کیے گئے مالی اندراجات، رسیدوں، اور دیگر مواد کے ذمہ دار ہیں۔'
      ]
    },
    {
      title: 'قابل قبول استعمال',
      paragraphs: ['خرچے فائی استعمال کرتے وقت آپ ان باتوں سے متفق ہیں:'],
      items: [
        'ایپ کو کسی غیر قانونی، دھوکہ دہی، یا اصل لین دین کو غلط ظاہر کرنے کے لیے استعمال نہ کریں۔',
        'ایسی رسیدیں، اسکرین شاٹس، یا مواد اپلوڈ نہ کریں جو غیر قانونی، توہین آمیز ہو، یا کسی اور کے حقوق کی خلاف ورزی کرے۔',
        'منظوری کے عمل کو نظر انداز کرنے، کسی دوسرے ممبر کا روپ دھارنے، یا گروپ بیلنس میں بددیانتی سے ردوبدل کرنے کی کوشش نہ کریں۔',
        'خرچے فائی کے خلاف عام ایپ استعمال کے علاوہ اسکریپنگ، ریورس انجینئرنگ، یا خودکار ٹولز استعمال نہ کریں۔',
        'ایپ کی سیکیورٹی میں مداخلت نہ کریں، بشمول Firebase App Check / reCAPTCHA کے تحفظات۔'
      ]
    },
    {
      title: 'گروپس اور مشترکہ ڈیٹا',
      paragraphs: [
        'کسی گروپ میں شامل ہونے کا مطلب ہے کہ اس گروپ کے دوسرے ممبرز آپ کا نام، چھپا ہوا موبائل نمبر، پروفائل فوٹو، اور وہ مشترکہ خرچ، قرضے، اور سیٹلمنٹس دیکھ سکتے ہیں جن میں آپ شامل ہیں — تفصیل کے لیے ہماری پرائیویسی پالیسی دیکھیں۔',
        'حساس گروپ تبدیلیاں (جیسے ممبر شامل یا ختم کرنا، یا مشترکہ خرچ ایڈٹ/ڈیلیٹ کرنا) نافذ ہونے سے پہلے گروپ کے دوسرے ممبرز کی منظوری درکار ہوتی ہیں۔',
        'آپ اپنے گروپس میں کسے دعوت دیتے ہیں اس کے ذمہ دار آپ ہیں۔'
      ]
    },
    {
      title: 'مالی وضاحت',
      paragraphs: [
        'خرچے فائی ایک ریکارڈ رکھنے کا ٹول ہے، بینک، پیمنٹ پروسیسر، ایسکرو سروس، یا مالی مشیر نہیں۔ ہم تصدیق نہیں کرتے کہ کوئی ریکارڈ شدہ ادائیگی واقعی ہوئی، اور نہ ہی ہم آپ اور کسی دوسرے صارف کے درمیان کسی قرض یا معاہدے کا حصہ ہیں۔',
        'گروپ ممبرز کے درمیان واجب الادا رقم کے تنازعات انہی ممبرز کے درمیان ہیں۔ خرچے فائی غیر ادا شدہ قرضوں، کسی دوسرے ممبر کے غلط اندراج، یا سیٹلمنٹ پر اختلاف کا ذمہ دار نہیں۔'
      ]
    },
    {
      title: 'آپ کا مواد',
      paragraphs: [
        'خرچے فائی میں درج کردہ خرچ، قرض، اور بجٹ ڈیٹا کی ملکیت آپ کے پاس رہتی ہے۔',
        'گروپ میں مشترکہ ڈیٹا شامل کر کے، آپ اس گروپ کے دوسرے ممبرز کو — اور سروس چلانے کی حد تک خرچے فائی کو — یہ ڈیٹا گروپ کے ریکارڈ کے حصے کے طور پر محفوظ، پروسیس، اور ظاہر کرنے کا اختیار دیتے ہیں۔'
      ]
    },
    {
      title: 'تھرڈ پارٹی سروسز',
      paragraphs: [
        'خرچے فائی تھرڈ پارٹی سروسز پر انحصار کرتا ہے — بشمول Firebase، Cloudinary، Vercel، اور Atlassian Jira — جن کی تفصیل ہماری پرائیویسی پالیسی میں موجود ہے۔ خرچے فائی کا استعمال، جہاں لاگو ہو، ان فراہم کنندگان کی اپنی شرائط سے بھی مشروط ہے۔'
      ]
    },
    {
      title: 'اکاؤنٹ کا خاتمہ',
      paragraphs: [
        'آپ کسی بھی وقت خرچے فائی کا استعمال روک سکتے ہیں اور اپنا اکاؤنٹ ڈیلیٹ کر سکتے ہیں، جیسا کہ ہماری پرائیویسی پالیسی میں بیان کیا گیا ہے۔',
        'ہم ایسے اکاؤنٹ کو معطل یا ختم کر سکتے ہیں جو ان شرائط کی خلاف ورزی کرے، ایپ کا غلط استعمال کرے، یا دوسرے صارفین کے لیے خطرہ ہو۔'
      ]
    },
    {
      title: 'دستبرداری (Disclaimers)',
      paragraphs: [
        'خرچے فائی "جیسا ہے" اور "جیسا دستیاب ہے" کی بنیاد پر فراہم کی جاتی ہے۔ ہم اس بات کی ضمانت نہیں دیتے کہ ایپ بلاتعطل، بے خطا ہو گی، یا OCR/AI سے نکالا گیا رسید کا ڈیٹا ہمیشہ درست ہو گا — محفوظ کرنے سے پہلے ہمیشہ اندراجات چیک کریں۔'
      ]
    },
    {
      title: 'ذمہ داری کی حد',
      paragraphs: [
        'قانون کی اجازت کی حد تک، خرچے فائی، ماجد علی، اور LocalhostOnly.tech آپ کے ایپ استعمال سے پیدا ہونے والے بالواسطہ، اتفاقی، یا نتیجاتی نقصانات، ڈیٹا کے ضیاع، یا صارفین کے درمیان تنازعات کے ذمہ دار نہیں۔'
      ]
    },
    {
      title: 'قابل اطلاق قانون',
      paragraphs: [
        'یہ شرائط پاکستان کے قوانین کے تحت چلتی ہیں، اور کوئی بھی تنازع پاکستان کی عدالتوں کے دائرہ اختیار میں آئے گا۔'
      ]
    },
    {
      title: 'ان شرائط میں تبدیلیاں',
      paragraphs: [
        'ہم وقتاً فوقتاً ان شرائط کو اپ ڈیٹ کر سکتے ہیں۔ ایسا کرنے پر ہم "آخری اپ ڈیٹ" کی تاریخ بدل دیں گے۔ تبدیلی کے بعد خرچے فائی استعمال جاری رکھنے کا مطلب ہے کہ آپ نئی شرائط سے متفق ہیں۔'
      ]
    },
    {
      title: 'ہم سے رابطہ کریں',
      paragraphs: [
        'ان شرائط سے متعلق سوالات؟ kharchafykhataapplication@gmail.com پر ای میل کریں۔'
      ]
    }
  ]
}
