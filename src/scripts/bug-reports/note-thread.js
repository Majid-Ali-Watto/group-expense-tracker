import { ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { database, doc, updateDoc, deleteField } from '@/firebase'
import { DB_NODES } from '@/constants'
import {
  uploadToCloudinary,
  showError,
  showSuccess,
  generateUUID
} from '@/utils'

export const REACTION_EMOJIS = ['👍', '❤️', '😄', '😮', '😢', '👎']

/**
 * Shared factory that encapsulates all note-thread UI state and logic:
 * editing, deleting, reactions, emoji picker, reply-to, and scroll-to-original.
 *
 * Both BugReport (reporter side) and BugReportsAdmin use this.
 * The only difference is the `actorKeyFn` – how the "who am I?" key is resolved.
 *
 * @param {{ actorKeyFn: () => string, idPrefix: string, pickerWrapClass: string }} options
 *   - actorKeyFn     – returns the current user key used for reactions (e.g. mobile number or 'admin')
 *   - idPrefix       – DOM id prefix for note scroll targets (e.g. 'bra-note' or 'bug-mr-note')
 *   - pickerWrapClass – CSS class of the reaction picker wrapper div (for outside-click logic)
 */
export const NoteThread = ({ actorKeyFn, idPrefix, pickerWrapClass }) => {
  // ── Emoji reaction picker ─────────────────────────────────────────────────
  const openReactionPicker = ref(null)
  const reactionPickerAlign = ref('left')

  function togglePickerOpen(noteId, event) {
    if (openReactionPicker.value === noteId) {
      openReactionPicker.value = null
      return
    }
    const btn = event.currentTarget
    const rect = btn.getBoundingClientRect()
    reactionPickerAlign.value =
      rect.left > window.innerWidth / 2 ? 'right' : 'left'
    openReactionPicker.value = noteId
  }

  function closeReactionPicker(e) {
    if (!e.target.closest(`.${pickerWrapClass}`))
      openReactionPicker.value = null
  }

  // ── Reply-to state ────────────────────────────────────────────────────────
  const replyingTo = ref(null) // { reportId, noteId, authorName, authorType, text }

  function startReply(reportId, note, displayName) {
    replyingTo.value = {
      reportId,
      noteId: note.id,
      authorName: displayName,
      authorType: note.authorType,
      text: note.text
    }
  }

  function cancelReply() {
    replyingTo.value = null
  }

  // ── Scroll-to-original note (WhatsApp-style) ──────────────────────────────
  function scrollToNote(noteId) {
    const el = document.getElementById(`${idPrefix}-${noteId}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    el.classList.add('nt-note-flash')
    setTimeout(() => el.classList.remove('nt-note-flash'), 1500)
  }

  // ── Note edit state ───────────────────────────────────────────────────────
  const noteEditingId = ref(null)
  const noteEditText = ref('')
  const noteEditError = ref('')
  const noteEditSavingId = ref(null)

  function startNoteEdit(note) {
    noteEditingId.value = note.id
    noteEditText.value = note.text
    noteEditError.value = ''
    openReactionPicker.value = null
  }

  function cancelNoteEdit() {
    noteEditingId.value = null
    noteEditText.value = ''
    noteEditError.value = ''
  }

  // ── Firebase helpers shared by both sides ─────────────────────────────────
  function mobileKeyOf(report) {
    return report.reporter?.mobile || 'unknown'
  }

  function reportDocRef(report) {
    return doc(
      database,
      DB_NODES.BUG_REPORTS,
      mobileKeyOf(report),
      'reports',
      report.id
    )
  }

  async function saveNoteEdit(report, note, textOverride) {
    const text = (textOverride ?? noteEditText.value).trim()
    if (!text) {
      noteEditError.value = 'Note cannot be empty.'
      return
    }
    noteEditSavingId.value = note.id
    try {
      await updateDoc(reportDocRef(report), {
        [`notes.${note.id}.text`]: text,
        [`notes.${note.id}.editedAt`]: new Date().toISOString()
      })
      cancelNoteEdit()
      showSuccess('Note updated.')
    } catch {
      showError('Failed to update note. Please try again.')
    } finally {
      noteEditSavingId.value = null
    }
  }

  async function deleteNote(report, note) {
    try {
      await ElMessageBox.confirm(
        'Delete this note permanently?',
        'Delete Note',
        {
          confirmButtonText: 'Delete',
          cancelButtonText: 'Cancel',
          type: 'error'
        }
      )
    } catch {
      return
    }
    try {
      await updateDoc(reportDocRef(report), {
        [`notes.${note.id}`]: deleteField()
      })
      showSuccess('Note deleted.')
    } catch {
      showError('Failed to delete note. Please try again.')
    }
  }

  async function toggleReaction(report, note, emoji) {
    openReactionPicker.value = null
    const actorKey = actorKeyFn()
    if (!actorKey) return
    const alreadyReacted = note.reactions?.[emoji]?.[actorKey]
    try {
      await updateDoc(reportDocRef(report), {
        [`notes.${note.id}.reactions.${emoji}.${actorKey}`]: alreadyReacted
          ? deleteField()
          : true
      })
    } catch {
      showError('Failed to update reaction. Please try again.')
    }
  }

  function reactionsOf(note) {
    if (!note.reactions) return []
    const actorKey = actorKeyFn()
    return Object.entries(note.reactions)
      .map(([emoji, actors]) => ({
        emoji,
        count: Object.values(actors).filter(Boolean).length,
        mine: !!(actorKey && actors[actorKey])
      }))
      .filter((r) => r.count > 0)
  }

  // ── Upload images attached to a note ─────────────────────────────────────
  async function uploadNoteImages(editorImages = []) {
    const result = []
    for (const img of editorImages) {
      const uploaded = await uploadToCloudinary(img.file)
      result.push({ url: uploaded.url, publicId: uploaded.publicId })
    }
    return result
  }

  // ── Build replyTo payload (if replying to a specific note) ────────────────
  function buildReplyTo(reportId) {
    if (!replyingTo.value || replyingTo.value.reportId !== reportId) return {}
    return {
      replyTo: {
        noteId: replyingTo.value.noteId,
        authorName: replyingTo.value.authorName,
        authorType: replyingTo.value.authorType,
        textPreview: replyingTo.value.text.slice(0, 120)
      }
    }
  }

  // ── Push a note to Firebase ───────────────────────────────────────────────
  async function pushNote(report, payload) {
    const noteId = generateUUID()
    return updateDoc(reportDocRef(report), { [`notes.${noteId}`]: payload })
  }

  return {
    // Picker
    openReactionPicker,
    reactionPickerAlign,
    togglePickerOpen,
    closeReactionPicker,
    // Reply
    replyingTo,
    startReply,
    cancelReply,
    // Scroll
    scrollToNote,
    // Edit
    noteEditingId,
    noteEditText,
    noteEditError,
    noteEditSavingId,
    startNoteEdit,
    cancelNoteEdit,
    saveNoteEdit,
    // Delete
    deleteNote,
    // Reactions
    REACTION_EMOJIS,
    toggleReaction,
    reactionsOf,
    // Helpers
    mobileKeyOf,
    uploadNoteImages,
    buildReplyTo,
    pushNote
  }
}
