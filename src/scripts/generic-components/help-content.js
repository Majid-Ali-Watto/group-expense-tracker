export const SECTION_NAMES = [
  'start',
  'groups',
  'expenses',
  'shared-loans',
  'personal-loans',
  'settlement',
  'users',
  'net-position',
  'salary',
  'notifications',
  'charts',
  'export',
  'theme'
]

export const HELP_INTRO = {
  en: 'Kharchafy helps you track, split, and settle shared expenses and loans with your friends and groups. Here is everything you can do:',
  ur: 'خرچے فائی آپ کو دوستوں اور گروپس کے ساتھ مشترکہ اخراجات اور قرضے ٹریک کرنے، تقسیم کرنے، اور طے کرنے میں مدد دیتا ہے۔ یہاں وہ سب کچھ ہے جو آپ کر سکتے ہیں:'
}

export const HELP_SECTIONS = {
  en: [
    {
      name: 'start',
      title: 'Getting Started',
      items: [
        {
          term: 'Register',
          description:
            'Sign up with your name, mobile number, email, and password.'
        },
        {
          term: 'Verify Email',
          description:
            'Check your inbox for a verification link. You must verify before logging in.'
        },
        {
          term: 'Login',
          description: 'Use your email and password to sign in.'
        },
        {
          term: 'Remember Me',
          description:
            'Optionally keep your email pre-filled and use longer Firebase auth persistence on this device.'
        },
        {
          term: 'Forgot Password',
          description:
            'Use the "Forgot Password" link on the login screen to get a reset email.'
        },
        {
          term: 'Session Timeout',
          description:
            'Logged-in sessions auto-logout after inactivity and show a message explaining what happened.'
        }
      ]
    },
    {
      name: 'groups',
      title: 'Groups',
      items: [
        {
          term: 'Create a Group',
          description:
            'Go to the Groups tab, click "Create Group", give it a name, and add at least one other member.'
        },
        {
          term: 'Select Active Group',
          description:
            'Click "Select" on any group to make it active. Shared Expenses and Loans will use this group.'
        },
        {
          term: 'Add Members',
          description:
            'Search for registered users by name or mobile and send a group join request. All existing members must approve.'
        },
        {
          term: 'Remove Members',
          description:
            'Any member can request a removal; all remaining members must approve.'
        },
        {
          term: 'Pending Invitations',
          description:
            'If someone added you to a group, you will see an invitation to accept or decline.'
        },
        {
          term: 'Edit / Delete Group',
          description:
            'Only the group owner can rename or delete a group. Deletion requires all members to approve.'
        },
        {
          term: 'Filter & Sort',
          description:
            'Sort groups A–Z or Z–A. Filter groups by a specific member.'
        }
      ]
    },
    {
      name: 'expenses',
      title: 'Shared Expenses',
      items: [
        {
          term: 'Add Expense',
          description:
            'Click the "+" button. Enter description, amount, date, and choose who paid and how to split.'
        },
        {
          term: 'Single Payer',
          description: 'One person paid the full amount.'
        },
        {
          term: 'Multiple Payers',
          description: 'More than one person paid different portions.'
        },
        {
          term: 'Equal Split',
          description: 'The total is divided equally among all members.'
        },
        {
          term: 'Custom Split',
          description: 'Assign exact amounts each member owes.'
        },
        {
          term: 'Attach Receipt',
          description: 'Upload a photo of the receipt (JPG, PNG, up to 1 MB).'
        },
        {
          term: 'Edit / Delete',
          description:
            'Requests an edit or delete that all group members must approve before it takes effect.'
        },
        {
          term: 'Filters',
          description:
            'Filter the list by Month, Payer, Payer Mode (single/multiple), or Split Mode (equal/custom).'
        },
        {
          term: 'Expense Summary',
          description:
            'Expandable accordion showing totals, who paid what, and visual charts.'
        },
        {
          term: 'Settlement',
          description:
            'Shows who needs to pay whom to settle the current expenses. See the Settlement section below.'
        },
        {
          term: 'Download',
          description: 'Export to PDF or Excel from any expense list.'
        }
      ]
    },
    {
      name: 'shared-loans',
      title: 'Shared Loans',
      items: [
        {
          term: 'Add Loan',
          description:
            'Record a loan between group members: who gave, who received, amount, and date.'
        },
        {
          term: 'ME? Checkbox',
          description:
            'Quickly select yourself as the giver or receiver without typing your details.'
        },
        {
          term: 'Select from Users',
          description:
            'Use the "Select from Users" dropdown to auto-fill the giver or receiver from the registered users list.'
        },
        {
          term: 'Loan Summary',
          description:
            'See total lent, total borrowed, and your net balance with charts.'
        },
        {
          term: 'Who Pays Whom',
          description:
            'A table showing the simplified settlement between all loan participants.'
        },
        {
          term: 'Filter',
          description: 'Filter by month to see loans for a specific period.'
        },
        {
          term: 'Download',
          description: 'Export loan records to PDF or Excel.'
        },
        {
          term: 'Two-person flow',
          description:
            'If a group has more than two members, the app shows a warning because shared loans work best for two-party groups.'
        }
      ]
    },
    {
      name: 'personal-loans',
      title: 'Personal Loans',
      items: [
        {
          term: 'What it is',
          description:
            'Record one-on-one loans between any two people, outside of any group.'
        },
        {
          term: 'Add Loan',
          description:
            'Enter giver name and mobile, receiver name and mobile, amount, date, and optional note.'
        },
        {
          term: 'Select from Users',
          description:
            'Use the dropdown to pick a registered user; their name and masked mobile fill in automatically.'
        },
        {
          term: 'ME? Checkbox',
          description: 'Quickly fill in your own details as giver or receiver.'
        },
        {
          term: 'Filter by Month',
          description: 'View loans for a specific month or all months.'
        },
        {
          term: 'Filter by Giver',
          description: 'Show only loans from a specific person.'
        },
        {
          term: 'Loan Summary',
          description:
            'Total you lent, total you borrowed, overall balance, with donut and bar charts.'
        },
        {
          term: 'Who Pays Whom',
          description: 'Simplified settlement table for all personal loans.'
        },
        { term: 'Download', description: 'Export to PDF or Excel.' }
      ]
    },
    {
      name: 'settlement',
      title: 'Settlement',
      items: [
        {
          term: 'What it is',
          description:
            'After expenses are recorded, Kharchafy calculates the minimum set of payments to settle all balances.'
        },
        {
          term: 'Request Settlement',
          description:
            'Any member can request a settlement for a selected month. All members receive a notification to approve.'
        },
        {
          term: 'Approve / Reject',
          description:
            'Each member reviews and approves or rejects the settlement request.'
        },
        {
          term: 'Finalize',
          description:
            'Once all members approve, the group admin can finalize the settlement. Payments are recorded automatically.'
        }
      ]
    },
    {
      name: 'users',
      title: 'Users',
      items: [
        {
          term: 'Browse Users',
          description:
            'See all registered users. Mobile numbers are masked for privacy.'
        },
        {
          term: 'Search',
          description: 'Search by name, mobile, or group name.'
        },
        { term: 'Sort', description: 'Sort users alphabetically A–Z or Z–A.' },
        {
          term: 'Shared Groups Only',
          description: 'Filter to show only users who share a group with you.'
        },
        {
          term: 'User Groups',
          description: 'Each user card shows which groups they are in.'
        }
      ]
    },
    {
      name: 'net-position',
      title: 'Expenses Summary',
      items: [
        {
          term: 'Open it',
          description:
            'Click "Expenses Summary" in the top header bar (or the menu on mobile).'
        },
        {
          term: 'What it shows',
          description:
            'Your complete financial picture: how much you will receive vs. how much you will pay, across Shared Expenses, Shared Loans, and Personal Loans.'
        },
        {
          term: 'Net Position',
          description:
            'A single number showing your overall balance. Positive means others pay you; negative means you pay others.'
        },
        {
          term: 'Charts',
          description:
            'A donut chart for the overall split and a bar chart for per-category breakdown.'
        },
        {
          term: 'Download PDF',
          description: 'Save the full summary including charts as a PDF.'
        }
      ]
    },
    {
      name: 'salary',
      title: 'Monthly Salary Manager',
      items: [
        {
          term: 'What it is',
          description: 'A personal finance tool separate from group expenses.'
        },
        {
          term: 'Add Salary',
          description: 'Enter your monthly salary for any month.'
        },
        {
          term: 'Add Personal Expenses',
          description: 'Record your own expenses for that month.'
        },
        {
          term: 'Balance',
          description: 'See your net income after expenses for each month.'
        },
        {
          term: 'Download',
          description: 'Export your salary and expense records.'
        }
      ]
    },
    {
      name: 'notifications',
      title: 'Notifications',
      items: [
        {
          term: 'Bell Icon',
          description:
            'The bell in the top header shows a count of pending actions that need your attention.'
        },
        {
          term: 'Types of notifications',
          description:
            'Pending expense edit/delete approvals, loan approvals, group member requests, and settlement requests.'
        },
        {
          term: 'Click to navigate',
          description:
            'Tap any notification to go directly to the relevant section.'
        },
        {
          term: 'In-page alerts',
          description:
            'Some pages also show pending requests at the top so you can approve or reject inline.'
        }
      ]
    },
    {
      name: 'charts',
      title: 'Charts & Visuals',
      items: [
        {
          term: 'Donut Charts',
          description:
            'Show proportions, e.g. who paid what share, or lent vs. borrowed.'
        },
        {
          term: 'Bar Charts',
          description:
            'Compare amounts side by side, e.g. how much each person paid or owes.'
        },
        {
          term: 'Where to find them',
          description:
            'Inside the Expense Summary accordion on Shared Expenses, the Loan Summary accordion on Personal Loans and Shared Loans, and in the Expenses Summary dialog.'
        },
        {
          term: 'Reactive',
          description: 'Charts update automatically when you change filters.'
        }
      ]
    },
    {
      name: 'export',
      title: 'Exporting Data',
      items: [
        {
          term: 'Download PDF',
          description:
            'Captures the full page (including summary cards and charts) as a formatted PDF with the Kharchafy branding and page numbers.'
        },
        {
          term: 'Download Excel',
          description:
            'Exports all visible rows as a spreadsheet (.xlsx) for use in any spreadsheet app.'
        },
        {
          term: 'Available on',
          description:
            'Shared Expenses list, Shared Loans list, Personal Loans list, and the Expenses Summary dialog.'
        },
        {
          term: 'Report month',
          description:
            'The downloaded file name includes the current month for easy filing.'
        }
      ]
    },
    {
      name: 'theme',
      title: 'Theme & Appearance',
      items: [
        {
          term: 'Toggle',
          description:
            'Click the sun/moon icon in the header to switch between Light and Dark mode.'
        },
        {
          term: 'Persists',
          description:
            'Your theme preference is saved and restored automatically each time you open the app.'
        },
        {
          term: 'Mobile',
          description:
            'On mobile, the theme toggle is inside the hamburger menu at the top right.'
        },
        {
          term: 'Help Access',
          description:
            'Guests can read the public help page at `/help`, and logged-in users can also open the help dialog from the header.'
        }
      ]
    }
  ],
  ur: [
    {
      name: 'start',
      title: 'ابتدائیات',
      items: [
        {
          term: 'رجسٹریشن',
          description:
            'اپنے نام، موبائل نمبر، ای میل، اور پاس ورڈ کے ساتھ سائن اپ کریں۔'
        },
        {
          term: 'ای میل کی تصدیق',
          description:
            'تصدیقی لنک کے لیے اپنا ان باکس چیک کریں۔ لاگ ان کرنے سے پہلے تصدیق ضروری ہے۔'
        },
        {
          term: 'لاگ ان',
          description:
            'سائن ان کرنے کے لیے اپنا ای میل اور پاس ورڈ استعمال کریں۔'
        },
        {
          term: 'مجھے یاد رکھیں',
          description:
            'اختیاری طور پر اپنا ای میل پہلے سے بھرا رکھیں اور اس ڈیوائس پر طویل تر Firebase تصدیقی مدت استعمال کریں۔'
        },
        {
          term: 'پاس ورڈ بھول گئے',
          description:
            'ری سیٹ ای میل حاصل کرنے کے لیے لاگ ان اسکرین پر "پاس ورڈ بھول گئے" لنک استعمال کریں۔'
        },
        {
          term: 'سیشن ٹائم آؤٹ',
          description:
            'غیر فعالیت کے بعد لاگ ان سیشنز خودکار طور پر لاگ آؤٹ ہو جاتے ہیں اور وضاحتی پیغام دکھاتے ہیں۔'
        }
      ]
    },
    {
      name: 'groups',
      title: 'گروپس',
      items: [
        {
          term: 'گروپ بنائیں',
          description:
            'گروپس ٹیب پر جائیں، "گروپ بنائیں" پر کلک کریں، اسے نام دیں، اور کم از کم ایک اور رکن شامل کریں۔'
        },
        {
          term: 'فعال گروپ منتخب کریں',
          description:
            'کسی بھی گروپ کو فعال بنانے کے لیے "منتخب کریں" پر کلک کریں۔ مشترکہ اخراجات اور قرضے اسی گروپ کو استعمال کریں گے۔'
        },
        {
          term: 'اراکین شامل کریں',
          description:
            'نام یا موبائل کے ذریعے رجسٹرڈ صارفین تلاش کریں اور گروپ میں شمولیت کی درخواست بھیجیں۔ تمام موجودہ اراکین کی منظوری ضروری ہے۔'
        },
        {
          term: 'اراکین ہٹائیں',
          description:
            'کوئی بھی رکن اخراج کی درخواست دے سکتا ہے؛ باقی تمام اراکین کی منظوری ضروری ہے۔'
        },
        {
          term: 'زیرِ التوا دعوت نامے',
          description:
            'اگر کسی نے آپ کو گروپ میں شامل کیا ہے تو آپ کو قبول یا مسترد کرنے کے لیے ایک دعوت نامہ نظر آئے گا۔'
        },
        {
          term: 'گروپ میں ترمیم / حذف',
          description:
            'صرف گروپ کا مالک گروپ کا نام تبدیل یا اسے حذف کر سکتا ہے۔ حذف کرنے کے لیے تمام اراکین کی منظوری درکار ہے۔'
        },
        {
          term: 'فلٹر اور ترتیب',
          description:
            'گروپس کو A–Z یا Z–A ترتیب دیں۔ کسی مخصوص رکن کے حساب سے گروپس فلٹر کریں۔'
        }
      ]
    },
    {
      name: 'expenses',
      title: 'مشترکہ اخراجات',
      items: [
        {
          term: 'خرچ شامل کریں',
          description:
            '"+" بٹن پر کلک کریں۔ تفصیل، رقم، تاریخ درج کریں، اور منتخب کریں کہ کس نے ادائیگی کی اور کیسے تقسیم ہوگی۔'
        },
        {
          term: 'واحد ادائیگی کنندہ',
          description: 'ایک شخص نے پوری رقم ادا کی۔'
        },
        {
          term: 'متعدد ادائیگی کنندگان',
          description: 'ایک سے زیادہ افراد نے مختلف حصے ادا کیے۔'
        },
        {
          term: 'برابر تقسیم',
          description: 'کل رقم تمام اراکین میں برابر تقسیم کی جاتی ہے۔'
        },
        {
          term: 'حسبِ ضرورت تقسیم',
          description: 'ہر رکن پر واجب الادا صحیح رقم مقرر کریں۔'
        },
        {
          term: 'رسید منسلک کریں',
          description:
            'رسید کی تصویر اپ لوڈ کریں (JPG، PNG، زیادہ سے زیادہ 1 MB)۔'
        },
        {
          term: 'ترمیم / حذف',
          description:
            'ترمیم یا حذف کی درخواست دیتا ہے جسے نافذ ہونے سے پہلے تمام گروپ اراکین کی منظوری درکار ہوتی ہے۔'
        },
        {
          term: 'فلٹرز',
          description:
            'فہرست کو مہینے، ادائیگی کنندہ، ادائیگی موڈ (واحد/متعدد)، یا تقسیم موڈ (برابر/حسبِ ضرورت) کے حساب سے فلٹر کریں۔'
        },
        {
          term: 'اخراجات کا خلاصہ',
          description:
            'پھیلنے والا حصہ جو کل رقم، کس نے کیا ادا کیا، اور بصری چارٹس دکھاتا ہے۔'
        },
        {
          term: 'تصفیہ',
          description:
            'دکھاتا ہے کہ موجودہ اخراجات کے تصفیے کے لیے کس نے کسے ادائیگی کرنی ہے۔ نیچے تصفیہ سیکشن دیکھیں۔'
        },
        {
          term: 'ڈاؤن لوڈ',
          description:
            'کسی بھی اخراجات کی فہرست سے PDF یا Excel میں ایکسپورٹ کریں۔'
        }
      ]
    },
    {
      name: 'shared-loans',
      title: 'مشترکہ قرضے',
      items: [
        {
          term: 'قرض شامل کریں',
          description:
            'گروپ اراکین کے درمیان قرض ریکارڈ کریں: کس نے دیا، کس نے وصول کیا، رقم، اور تاریخ۔'
        },
        {
          term: 'میں؟ چیک باکس',
          description:
            'اپنی تفصیلات ٹائپ کیے بغیر جلدی سے خود کو دینے والا یا وصول کنندہ منتخب کریں۔'
        },
        {
          term: 'صارفین سے منتخب کریں',
          description:
            'رجسٹرڈ صارفین کی فہرست سے دینے والے یا وصول کنندہ کو خودکار طور پر بھرنے کے لیے "صارفین سے منتخب کریں" ڈراپ ڈاؤن استعمال کریں۔'
        },
        {
          term: 'قرض کا خلاصہ',
          description:
            'چارٹس کے ساتھ کل دیا گیا، کل لیا گیا، اور آپ کا خالص بیلنس دیکھیں۔'
        },
        {
          term: 'کون کسے ادا کرتا ہے',
          description:
            'تمام قرض کے شراکت داروں کے درمیان سادہ تصفیے کو ظاہر کرنے والا جدول۔'
        },
        {
          term: 'فلٹر',
          description:
            'کسی مخصوص مدت کے قرضے دیکھنے کے لیے مہینے کے حساب سے فلٹر کریں۔'
        },
        {
          term: 'ڈاؤن لوڈ',
          description: 'قرض کے ریکارڈز کو PDF یا Excel میں ایکسپورٹ کریں۔'
        },
        {
          term: 'دو فریقی طریقہ کار',
          description:
            'اگر گروپ میں دو سے زیادہ اراکین ہوں تو ایپ ایک انتباہ دکھاتی ہے کیونکہ مشترکہ قرضے دو فریقی گروپس کے لیے بہترین کام کرتے ہیں۔'
        }
      ]
    },
    {
      name: 'personal-loans',
      title: 'ذاتی قرضے',
      items: [
        {
          term: 'یہ کیا ہے',
          description:
            'کسی بھی دو افراد کے درمیان، کسی گروپ سے باہر، ون آن ون قرضے ریکارڈ کریں۔'
        },
        {
          term: 'قرض شامل کریں',
          description:
            'دینے والے کا نام اور موبائل، وصول کنندہ کا نام اور موبائل، رقم، تاریخ، اور اختیاری نوٹ درج کریں۔'
        },
        {
          term: 'صارفین سے منتخب کریں',
          description:
            'رجسٹرڈ صارف منتخب کرنے کے لیے ڈراپ ڈاؤن استعمال کریں؛ ان کا نام اور چھپا ہوا موبائل خودکار طور پر بھر جاتا ہے۔'
        },
        {
          term: 'میں؟ چیک باکس',
          description:
            'دینے والے یا وصول کنندہ کے طور پر اپنی تفصیلات جلدی سے بھریں۔'
        },
        {
          term: 'مہینے کے حساب سے فلٹر',
          description: 'کسی مخصوص مہینے یا تمام مہینوں کے قرضے دیکھیں۔'
        },
        {
          term: 'دینے والے کے حساب سے فلٹر',
          description: 'صرف کسی مخصوص شخص کے قرضے دکھائیں۔'
        },
        {
          term: 'قرض کا خلاصہ',
          description:
            'ڈونٹ اور بار چارٹس کے ساتھ آپ کا دیا گیا کل، لیا گیا کل، اور مجموعی بیلنس۔'
        },
        {
          term: 'کون کسے ادا کرتا ہے',
          description: 'تمام ذاتی قرضوں کے لیے سادہ تصفیہ جدول۔'
        },
        { term: 'ڈاؤن لوڈ', description: 'PDF یا Excel میں ایکسپورٹ کریں۔' }
      ]
    },
    {
      name: 'settlement',
      title: 'تصفیہ',
      items: [
        {
          term: 'یہ کیا ہے',
          description:
            'اخراجات ریکارڈ ہونے کے بعد، خرچے فائی تمام بیلنس طے کرنے کے لیے کم از کم ادائیگیوں کا حساب لگاتا ہے۔'
        },
        {
          term: 'تصفیے کی درخواست',
          description:
            'کوئی بھی رکن منتخب مہینے کے لیے تصفیے کی درخواست دے سکتا ہے۔ تمام اراکین کو منظوری کے لیے اطلاع ملتی ہے۔'
        },
        {
          term: 'منظور / مسترد',
          description:
            'ہر رکن تصفیے کی درخواست کا جائزہ لیتا ہے اور اسے منظور یا مسترد کرتا ہے۔'
        },
        {
          term: 'حتمی شکل دیں',
          description:
            'جب تمام اراکین منظور کر لیں تو گروپ ایڈمن تصفیے کو حتمی شکل دے سکتا ہے۔ ادائیگیاں خودکار طور پر ریکارڈ ہو جاتی ہیں۔'
        }
      ]
    },
    {
      name: 'users',
      title: 'صارفین',
      items: [
        {
          term: 'صارفین دیکھیں',
          description:
            'تمام رجسٹرڈ صارفین دیکھیں۔ رازداری کے لیے موبائل نمبرز چھپائے جاتے ہیں۔'
        },
        {
          term: 'تلاش',
          description: 'نام، موبائل، یا گروپ کے نام سے تلاش کریں۔'
        },
        {
          term: 'ترتیب',
          description: 'صارفین کو حروفِ تہجی کے مطابق A–Z یا Z–A ترتیب دیں۔'
        },
        {
          term: 'صرف مشترکہ گروپس',
          description:
            'صرف ان صارفین کو دکھانے کے لیے فلٹر کریں جو آپ کے ساتھ گروپ میں ہیں۔'
        },
        {
          term: 'صارف کے گروپس',
          description: 'ہر صارف کارڈ دکھاتا ہے کہ وہ کن گروپس میں ہے۔'
        }
      ]
    },
    {
      name: 'net-position',
      title: 'اخراجات کا خلاصہ',
      items: [
        {
          term: 'کھولیں',
          description:
            'اوپر ہیڈر بار میں "اخراجات کا خلاصہ" پر کلک کریں (یا موبائل پر مینو)۔'
        },
        {
          term: 'یہ کیا دکھاتا ہے',
          description:
            'آپ کی مکمل مالی تصویر: مشترکہ اخراجات، مشترکہ قرضوں، اور ذاتی قرضوں میں آپ کو کتنا ملنا ہے بمقابلہ کتنا دینا ہے۔'
        },
        {
          term: 'خالص پوزیشن',
          description:
            'ایک ہی نمبر جو آپ کا مجموعی بیلنس دکھاتا ہے۔ مثبت کا مطلب ہے دوسرے آپ کو ادا کریں گے؛ منفی کا مطلب ہے آپ دوسروں کو ادا کریں گے۔'
        },
        {
          term: 'چارٹس',
          description:
            'مجموعی تقسیم کے لیے ڈونٹ چارٹ اور فی زمرہ تفصیل کے لیے بار چارٹ۔'
        },
        {
          term: 'PDF ڈاؤن لوڈ کریں',
          description: 'چارٹس سمیت مکمل خلاصہ PDF کے طور پر محفوظ کریں۔'
        }
      ]
    },
    {
      name: 'salary',
      title: 'ماہانہ تنخواہ منیجر',
      items: [
        {
          term: 'یہ کیا ہے',
          description: 'گروپ اخراجات سے علیحدہ ایک ذاتی مالیاتی ٹول۔'
        },
        {
          term: 'تنخواہ شامل کریں',
          description: 'کسی بھی مہینے کے لیے اپنی ماہانہ تنخواہ درج کریں۔'
        },
        {
          term: 'ذاتی اخراجات شامل کریں',
          description: 'اس مہینے کے لیے اپنے اخراجات ریکارڈ کریں۔'
        },
        {
          term: 'بیلنس',
          description: 'ہر مہینے اخراجات کے بعد اپنی خالص آمدنی دیکھیں۔'
        },
        {
          term: 'ڈاؤن لوڈ',
          description: 'اپنی تنخواہ اور اخراجات کے ریکارڈز ایکسپورٹ کریں۔'
        }
      ]
    },
    {
      name: 'notifications',
      title: 'اطلاعات',
      items: [
        {
          term: 'گھنٹی کا آئیکن',
          description:
            'اوپر ہیڈر میں گھنٹی زیرِ التوا اقدامات کی تعداد دکھاتی ہے جن پر آپ کی توجہ درکار ہے۔'
        },
        {
          term: 'اطلاعات کی اقسام',
          description:
            'زیرِ التوا خرچ ترمیم/حذف کی منظوریاں، قرض کی منظوریاں، گروپ رکنیت کی درخواستیں، اور تصفیے کی درخواستیں۔'
        },
        {
          term: 'جانے کے لیے کلک کریں',
          description:
            'متعلقہ سیکشن پر براہِ راست جانے کے لیے کسی بھی اطلاع پر ٹیپ کریں۔'
        },
        {
          term: 'صفحے کے اندر انتباہات',
          description:
            'کچھ صفحات اوپر زیرِ التوا درخواستیں بھی دکھاتے ہیں تاکہ آپ فوری طور پر منظور یا مسترد کر سکیں۔'
        }
      ]
    },
    {
      name: 'charts',
      title: 'چارٹس اور بصری تصاویر',
      items: [
        {
          term: 'ڈونٹ چارٹس',
          description:
            'تناسب دکھاتے ہیں، مثلاً کس نے کتنا حصہ ادا کیا، یا دیا بمقابلہ لیا۔'
        },
        {
          term: 'بار چارٹس',
          description:
            'رقوم کا شانہ بشانہ موازنہ کرتے ہیں، مثلاً ہر شخص نے کتنا ادا کیا یا واجب ہے۔'
        },
        {
          term: 'کہاں ملیں گے',
          description:
            'مشترکہ اخراجات کے اخراجات خلاصہ حصے میں، ذاتی اور مشترکہ قرضوں کے قرض خلاصہ حصے میں، اور اخراجات کا خلاصہ ڈائیلاگ میں۔'
        },
        {
          term: 'خودکار اپڈیٹ',
          description:
            'فلٹرز تبدیل کرنے پر چارٹس خودکار طور پر اپڈیٹ ہو جاتے ہیں۔'
        }
      ]
    },
    {
      name: 'export',
      title: 'ڈیٹا ایکسپورٹ کرنا',
      items: [
        {
          term: 'PDF ڈاؤن لوڈ کریں',
          description:
            'پورے صفحے (خلاصہ کارڈز اور چارٹس سمیت) کو خرچے فائی برانڈنگ اور صفحہ نمبروں کے ساتھ فارمیٹڈ PDF کے طور پر محفوظ کرتا ہے۔'
        },
        {
          term: 'Excel ڈاؤن لوڈ کریں',
          description:
            'تمام نظر آنے والی قطاروں کو کسی بھی اسپریڈشیٹ ایپ میں استعمال کے لیے اسپریڈشیٹ (.xlsx) کے طور پر ایکسپورٹ کرتا ہے۔'
        },
        {
          term: 'دستیاب ہے',
          description:
            'مشترکہ اخراجات کی فہرست، مشترکہ قرضوں کی فہرست، ذاتی قرضوں کی فہرست، اور اخراجات کا خلاصہ ڈائیلاگ میں۔'
        },
        {
          term: 'رپورٹ کا مہینہ',
          description:
            'ڈاؤن لوڈ شدہ فائل کے نام میں آسان فائلنگ کے لیے موجودہ مہینہ شامل ہوتا ہے۔'
        }
      ]
    },
    {
      name: 'theme',
      title: 'تھیم اور ظاہری شکل',
      items: [
        {
          term: 'ٹوگل',
          description:
            'لائٹ اور ڈارک موڈ کے درمیان تبدیل کرنے کے لیے ہیڈر میں سورج/چاند آئیکن پر کلک کریں۔'
        },
        {
          term: 'برقرار رہتا ہے',
          description:
            'آپ کی تھیم ترجیح محفوظ ہو جاتی ہے اور ہر بار ایپ کھولنے پر خودکار طور پر بحال ہو جاتی ہے۔'
        },
        {
          term: 'موبائل',
          description:
            'موبائل پر، تھیم ٹوگل اوپر دائیں طرف ہیمبرگر مینو کے اندر ہوتا ہے۔'
        },
        {
          term: 'مدد تک رسائی',
          description:
            'مہمان `/help` پر عوامی مدد صفحہ پڑھ سکتے ہیں، اور لاگ ان صارفین ہیڈر سے مدد ڈائیلاگ بھی کھول سکتے ہیں۔'
        }
      ]
    }
  ]
}
