export const SECTION_NAMES = [
  'start',
  'new-features',
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
  ur: 'خرچے فائی دوستوں، گھر والوں، اور گروپس کے ساتھ خرچ، قرضے، بل تقسیم، اور سیٹلمنٹ کا حساب آسان رکھتا ہے۔ یہاں دیکھیں آپ ایپ میں کیا کیا کر سکتے ہیں:'
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
          description:
            'Use your email and password, or continue with Google if your account uses Google sign-in.'
        },
        {
          term: 'Google Sign-in',
          description:
            'New Google users complete mobile number once. Existing users keep their saved account details.'
        },
        {
          term: 'Choose Your Tabs',
          description:
            'After account setup, select only the tabs you want: shared features, personal features, and optional email notifications.'
        },
        {
          term: 'Remember Me',
          description:
            'Optionally keep your email pre-filled and stay signed in longer on this device.'
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
      name: 'new-features',
      title: 'New & Useful Features',
      items: [
        {
          term: 'Configurable Tabs',
          description:
            'Turn shared expenses, shared loans, personal expenses, personal loans, users, and email notifications on or off based on what you actually use.'
        },
        {
          term: 'Approval Workflow',
          description:
            'Group-sensitive changes such as member changes, expense edits/deletes, loan changes, and settlements wait for participant approval before they update records.'
        },
        {
          term: 'Complete Approved Requests',
          description:
            'When every required participant approves, the requester can finish the request and the approved change is applied.'
        },
        {
          term: 'Refresh & Shared Links',
          description:
            'Shared expense and loan links remember the selected group, so refreshing or sharing a link returns to the same screen after the app reloads.'
        },
        {
          term: 'Receipts & Attachments',
          description:
            'Attach receipts to supported expense and loan records, then preview or include them in detailed reports where available.'
        },
        {
          term: 'Duplicate Records',
          description:
            'Use Duplicate on personal expenses to quickly copy a similar transaction and adjust only the fields that changed.'
        },
        {
          term: 'Detailed Reports',
          description:
            'PDF and Excel exports include useful summaries plus detailed rows for personal expenses, shared expenses, shared loans, and personal loans.'
        },
        {
          term: 'Share Links',
          description:
            'Use the share action on supported pages to send the current page to another participant.'
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
          term: 'Shared Groups',
          description:
            'Use Shared Groups to review groups you belong to and jump back into the right shared expense or loan flow.'
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
          term: 'Duplicate / Reuse Details',
          description:
            'When available, duplicate similar records to avoid retyping payer, split, category, and note details.'
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
            'Expandable accordion showing totals, who paid what, and visual charts. It can calculate in the background so the main page remains usable.'
        },
        {
          term: 'Settlement',
          description:
            'Shows who needs to pay whom to settle the current expenses. See the Settlement section below.'
        },
        {
          term: 'Download',
          description:
            'Export to PDF or Excel from any expense list. Reports include summaries, detailed records, dates, people, notes, and receipts where available.'
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
          description:
            'Export loan records to PDF or Excel with loan summary, who-pays-whom details, participants, dates, and notes.'
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
          term: 'Categories & Notes',
          description:
            'Classify personal loans by category and add descriptions so the report stays understandable later.'
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
        {
          term: 'Download',
          description:
            'Export to PDF or Excel with a loan summary, who-pays-whom table, full loan records, participant names, masked mobiles, dates, and descriptions.'
        }
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
        },
        {
          term: 'Pending Status',
          description:
            'Pending banners and bell notifications stay visible until the request is completed or rejected, so everyone can see what still needs action.'
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
        },
        {
          term: 'Background Calculation',
          description:
            'The summary can calculate without blocking your current page, then opens the result when it is ready.'
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
          term: 'Categories, Location, Recipient',
          description:
            'Track category, date, description, location, and recipient so your personal expense report is easier to audit.'
        },
        {
          term: 'Duplicate Expense',
          description:
            'Duplicate a personal expense when you repeat a similar transaction and only need to change the amount, date, or note.'
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
          term: 'Approval Progress',
          description:
            'Approval notifications show who has approved and keep the request visible until it is completed or dismissed.'
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
            'Creates a formatted report with Kharchafy branding, summary sections, detailed records, readable dates, participant names, and page numbers.'
        },
        {
          term: 'Download Excel',
          description:
            'Exports all visible rows as a spreadsheet (.xlsx) for use in any spreadsheet app.'
        },
        {
          term: 'Available on',
          description:
            'Shared Expenses list, Shared Loans list, Personal Expenses list, Personal Loans list, and the Expenses Summary dialog.'
        },
        {
          term: 'Report Detail',
          description:
            'Personal expense and personal loan PDFs include summary tables plus complete record details such as amount, category, date, description, people, and receipts when present.'
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
        },
        {
          term: 'Language',
          description:
            'The app supports English and Urdu and keeps your selected language while you move around the app.'
        }
      ]
    }
  ],
  ur: [
    {
      name: 'start',
      title: 'شروع کیسے کریں',
      items: [
        {
          term: 'رجسٹریشن',
          description:
            'اپنا نام، موبائل نمبر، ای میل، اور پاس ورڈ دے کر اکاؤنٹ بنائیں۔'
        },
        {
          term: 'ای میل کی تصدیق',
          description:
            'اپنے ان باکس میں تصدیقی لنک چیک کریں۔ لاگ ان سے پہلے ای میل کی تصدیق ضروری ہے۔'
        },
        {
          term: 'لاگ ان',
          description:
            'اپنی ای میل اور پاس ورڈ سے لاگ ان کریں، یا Google والا اکاؤنٹ ہے تو Google سے جاری رکھیں۔'
        },
        {
          term: 'Google سائن اِن',
          description:
            'نئے Google یوزرز موبائل نمبر صرف ایک بار دیتے ہیں۔ پرانے یوزرز کی محفوظ معلومات ویسی ہی رہتی ہیں۔'
        },
        {
          term: 'اپنے ٹیبز منتخب کریں',
          description:
            'سیٹ اپ کے بعد صرف وہ ٹیبز آن رکھیں جو آپ واقعی استعمال کرتے ہیں، جیسے گروپ خرچ، ذاتی خرچ، قرضے، یوزرز، یا ای میل نوٹیفکیشن۔'
        },
        {
          term: 'مجھے یاد رکھیں',
          description:
            'چاہیں تو اس ڈیوائس پر ای میل پہلے سے بھری رہے گی اور آپ زیادہ دیر تک لاگ اِن رہ سکیں گے۔'
        },
        {
          term: 'پاس ورڈ بھول گئے',
          description:
            'پاس ورڈ ری سیٹ کرنے کے لیے لاگ ان اسکرین پر "پاس ورڈ بھول گئے" لنک استعمال کریں۔'
        },
        {
          term: 'سیشن ٹائم آؤٹ',
          description:
            'کافی دیر ایپ استعمال نہ کریں تو سیشن خود لاگ آؤٹ ہو جاتا ہے اور وجہ کا پیغام دکھاتا ہے۔'
        }
      ]
    },
    {
      name: 'new-features',
      title: 'نئے اور کام کے فیچرز',
      items: [
        {
          term: 'اپنی مرضی کے ٹیبز',
          description:
            'گروپ خرچ، مشترکہ قرضے، ذاتی خرچ، ذاتی قرضے، یوزرز، اور ای میل نوٹیفکیشن اپنی ضرورت کے مطابق آن یا آف کریں۔'
        },
        {
          term: 'منظوری والا فلو',
          description:
            'ممبر بدلنا، خرچ ایڈٹ یا ڈیلیٹ کرنا، قرض بدلنا، یا سیٹلمنٹ کرنا پہلے متعلقہ لوگوں کی منظوری لیتا ہے، پھر حساب بدلتا ہے۔'
        },
        {
          term: 'منظور شدہ درخواست مکمل کریں',
          description:
            'جب سب ضروری لوگ منظوری دے دیں تو درخواست بنانے والا اسے مکمل کر سکتا ہے، پھر تبدیلی لاگو ہو جاتی ہے۔'
        },
        {
          term: 'ریفریش اور شیئر لنکس',
          description:
            'گروپ خرچ اور قرض کے لنکس منتخب گروپ یاد رکھتے ہیں، اس لیے ریفریش یا شیئر کیا ہوا لنک ایپ کو دوبارہ اسی اسکرین پر لے آتا ہے۔'
        },
        {
          term: 'رسیدیں اور اٹیچمنٹ',
          description:
            'جہاں سہولت ہو وہاں خرچ یا قرض کے ساتھ رسید لگا دیں، پھر اسے دیکھیں یا رپورٹ میں شامل رکھیں۔'
        },
        {
          term: 'ریکارڈ کاپی کریں',
          description:
            'ذاتی خرچ میں ڈپلیکیٹ استعمال کر کے ملتا جلتا خرچ کاپی کریں اور صرف بدلی ہوئی چیزیں درست کریں۔'
        },
        {
          term: 'تفصیلی رپورٹس',
          description:
            'PDF اور Excel رپورٹس میں ذاتی خرچ، گروپ خرچ، مشترکہ قرضے، اور ذاتی قرضوں کا خلاصہ بھی آتا ہے اور مکمل ریکارڈ بھی۔'
        },
        {
          term: 'لنکس شیئر کریں',
          description:
            'جہاں شیئر کا آپشن ہو وہاں موجودہ صفحے کا لنک دوسرے شریک کو بھیج سکتے ہیں۔'
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
            'گروپس ٹیب پر جائیں، "گروپ بنائیں" پر کلک کریں، نام دیں، اور کم از کم ایک ممبر شامل کریں۔'
        },
        {
          term: 'فعال گروپ منتخب کریں',
          description:
            'جس گروپ پر کام کرنا ہو اس پر "منتخب کریں" دبائیں۔ گروپ خرچ اور قرضے اسی گروپ کے حساب سے چلیں گے۔'
        },
        {
          term: 'ممبرز شامل کریں',
          description:
            'نام یا موبائل سے رجسٹرڈ یوزرز تلاش کریں اور گروپ میں شامل ہونے کی درخواست بھیجیں۔ موجودہ ممبرز کی منظوری ضروری ہے۔'
        },
        {
          term: 'ممبرز ہٹائیں',
          description:
            'کوئی بھی ممبر ہٹانے کی درخواست دے سکتا ہے؛ باقی ممبرز کی منظوری چاہیے ہوگی۔'
        },
        {
          term: 'زیر التوا دعوتیں',
          description:
            'اگر کسی نے آپ کو گروپ میں شامل کیا ہے تو آپ کو قبول یا مسترد کرنے کی دعوت نظر آئے گی۔'
        },
        {
          term: 'مشترکہ گروپس',
          description:
            'شیئرڈ گروپس میں اپنے تمام گروپس دیکھیں اور فوراً صحیح خرچ یا قرض والے صفحے پر جائیں۔'
        },
        {
          term: 'گروپ ایڈٹ / ڈیلیٹ کریں',
          description:
            'صرف گروپ مالک نام بدل سکتا ہے یا گروپ ڈیلیٹ کر سکتا ہے۔ ڈیلیٹ کرنے کے لیے سب ممبرز کی منظوری چاہیے۔'
        },
        {
          term: 'فلٹر اور ترتیب',
          description:
            'گروپس کو A-Z یا Z-A ترتیب دیں، یا کسی ممبر کے حساب سے فلٹر کریں۔'
        }
      ]
    },
    {
      name: 'expenses',
      title: 'گروپ اخراجات',
      items: [
        {
          term: 'خرچ شامل کریں',
          description:
            '"+" بٹن دبائیں۔ تفصیل، رقم، تاریخ لکھیں، پھر منتخب کریں کس نے پیسے دیے اور خرچ کیسے تقسیم ہوگا۔'
        },
        {
          term: 'ایک ادائیگی کرنے والا',
          description: 'ایک شخص نے پوری رقم ادا کی۔'
        },
        {
          term: 'ایک سے زیادہ ادائیگی کرنے والے',
          description: 'ایک سے زیادہ لوگوں نے رقم کے مختلف حصے ادا کیے۔'
        },
        {
          term: 'برابر تقسیم',
          description: 'کل رقم سب ممبرز میں برابر تقسیم ہو جاتی ہے۔'
        },
        {
          term: 'اپنی مرضی کی تقسیم',
          description: 'ہر ممبر کے ذمے اصل رقم خود مقرر کریں۔'
        },
        {
          term: 'رسید لگائیں',
          description:
            'رسید کی تصویر اپ لوڈ کریں (JPG، PNG، زیادہ سے زیادہ 1 MB)۔'
        },
        {
          term: 'تفصیل کاپی کریں',
          description:
            'جہاں آپشن موجود ہو، ملتا جلتا ریکارڈ ڈپلیکیٹ کریں تاکہ ادائیگی کرنے والا، تقسیم، کیٹیگری، اور نوٹ دوبارہ لکھنا نہ پڑے۔'
        },
        {
          term: 'ایڈٹ / ڈیلیٹ',
          description:
            'ایڈٹ یا ڈیلیٹ کی درخواست بنتی ہے۔ تبدیلی لاگو ہونے سے پہلے گروپ ممبرز کی منظوری چاہیے ہوتی ہے۔'
        },
        {
          term: 'فلٹرز',
          description:
            'فہرست کو مہینے، ادائیگی کرنے والے، ادائیگی کے طریقے، یا تقسیم کے طریقے کے حساب سے فلٹر کریں۔'
        },
        {
          term: 'اخراجات کا خلاصہ',
          description:
            'یہ حصہ کل رقم، کس نے کیا ادا کیا، اور چارٹس دکھاتا ہے۔ حساب پس منظر میں بھی چل سکتا ہے تاکہ مرکزی صفحہ قابل استعمال رہے۔'
        },
        {
          term: 'سیٹلمنٹ',
          description:
            'دکھاتا ہے کہ حساب برابر کرنے کے لیے کس نے کس کو کتنے پیسے دینے ہیں۔ نیچے سیٹلمنٹ والا حصہ دیکھیں۔'
        },
        {
          term: 'ڈاؤن لوڈ',
          description:
            'کسی بھی خرچ کی فہرست سے PDF یا Excel رپورٹ نکالیں۔ رپورٹ میں خلاصہ، مکمل ریکارڈ، تاریخیں، لوگ، نوٹس، اور جہاں موجود ہوں رسیدیں شامل ہوتی ہیں۔'
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
            'گروپ ممبرز کے درمیان قرض ریکارڈ کریں: کس نے دیا، کس نے لیا، رقم، اور تاریخ۔'
        },
        {
          term: 'میں؟ چیک باکس',
          description:
            'اپنی تفصیل لکھے بغیر فوراً خود کو دینے والا یا لینے والا منتخب کریں۔'
        },
        {
          term: 'یوزرز سے منتخب کریں',
          description:
            'رجسٹرڈ یوزرز کی فہرست سے دینے والا یا لینے والا خود بھرنے کے لیے ڈراپ ڈاؤن استعمال کریں۔'
        },
        {
          term: 'قرض کا خلاصہ',
          description:
            'چارٹس کے ساتھ کل دیا ہوا، کل لیا ہوا، اور اپنا نیٹ بیلنس دیکھیں۔'
        },
        {
          term: 'کس نے کس کو دینا ہے',
          description:
            'قرض میں شامل لوگوں کے درمیان آسان سیٹلمنٹ جدول دکھاتا ہے۔'
        },
        {
          term: 'فلٹر',
          description:
            'کسی خاص مہینے کے قرضے دیکھنے کے لیے مہینے کا فلٹر استعمال کریں۔'
        },
        {
          term: 'ڈاؤن لوڈ',
          description:
            'قرض ریکارڈز کو PDF یا Excel میں خلاصے، سیٹلمنٹ جدول، لوگ، تاریخیں، اور نوٹس کے ساتھ ڈاؤن لوڈ کریں۔'
        },
        {
          term: 'دو لوگوں والا حساب',
          description:
            'اگر گروپ میں دو سے زیادہ ممبرز ہوں تو ایپ تنبیہ دکھاتی ہے، کیونکہ مشترکہ قرضے دو لوگوں والے حساب میں زیادہ صاف رہتے ہیں۔'
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
            'کسی گروپ سے الگ، دو لوگوں کے درمیان ذاتی قرض ریکارڈ کریں۔'
        },
        {
          term: 'قرض شامل کریں',
          description:
            'دینے والے کا نام اور موبائل، لینے والے کا نام اور موبائل، رقم، تاریخ، اور اختیاری نوٹ لکھیں۔'
        },
        {
          term: 'کیٹیگریز اور نوٹس',
          description:
            'ذاتی قرضوں کو کیٹیگری کے حساب سے رکھیں اور تفصیل لکھ دیں تاکہ بعد میں رپورٹ سمجھنا آسان رہے۔'
        },
        {
          term: 'یوزرز سے منتخب کریں',
          description:
            'رجسٹرڈ یوزر منتخب کرنے کے لیے ڈراپ ڈاؤن استعمال کریں؛ نام اور چھپا ہوا موبائل خود بھر جاتا ہے۔'
        },
        {
          term: 'میں؟ چیک باکس',
          description:
            'دینے والے یا لینے والے کے طور پر اپنی تفصیل فوراً بھر دیں۔'
        },
        {
          term: 'مہینے کے حساب سے فلٹر',
          description: 'کسی مخصوص مہینے یا تمام مہینوں کے قرضے دیکھیں۔'
        },
        {
          term: 'دینے والے کے حساب سے فلٹر',
          description: 'صرف کسی خاص شخص کے قرضے دکھائیں۔'
        },
        {
          term: 'قرض کا خلاصہ',
          description:
            'ڈونٹ اور بار چارٹس کے ساتھ کل دیا ہوا، کل لیا ہوا، اور مجموعی بیلنس دیکھیں۔'
        },
        {
          term: 'کس نے کس کو دینا ہے',
          description: 'تمام ذاتی قرضوں کے لیے آسان سیٹلمنٹ جدول۔'
        },
        {
          term: 'ڈاؤن لوڈ',
          description:
            'قرض کا خلاصہ، سیٹلمنٹ جدول، مکمل قرض ریکارڈ، لوگوں کے نام، چھپا ہوا موبائل، تاریخیں، اور تفصیلات کے ساتھ PDF یا Excel رپورٹ نکالیں۔'
        }
      ]
    },
    {
      name: 'settlement',
      title: 'سیٹلمنٹ',
      items: [
        {
          term: 'یہ کیا ہے',
          description:
            'خرچے ریکارڈ ہونے کے بعد خرچے فائی حساب لگاتا ہے کہ کم سے کم ادائیگیوں سے سب کا بیلنس کیسے صاف ہوگا۔'
        },
        {
          term: 'سیٹلمنٹ درخواست',
          description:
            'کوئی بھی ممبر منتخب مہینے کے لیے سیٹلمنٹ درخواست دے سکتا ہے۔ باقی ممبرز کو منظوری کے لیے نوٹیفکیشن ملتی ہے۔'
        },
        {
          term: 'منظور / مسترد',
          description: 'ہر ممبر درخواست دیکھ کر اسے منظور یا مسترد کر سکتا ہے۔'
        },
        {
          term: 'مکمل کریں',
          description:
            'جب سب منظوری دے دیں تو گروپ ایڈمن سیٹلمنٹ مکمل کر سکتا ہے۔ ادائیگیاں خود ریکارڈ ہو جاتی ہیں۔'
        },
        {
          term: 'زیر التوا حالت',
          description:
            'زیر التوا بینرز اور گھنٹی کی نوٹیفکیشن تب تک نظر آتی ہیں جب تک درخواست مکمل یا مسترد نہ ہو، تاکہ سب کو پتا رہے کیا باقی ہے۔'
        }
      ]
    },
    {
      name: 'users',
      title: 'یوزرز',
      items: [
        {
          term: 'یوزرز دیکھیں',
          description:
            'تمام رجسٹرڈ یوزرز دیکھیں۔ پرائیویسی کے لیے موبائل نمبرز چھپائے جاتے ہیں۔'
        },
        {
          term: 'تلاش',
          description: 'نام، موبائل، یا گروپ کے نام سے تلاش کریں۔'
        },
        {
          term: 'ترتیب',
          description: 'یوزرز کو A-Z یا Z-A ترتیب دیں۔'
        },
        {
          term: 'صرف مشترکہ گروپس',
          description:
            'صرف وہ یوزرز دکھانے کے لیے فلٹر کریں جو آپ کے ساتھ کسی گروپ میں ہیں۔'
        },
        {
          term: 'یوزر کے گروپس',
          description: 'ہر یوزر کارڈ دکھاتا ہے کہ وہ کن گروپس میں شامل ہے۔'
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
            'اوپر ہیڈر میں "اخراجات کا خلاصہ" پر کلک کریں، یا موبائل پر مینو سے کھولیں۔'
        },
        {
          term: 'یہ کیا دکھاتا ہے',
          description:
            'یہ آپ کا مجموعی حساب دکھاتا ہے: گروپ خرچ، مشترکہ قرضے، اور ذاتی قرضوں میں آپ کو کتنا لینا ہے اور کتنا دینا ہے۔'
        },
        {
          term: 'نیٹ پوزیشن',
          description:
            'ایک نمبر میں مجموعی بیلنس دکھتا ہے۔ مثبت ہو تو لوگوں نے آپ کو دینا ہے، منفی ہو تو آپ نے لوگوں کو دینا ہے۔'
        },
        {
          term: 'چارٹس',
          description:
            'مجموعی تقسیم کے لیے ڈونٹ چارٹ اور کیٹیگری کے حساب سے تفصیل کے لیے بار چارٹ۔'
        },
        {
          term: 'PDF ڈاؤن لوڈ کریں',
          description: 'چارٹس سمیت مکمل خلاصہ PDF کے طور پر محفوظ کریں۔'
        },
        {
          term: 'پس منظر میں حساب',
          description:
            'خلاصہ آپ کا موجودہ صفحہ روکے بغیر تیار ہو سکتا ہے، پھر تیار ہونے پر نتیجہ کھل جاتا ہے۔'
        }
      ]
    },
    {
      name: 'salary',
      title: 'ماہانہ تنخواہ اور بجٹ',
      items: [
        {
          term: 'یہ کیا ہے',
          description: 'گروپ خرچ سے الگ آپ کا ذاتی بجٹ ٹول۔'
        },
        {
          term: 'تنخواہ شامل کریں',
          description: 'کسی بھی مہینے کے لیے اپنی ماہانہ تنخواہ لکھیں۔'
        },
        {
          term: 'ذاتی اخراجات شامل کریں',
          description: 'اس مہینے کے اپنے ذاتی اخراجات ریکارڈ کریں۔'
        },
        {
          term: 'کیٹیگری، جگہ، کس کو دیا',
          description:
            'کیٹیگری، تاریخ، تفصیل، جگہ، اور جسے پیسے دیے وہ محفوظ کریں تاکہ رپورٹ بعد میں آسانی سے سمجھ آئے۔'
        },
        {
          term: 'خرچ ڈپلیکیٹ کریں',
          description:
            'ملتا جلتا خرچ دوبارہ آئے تو اسے ڈپلیکیٹ کریں اور صرف رقم، تاریخ، یا نوٹ بدل دیں۔'
        },
        {
          term: 'بیلنس',
          description: 'ہر مہینے خرچ کے بعد اپنی باقی رقم دیکھیں۔'
        },
        {
          term: 'ڈاؤن لوڈ',
          description: 'اپنی تنخواہ اور اخراجات کا ریکارڈ ڈاؤن لوڈ کریں۔'
        }
      ]
    },
    {
      name: 'notifications',
      title: 'نوٹیفکیشن',
      items: [
        {
          term: 'گھنٹی کا آئیکن',
          description:
            'اوپر ہیڈر میں گھنٹی کا آئیکن بتاتا ہے کہ کتنے زیر التوا کام آپ کی توجہ چاہتے ہیں۔'
        },
        {
          term: 'نوٹیفکیشن کی اقسام',
          description:
            'زیر التوا خرچ ایڈٹ/ڈیلیٹ منظوری، قرض کی منظوری، گروپ ممبرشپ درخواستیں، اور سیٹلمنٹ درخواستیں۔'
        },
        {
          term: 'منظوری کی پیش رفت',
          description:
            'منظوری کی نوٹیفکیشن بتاتی ہے کس نے منظوری دی ہے، اور درخواست مکمل یا مسترد ہونے تک نظر آتی رہتی ہے۔'
        },
        {
          term: 'کھولنے کے لیے ٹیپ کریں',
          description:
            'متعلقہ حصے پر سیدھا جانے کے لیے کسی بھی نوٹیفکیشن پر ٹیپ کریں۔'
        },
        {
          term: 'صفحے کے الرٹس',
          description:
            'کچھ صفحات اوپر زیر التوا درخواستیں بھی دکھاتے ہیں تاکہ آپ فوراً منظور یا مسترد کر سکیں۔'
        }
      ]
    },
    {
      name: 'charts',
      title: 'چارٹس',
      items: [
        {
          term: 'ڈونٹ چارٹس',
          description:
            'تناسب دکھاتے ہیں، جیسے کس نے کتنا حصہ ادا کیا یا کتنا دیا بمقابلہ کتنا لیا۔'
        },
        {
          term: 'بار چارٹس',
          description:
            'رقم کا ساتھ ساتھ موازنہ دکھاتے ہیں، جیسے ہر بندے نے کتنا ادا کیا یا کتنا دینا ہے۔'
        },
        {
          term: 'کہاں ملیں گے',
          description:
            'گروپ خرچ کے خلاصے، ذاتی/مشترکہ قرض کے خلاصے، اور Expense Summary ڈائیلاگ میں چارٹس ملیں گے۔'
        },
        {
          term: 'خود اپ ڈیٹ',
          description: 'فلٹرز بدلتے ہی چارٹس خود اپ ڈیٹ ہو جاتے ہیں۔'
        }
      ]
    },
    {
      name: 'export',
      title: 'رپورٹس ڈاؤن لوڈ کرنا',
      items: [
        {
          term: 'PDF ڈاؤن لوڈ کریں',
          description:
            'خرچے فائی برانڈنگ، خلاصہ، مکمل ریکارڈ، پڑھنے والی تاریخیں، لوگوں کے نام، اور صفحہ نمبرز کے ساتھ صاف PDF رپورٹ بناتا ہے۔'
        },
        {
          term: 'Excel ڈاؤن لوڈ کریں',
          description:
            'اسکرین پر نظر آنے والی قطاروں کو سپریڈشیٹ (.xlsx) کے طور پر ڈاؤن لوڈ کریں، جسے Excel یا کسی سپریڈشیٹ ایپ میں کھولا جا سکتا ہے۔'
        },
        {
          term: 'کہاں دستیاب ہے',
          description:
            'گروپ اخراجات، مشترکہ قرضے، ذاتی اخراجات، ذاتی قرضے، اور Expense Summary ڈائیلاگ میں رپورٹس دستیاب ہیں۔'
        },
        {
          term: 'رپورٹ کی تفصیل',
          description:
            'ذاتی اخراجات اور ذاتی قرضوں کی PDFs میں خلاصہ جدول اور مکمل تفصیلات آتی ہیں، جیسے رقم، کیٹیگری، تاریخ، تفصیل، لوگ، اور موجود رسیدیں۔'
        },
        {
          term: 'رپورٹ کا مہینہ',
          description:
            'ڈاؤن لوڈ فائل کے نام میں موجودہ مہینہ شامل ہوتا ہے تاکہ بعد میں فائل ڈھونڈنا آسان ہو۔'
        }
      ]
    },
    {
      name: 'theme',
      title: 'تھیم اور زبان',
      items: [
        {
          term: 'ٹوگل',
          description:
            'لائٹ اور ڈارک موڈ بدلنے کے لیے ہیڈر میں سورج/چاند والا آئیکن دبائیں۔'
        },
        {
          term: 'ترجیح یاد رہتی ہے',
          description:
            'آپ کی تھیم کی ترجیح محفوظ رہتی ہے اور ایپ دوبارہ کھولنے پر خود واپس آ جاتی ہے۔'
        },
        {
          term: 'موبائل',
          description: 'موبائل پر تھیم ٹوگل اوپر مینو کے اندر ہوتا ہے۔'
        },
        {
          term: 'مدد تک رسائی',
          description:
            'مہمان یوزرز `/help` پر مدد کا صفحہ پڑھ سکتے ہیں، اور لاگ اِن یوزرز ہیڈر سے مدد ڈائیلاگ بھی کھول سکتے ہیں۔'
        },
        {
          term: 'زبان',
          description:
            'ایپ English اور Urdu دونوں سپورٹ کرتی ہے اور آپ کی منتخب زبان یاد رکھتی ہے۔'
        }
      ]
    }
  ]
}
