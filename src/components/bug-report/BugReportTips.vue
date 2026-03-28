<template>
  <div class="bug-tips">
    <p class="bug-tips-title">Tips for a great bug report</p>
    <ul class="bug-tips-list">
      <li>Include the tab or section where the issue occurred.</li>
      <li>Mention the steps you took before the bug appeared.</li>
      <li>Describe what you expected vs. what actually happened.</li>
      <li>Attach a screenshot to make the issue immediately clear.</li>
      <li>Note whether the issue happens consistently or only sometimes.</li>
    </ul>
  </div>
</template>

<style scoped>
.bug-tips {
  padding: 16px 20px;
  border: 1px dashed var(--el-border-color);
  border-radius: 10px;
}

.bug-tips-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 10px;
}

.bug-tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bug-tips-list li {
  font-size: 13px;
  color: var(--el-text-color-regular);
  padding-left: 14px;
  position: relative;
  line-height: 1.5;
}

.bug-tips-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #f97316;
  font-weight: 700;
}

/* Dark theme */
:root.dark-theme .bug-tips {
  border-color: #374151;
}
:root.dark-theme .bug-tips-title {
  color: #f3f4f6;
}
:root.dark-theme .bug-tips-list li {
  color: #d1d5db;
}
</style>
