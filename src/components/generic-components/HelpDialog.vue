<template>
  <el-dialog
    v-model="visible"
    title="How to Use Kharchafy"
    :width="isMobile ? '95%' : '680px'"
    :close-on-click-modal="true"
    :close-on-press-escape="true"
    @close="handleClose"
    class="help-dialog"
  >
    <div class="help-content">

      <!-- Intro -->
      <div class="help-intro">
        <p class="help-intro-text">
          Kharchafy helps you track, split, and settle shared expenses and loans with your friends and groups. Here is everything you can do:
        </p>
      </div>

      <el-collapse v-model="openSections" class="help-collapse">

        <!-- Getting Started -->
        <el-collapse-item name="start">
          <template #title>
            <span class="help-section-title">
              <span class="help-icon">1</span> Getting Started
            </span>
          </template>
          <ul class="help-list">
            <li><strong>Register</strong> — Sign up with your name, mobile number, email, and password.</li>
            <li><strong>Verify Email</strong> — Check your inbox for a verification link. You must verify before logging in.</li>
            <li><strong>Login</strong> — Use your email and password to sign in.</li>
            <li><strong>Forgot Password</strong> — Use the "Forgot Password" link on the login screen to get a reset email.</li>
          </ul>
        </el-collapse-item>

        <!-- Groups -->
        <el-collapse-item name="groups">
          <template #title>
            <span class="help-section-title">
              <span class="help-icon">2</span> Groups
            </span>
          </template>
          <ul class="help-list">
            <li><strong>Create a Group</strong> — Go to the Groups tab, click "Create Group", give it a name, and add at least one other member.</li>
            <li><strong>Select Active Group</strong> — Click "Select" on any group to make it active. Shared Expenses and Loans will use this group.</li>
            <li><strong>Add Members</strong> — Search for registered users by name or mobile and send a group join request. All existing members must approve.</li>
            <li><strong>Remove Members</strong> — Any member can request a removal; all remaining members must approve.</li>
            <li><strong>Pending Invitations</strong> — If someone added you to a group, you will see an invitation to accept or decline.</li>
            <li><strong>Edit / Delete Group</strong> — Only the group owner can rename or delete a group. Deletion requires all members to approve.</li>
            <li><strong>Filter &amp; Sort</strong> — Sort groups A–Z or Z–A. Filter groups by a specific member.</li>
          </ul>
        </el-collapse-item>

        <!-- Shared Expenses -->
        <el-collapse-item name="expenses">
          <template #title>
            <span class="help-section-title">
              <span class="help-icon">3</span> Shared Expenses
            </span>
          </template>
          <ul class="help-list">
            <li><strong>Add Expense</strong> — Click the "+" button. Enter description, amount, date, and choose who paid and how to split.</li>
            <li><strong>Single Payer</strong> — One person paid the full amount.</li>
            <li><strong>Multiple Payers</strong> — More than one person paid different portions.</li>
            <li><strong>Equal Split</strong> — The total is divided equally among all members.</li>
            <li><strong>Custom Split</strong> — Assign exact amounts each member owes.</li>
            <li><strong>Attach Receipt</strong> — Upload a photo of the receipt (JPG, PNG, up to 1 MB).</li>
            <li><strong>Edit / Delete</strong> — Requests an edit or delete that all group members must approve before it takes effect.</li>
            <li><strong>Filters</strong> — Filter the list by Month, Payer, Payer Mode (single/multiple), or Split Mode (equal/custom).</li>
            <li><strong>Expense Summary</strong> — Expandable accordion showing totals, who paid what, and visual charts.</li>
            <li><strong>Settlement</strong> — Shows who needs to pay whom to settle the current expenses. See the Settlement section below.</li>
            <li><strong>Download</strong> — Export to PDF or Excel from any expense list.</li>
          </ul>
        </el-collapse-item>

        <!-- Shared Loans -->
        <el-collapse-item name="shared-loans">
          <template #title>
            <span class="help-section-title">
              <span class="help-icon">4</span> Shared Loans
            </span>
          </template>
          <ul class="help-list">
            <li><strong>Add Loan</strong> — Record a loan between group members: who gave, who received, amount, and date.</li>
            <li><strong>ME? Checkbox</strong> — Quickly select yourself as the giver or receiver without typing your details.</li>
            <li><strong>Select from Users</strong> — Use the "Select from Users" dropdown to auto-fill the giver or receiver from the registered users list.</li>
            <li><strong>Loan Summary</strong> — See total lent, total borrowed, and your net balance with charts.</li>
            <li><strong>Who Pays Whom</strong> — A table showing the simplified settlement between all loan participants.</li>
            <li><strong>Filter</strong> — Filter by month to see loans for a specific period.</li>
            <li><strong>Download</strong> — Export loan records to PDF or Excel.</li>
          </ul>
        </el-collapse-item>

        <!-- Personal Loans -->
        <el-collapse-item name="personal-loans">
          <template #title>
            <span class="help-section-title">
              <span class="help-icon">5</span> Personal Loans
            </span>
          </template>
          <ul class="help-list">
            <li><strong>What it is</strong> — Record one-on-one loans between any two people, outside of any group.</li>
            <li><strong>Add Loan</strong> — Enter giver name and mobile, receiver name and mobile, amount, date, and optional note.</li>
            <li><strong>Select from Users</strong> — Use the dropdown to pick a registered user; their name and masked mobile fill in automatically.</li>
            <li><strong>ME? Checkbox</strong> — Quickly fill in your own details as giver or receiver.</li>
            <li><strong>Filter by Month</strong> — View loans for a specific month or all months.</li>
            <li><strong>Filter by Giver</strong> — Show only loans from a specific person.</li>
            <li><strong>Loan Summary</strong> — Total you lent, total you borrowed, overall balance, with donut and bar charts.</li>
            <li><strong>Who Pays Whom</strong> — Simplified settlement table for all personal loans.</li>
            <li><strong>Download</strong> — Export to PDF or Excel.</li>
          </ul>
        </el-collapse-item>

        <!-- Settlement -->
        <el-collapse-item name="settlement">
          <template #title>
            <span class="help-section-title">
              <span class="help-icon">6</span> Settlement
            </span>
          </template>
          <ul class="help-list">
            <li><strong>What it is</strong> — After expenses are recorded, Kharchafy calculates the minimum set of payments to settle all balances.</li>
            <li><strong>Request Settlement</strong> — Any member can request a settlement for a selected month. All members receive a notification to approve.</li>
            <li><strong>Approve / Reject</strong> — Each member reviews and approves or rejects the settlement request.</li>
            <li><strong>Finalize</strong> — Once all members approve, the group admin can finalize the settlement. Payments are recorded automatically.</li>
            <li><strong>Settlement History</strong> — Finalized settlements move to the History tab for reference.</li>
          </ul>
        </el-collapse-item>

        <!-- Users -->
        <el-collapse-item name="users">
          <template #title>
            <span class="help-section-title">
              <span class="help-icon">7</span> Users
            </span>
          </template>
          <ul class="help-list">
            <li><strong>Browse Users</strong> — See all registered users. Mobile numbers are masked for privacy.</li>
            <li><strong>Search</strong> — Search by name, mobile, or group name.</li>
            <li><strong>Sort</strong> — Sort users alphabetically A–Z or Z–A.</li>
            <li><strong>Shared Groups Only</strong> — Filter to show only users who share a group with you.</li>
            <li><strong>User Groups</strong> — Each user card shows which groups they are in.</li>
          </ul>
        </el-collapse-item>

        <!-- Expenses Summary -->
        <el-collapse-item name="net-position">
          <template #title>
            <span class="help-section-title">
              <span class="help-icon">8</span> Expenses Summary
            </span>
          </template>
          <ul class="help-list">
            <li><strong>Open it</strong> — Click "Expenses Summary" in the top header bar (or the menu on mobile).</li>
            <li><strong>What it shows</strong> — Your complete financial picture: how much you will receive vs. how much you will pay, across Shared Expenses, Shared Loans, and Personal Loans.</li>
            <li><strong>Net Position</strong> — A single number showing your overall balance. Positive means others pay you; negative means you pay others.</li>
            <li><strong>Charts</strong> — A donut chart for the overall split and a bar chart for per-category breakdown.</li>
            <li><strong>Download PDF</strong> — Save the full summary including charts as a PDF.</li>
          </ul>
        </el-collapse-item>

        <!-- Salary Manager -->
        <el-collapse-item name="salary">
          <template #title>
            <span class="help-section-title">
              <span class="help-icon">9</span> Monthly Salary Manager
            </span>
          </template>
          <ul class="help-list">
            <li><strong>What it is</strong> — A personal finance tool separate from group expenses.</li>
            <li><strong>Add Salary</strong> — Enter your monthly salary for any month.</li>
            <li><strong>Add Personal Expenses</strong> — Record your own expenses for that month.</li>
            <li><strong>Balance</strong> — See your net income after expenses for each month.</li>
            <li><strong>Download</strong> — Export your salary and expense records.</li>
          </ul>
        </el-collapse-item>

        <!-- Notifications -->
        <el-collapse-item name="notifications">
          <template #title>
            <span class="help-section-title">
              <span class="help-icon">10</span> Notifications
            </span>
          </template>
          <ul class="help-list">
            <li><strong>Bell Icon</strong> — The bell in the top header shows a count of pending actions that need your attention.</li>
            <li><strong>Types of notifications</strong> — Pending expense edit/delete approvals, loan approvals, group member requests, and settlement requests.</li>
            <li><strong>Click to navigate</strong> — Tap any notification to go directly to the relevant section.</li>
            <li><strong>In-page alerts</strong> — Some pages also show pending requests at the top so you can approve or reject inline.</li>
          </ul>
        </el-collapse-item>

        <!-- Charts -->
        <el-collapse-item name="charts">
          <template #title>
            <span class="help-section-title">
              <span class="help-icon">11</span> Charts &amp; Visuals
            </span>
          </template>
          <ul class="help-list">
            <li><strong>Donut Charts</strong> — Show proportions, e.g. who paid what share, or lent vs. borrowed.</li>
            <li><strong>Bar Charts</strong> — Compare amounts side by side, e.g. how much each person paid or owes.</li>
            <li><strong>Where to find them</strong> — Inside the Expense Summary accordion on Shared Expenses, the Loan Summary accordion on Personal Loans and Shared Loans, and in the Expenses Summary dialog.</li>
            <li><strong>Reactive</strong> — Charts update automatically when you change filters.</li>
          </ul>
        </el-collapse-item>

        <!-- Export -->
        <el-collapse-item name="export">
          <template #title>
            <span class="help-section-title">
              <span class="help-icon">12</span> Exporting Data
            </span>
          </template>
          <ul class="help-list">
            <li><strong>Download PDF</strong> — Captures the full page (including summary cards and charts) as a formatted PDF with the Kharchafy branding and page numbers.</li>
            <li><strong>Download Excel</strong> — Exports all visible rows as a spreadsheet (.xlsx) for use in any spreadsheet app.</li>
            <li><strong>Available on</strong> — Shared Expenses list, Shared Loans list, Personal Loans list, and the Expenses Summary dialog.</li>
            <li><strong>Report month</strong> — The downloaded file name includes the current month for easy filing.</li>
          </ul>
        </el-collapse-item>

        <!-- Theme -->
        <el-collapse-item name="theme">
          <template #title>
            <span class="help-section-title">
              <span class="help-icon">13</span> Theme &amp; Appearance
            </span>
          </template>
          <ul class="help-list">
            <li><strong>Toggle</strong> — Click the sun/moon icon in the header to switch between Light and Dark mode.</li>
            <li><strong>Persists</strong> — Your theme preference is saved and restored automatically each time you open the app.</li>
            <li><strong>Mobile</strong> — On mobile, the theme toggle is inside the hamburger menu at the top right.</li>
          </ul>
        </el-collapse-item>

      </el-collapse>
    </div>

    <template #footer>
      <div class="help-footer">
        <div class="help-footer-actions">
          <button class="help-theme-btn" @click="toggleTheme" :title="isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
            <svg v-if="!isDarkTheme" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            {{ isDarkTheme ? 'Light Mode' : 'Dark Mode' }}
          </button>
          <el-button v-if="loggedIn" type="warning" plain size="small" @click="handleLogout">Logout</el-button>
        </div>
        <el-button @click="handleClose">Close</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  loggedIn: { type: Boolean, default: false },
  isDarkTheme: { type: Boolean, default: false },
  toggleTheme: { type: Function, default: () => {} }
})

const emit = defineEmits(['update:modelValue', 'logout'])

const isMobile = ref(window.innerWidth < 768)
window.addEventListener('resize', () => { isMobile.value = window.innerWidth < 768 })

const openSections = ref(['start'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const handleClose = () => { visible.value = false }

const handleLogout = () => {
  visible.value = false
  emit('logout')
}
</script>

<style scoped>
.help-content {
  max-height: 65vh;
  overflow-y: auto;
  padding: 4px 8px;
}

.help-intro {
  background: var(--el-color-primary-light-9, #f0fdf4);
  border-left: 4px solid #22c55e;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.help-intro-text {
  font-size: 14px;
  color: var(--el-text-color-primary);
  margin: 0;
  line-height: 1.6;
}

.help-collapse {
  border: none;
}

:deep(.help-collapse .el-collapse-item__header) {
  font-size: 15px;
  font-weight: 600;
  padding: 0 4px;
  background: transparent;
}

:deep(.help-collapse .el-collapse-item__content) {
  padding: 8px 4px 16px;
}

:deep(.help-collapse .el-collapse-item__wrap) {
  background: transparent;
}

.help-section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--el-text-color-primary);
}

.help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #22c55e;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.help-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.help-list li {
  font-size: 13.5px;
  color: var(--el-text-color-regular);
  line-height: 1.55;
  padding-left: 14px;
  position: relative;
}

.help-list li::before {
  content: '–';
  position: absolute;
  left: 0;
  color: #22c55e;
  font-weight: 700;
}

.help-list li strong {
  color: var(--el-text-color-primary);
}

/* Footer */
.help-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
}

.help-footer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.help-theme-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color);
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.help-theme-btn:hover {
  background: var(--el-fill-color);
}

/* Dark theme */
:root.dark-theme :deep(.help-dialog .el-dialog) {
  background-color: #1f2937;
}

:root.dark-theme :deep(.help-dialog .el-dialog__title) {
  color: #f9fafb;
}

:root.dark-theme :deep(.help-dialog .el-dialog__header) {
  border-bottom-color: #374151;
}

:root.dark-theme :deep(.help-dialog .el-dialog__footer) {
  border-top-color: #374151;
  background-color: #1f2937;
}

:root.dark-theme :deep(.help-dialog .el-dialog__headerbtn .el-dialog__close) {
  color: #9ca3af;
}

:root.dark-theme :deep(.help-collapse .el-collapse-item__header) {
  color: #f3f4f6;
  border-bottom-color: #374151;
}

:root.dark-theme :deep(.help-collapse .el-collapse-item__wrap) {
  border-bottom-color: #374151;
}

:root.dark-theme .help-intro {
  background: rgba(34, 197, 94, 0.1);
}

:root.dark-theme .help-intro-text {
  color: #d1fae5;
}

:root.dark-theme .help-section-title {
  color: #f3f4f6;
}

:root.dark-theme .help-list li {
  color: #d1d5db;
}

:root.dark-theme .help-list li strong {
  color: #f9fafb;
}

:root.dark-theme .help-theme-btn {
  color: #d1d5db;
  border-color: #4b5563;
}

:root.dark-theme .help-theme-btn:hover {
  background: #374151;
}

:root.dark-theme .help-content::-webkit-scrollbar {
  width: 6px;
}

:root.dark-theme .help-content::-webkit-scrollbar-track {
  background: #374151;
  border-radius: 4px;
}

:root.dark-theme .help-content::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 4px;
}
</style>
