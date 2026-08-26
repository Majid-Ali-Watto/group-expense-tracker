<template>
  <div
    class="rte-wrapper"
    :class="{ 'rte-error': hasError, 'rte-disabled': disabled }"
  >
    <!-- Toolbar -->
    <div class="rte-toolbar">
      <button
        type="button"
        class="rte-btn"
        :title="t('markdownEditor.bold')"
        :disabled="disabled"
        @mousedown.prevent="editor?.chain().focus().toggleBold().run()"
      >
        <b>B</b>
      </button>
      <button
        type="button"
        class="rte-btn"
        :title="t('markdownEditor.italic')"
        :disabled="disabled"
        @mousedown.prevent="editor?.chain().focus().toggleItalic().run()"
      >
        <i>I</i>
      </button>
      <button
        type="button"
        class="rte-btn rte-btn--mono"
        :title="t('markdownEditor.inlineCode')"
        :disabled="disabled"
        @mousedown.prevent="editor?.chain().focus().toggleCode().run()"
      >
        &lt;/&gt;
      </button>
      <button
        type="button"
        class="rte-btn rte-btn--mono"
        :title="t('markdownEditor.codeBlock')"
        :disabled="disabled"
        @mousedown.prevent="editor?.chain().focus().toggleCodeBlock().run()"
      >
        &#9641;&thinsp;Block
      </button>
      <span class="rte-sep" />
      <button
        type="button"
        class="rte-btn"
        :title="t('markdownEditor.bulletList')"
        :disabled="disabled"
        @mousedown.prevent="editor?.chain().focus().toggleBulletList().run()"
      >
        &#8226; List
      </button>
      <button
        type="button"
        class="rte-btn"
        :title="t('markdownEditor.numberedList')"
        :disabled="disabled"
        @mousedown.prevent="editor?.chain().focus().toggleOrderedList().run()"
      >
        1. List
      </button>
      <template v-if="showTemplate">
        <span class="rte-sep" />
        <button
          type="button"
          class="rte-btn rte-btn--template"
          :title="t('markdownEditor.insertTemplate')"
          :disabled="disabled"
          @mousedown.prevent="$emit('template')"
        >
          &#128196; Template
        </button>
      </template>
      <span v-if="showWordLimit" class="rte-count"
        >{{ charCount }}/{{ maxlength }}</span
      >
    </div>

    <!-- Editor content -->
    <EditorContent :editor="editor" class="rte-content" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { CharacterCount, Placeholder } from '@tiptap/extensions'
import { useI18n } from 'vue-i18n'
import { markdownToHtml } from '@/scripts/bug-reports'

const { t } = useI18n()

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  maxlength: { type: Number, default: 1000 },
  showWordLimit: { type: Boolean, default: false },
  showTemplate: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  hasError: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'template'])

const charCount = ref(0)

// Tracks the last markdown string *this component* emitted, so the
// modelValue watcher below can tell "external change" (Template button,
// BugReportEditDialog's resetEdit) apart from "our own typing echoed back
// through v-model" and avoid clobbering the user's cursor mid-edit.
let lastEmitted = props.modelValue

// Walks editor.getJSON() back into the exact narrow markdown dialect
// kharcafy-node-be's jira.service.ts (buildDescriptionDoc/
// inlineMarkdownToAdf) parses — mirrors that function's node/mark set
// (paragraph, codeBlock, bulletList/orderedList > listItem, marks
// bold/italic/code), just inverted. Hand-rolled rather than a generic
// markdown library so it's guaranteed to match what the backend expects —
// see the plan's reasoning for why a generic library's output could drift.
function marksToMarkdown(text, marks) {
  const types = (marks || []).map((mark) => mark.type)
  let result = text
  if (types.includes('code')) result = `\`${result}\``
  if (types.includes('italic')) result = `*${result}*`
  if (types.includes('bold')) result = `**${result}**`
  return result
}

function inlineToMarkdown(content) {
  return (content || [])
    .map((node) => (node.type === 'text' ? marksToMarkdown(node.text, node.marks) : ''))
    .join('')
}

function tiptapJsonToMarkdown(doc) {
  const blocks = (doc.content || []).map((node) => {
    if (node.type === 'paragraph') {
      return inlineToMarkdown(node.content)
    }

    if (node.type === 'codeBlock') {
      const code = (node.content || []).map((n) => n.text || '').join('')
      return '```\n' + code + '\n```'
    }

    if (node.type === 'bulletList' || node.type === 'orderedList') {
      return (node.content || [])
        .map((item, index) => {
          const paragraph = (item.content || []).find(
            (n) => n.type === 'paragraph'
          )
          const marker = node.type === 'orderedList' ? `${index + 1}.` : '-'
          return `${marker} ${inlineToMarkdown(paragraph?.content)}`
        })
        .join('\n')
    }

    return ''
  })

  return blocks.filter((block) => block.length > 0).join('\n')
}

const editor = useEditor({
  content: markdownToHtml(props.modelValue),
  editable: !props.disabled,
  extensions: [
    // heading/blockquote/horizontalRule/strike/link/underline/hardBreak
    // disabled — the editor must not be able to produce content our
    // markdown dialect (and the backend's parser) don't support. A soft
    // line break (hardBreak/Shift+Enter) has no equivalent in that dialect
    // either — every line break is a paragraph break, both directions.
    StarterKit.configure({
      heading: false,
      blockquote: false,
      horizontalRule: false,
      strike: false,
      link: false,
      underline: false,
      hardBreak: false
    }),
    CharacterCount.configure({ limit: props.maxlength }),
    Placeholder.configure({ placeholder: props.placeholder })
  ],
  onCreate: ({ editor: current }) => {
    charCount.value = current.storage.characterCount.characters()
  },
  onUpdate: ({ editor: current }) => {
    charCount.value = current.storage.characterCount.characters()
    const markdown = tiptapJsonToMarkdown(current.getJSON())
    lastEmitted = markdown
    emit('update:modelValue', markdown)
  }
})

// External changes to modelValue (Template button, resetEdit) — re-seed the
// editor from markdown → HTML, same path used on initial mount.
watch(
  () => props.modelValue,
  (value) => {
    if (value === lastEmitted) return
    lastEmitted = value
    editor.value?.commands.setContent(markdownToHtml(value))
    charCount.value = editor.value?.storage.characterCount.characters() ?? 0
  }
)

watch(
  () => props.disabled,
  (disabled) => {
    editor.value?.setEditable(!disabled)
  }
)
</script>

<style scoped>
.rte-wrapper {
  width: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  overflow: hidden;
}

.rte-wrapper.rte-error {
  border-color: #ef4444;
}

.rte-wrapper.rte-disabled {
  opacity: 0.7;
}

/* ── Toolbar ────────────────────────────────────────────────── */
.rte-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 5px 8px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color);
  flex-wrap: wrap;
}

.rte-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 4px;
  border: 1px solid transparent;
  background: transparent;
  font-size: 12.5px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: all 0.12s;
  min-width: 24px;
  height: 24px;
  line-height: 1;
}

.rte-btn:hover:not(:disabled) {
  background: var(--el-fill-color);
  border-color: var(--el-border-color);
  color: var(--el-text-color-primary);
}

.rte-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.rte-btn--mono {
  font-family: monospace;
  font-size: 11.5px;
}

.rte-btn--template {
  color: #6366f1;
}
.rte-btn--template:hover:not(:disabled) {
  border-color: #6366f1 !important;
  background: #eef2ff !important;
}

.rte-sep {
  width: 1px;
  height: 16px;
  background: var(--el-border-color);
  margin: 0 4px;
  flex-shrink: 0;
}

.rte-count {
  margin-left: auto;
  font-size: 10.5px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
}

/* ── Editor content ─────────────────────────────────────────── */
.rte-content {
  padding: 8px 11px;
}

.rte-content :deep(.ProseMirror) {
  min-height: 140px;
  outline: none;
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
}

.rte-content :deep(.ProseMirror p) {
  margin: 0 0 6px;
}
.rte-content :deep(.ProseMirror p:last-child) {
  margin-bottom: 0;
}

.rte-content :deep(.ProseMirror code) {
  font-family: monospace;
  font-size: 12.5px;
  background: var(--el-fill-color);
  padding: 1px 4px;
  border-radius: 3px;
}

.rte-content :deep(.ProseMirror pre) {
  margin: 4px 0 6px;
  border-radius: 6px;
  overflow-x: auto;
  background: var(--el-fill-color);
  padding: 10px 12px;
}
.rte-content :deep(.ProseMirror pre code) {
  background: none;
  padding: 0;
  font-size: 12.5px;
}

.rte-content :deep(.ProseMirror ul) {
  margin: 4px 0 6px;
  padding-left: 20px;
  list-style-type: disc;
}
.rte-content :deep(.ProseMirror ol) {
  margin: 4px 0 6px;
  padding-left: 22px;
  list-style-type: decimal;
}
.rte-content :deep(.ProseMirror li) {
  margin: 2px 0;
}

.rte-content :deep(.ProseMirror .is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
  color: var(--el-text-color-placeholder);
}

/* ── Dark theme ─────────────────────────────────────────────── */
:root.dark-theme .rte-toolbar {
  background: #1f2937;
  border-color: #374151;
}
:root.dark-theme .rte-btn {
  color: #d1d5db;
}
:root.dark-theme .rte-btn:hover:not(:disabled) {
  background: #374151;
  border-color: #4b5563;
  color: #f3f4f6;
}
:root.dark-theme .rte-sep {
  background: #374151;
}
:root.dark-theme .rte-content :deep(.ProseMirror) {
  background: #1f2937;
  color: #e5e7eb;
}
:root.dark-theme .rte-content :deep(.ProseMirror code),
:root.dark-theme .rte-content :deep(.ProseMirror pre) {
  background: #111827;
}
</style>
