<template>
  <div class="ua-wrap" :class="wrapClass">
    <component
      :is="avatarTag"
      :type="avatarTag === 'button' ? 'button' : undefined"
      :class="avatarClasses"
      :disabled="avatarTag === 'button' ? disabled : undefined"
      @click="handlePreview"
    >
      <AppImage
        v-if="imageUrl && !imageLoadError"
        :src="imageUrl"
        :alt="resolvedAlt"
        :class="imageClasses"
        :fit="fit"
        @error="imageLoadError = true"
      />
      <span v-else-if="initials" :class="initialsClasses">{{ initials }}</span>
      <UserIcon v-else :class="iconClasses" />
    </component>

    <button
      v-if="showZoomButton && canPreview"
      type="button"
      class="ua-zoom-btn"
      :class="zoomButtonClass"
      @click.stop="handlePreview"
    >
      {{ zoomButtonLabel }}
    </button>
  </div>

  <ImagePreviewDialog
    v-if="canPreview"
    v-model="previewVisible"
    :images="previewImages"
    :title="resolvedPreviewTitle"
    :width="previewWidth"
  />
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { UserIcon } from '@/components/icons'
import AppImage from './AppImage.vue'
import ImagePreviewDialog from './ImagePreviewDialog.vue'

const { t } = useI18n()

const props = defineProps({
  imageUrl: { type: String, default: '' },
  previewUrl: { type: String, default: '' },
  name: { type: String, default: '' },
  alt: { type: String, default: '' },
  previewTitle: { type: String, default: '' },
  previewWidth: { type: String, default: 'min(92vw, 560px)' },
  previewOnClick: { type: Boolean, default: false },
  showZoomButton: { type: Boolean, default: false },
  zoomButtonLabel: { type: String, default: '+' },
  disabled: { type: Boolean, default: false },
  fit: { type: String, default: 'cover' },
  size: { type: String, default: 'md' },
  variant: { type: String, default: 'plain' },
  iconSize: { type: String, default: 'md' },
  iconTone: { type: String, default: 'current' },
  wrapClass: { type: String, default: '' },
  avatarClass: { type: String, default: '' },
  imageClass: { type: String, default: '' },
  iconClass: { type: String, default: '' },
  zoomButtonClass: { type: String, default: '' }
})

const previewVisible = ref(false)
const imageLoadError = ref(false)

watch(
  () => props.imageUrl,
  () => {
    imageLoadError.value = false
  }
)

const initials = computed(() => {
  const words = props.name.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return ''
  if (words.length === 1) return words[0].charAt(0).toUpperCase()
  // First name + last name initials, skipping any middle names —
  // e.g. "Majid Ali" -> "MA", "Majid Ali Watto" -> "MW"
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
})

const resolvedAlt = computed(() => props.alt || t('common.profileAlt'))
const resolvedPreviewTitle = computed(
  () => props.previewTitle || t('common.profilePhotoTitle')
)
const resolvedPreviewUrl = computed(
  () => props.previewUrl || props.imageUrl || ''
)
const canPreview = computed(() => !!resolvedPreviewUrl.value && !props.disabled)
const canPreviewOnClick = computed(
  () => props.previewOnClick && canPreview.value
)
const avatarTag = computed(() => (canPreviewOnClick.value ? 'button' : 'div'))
const previewImages = computed(() =>
  resolvedPreviewUrl.value
    ? [
        {
          url: resolvedPreviewUrl.value,
          name: resolvedPreviewTitle.value || resolvedAlt.value
        }
      ]
    : []
)
const avatarClasses = computed(() => [
  'ua-avatar',
  `ua-avatar--${props.size}`,
  `ua-avatar--${props.variant}`,
  props.avatarClass,
  { 'ua-avatar--interactive': canPreviewOnClick.value }
])
const imageClasses = computed(() => ['ua-image', props.imageClass])
const iconClasses = computed(() => [
  'ua-fallback',
  `ua-fallback--${props.iconSize}`,
  `ua-fallback--${props.iconTone}`,
  props.iconClass
])
const initialsClasses = computed(() => [
  'ua-initials',
  `ua-initials--${props.size}`,
  `ua-initials--${props.iconTone}`
])

function handlePreview() {
  if (!canPreviewOnClick.value && !props.showZoomButton) return
  if (!canPreview.value) return
  previewVisible.value = true
}
</script>

<style scoped>
.ua-wrap {
  position: relative;
  display: inline-flex;
}

.ua-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  padding: 0;
  flex-shrink: 0;
}

.ua-avatar--interactive {
  cursor: zoom-in;
}

.ua-avatar--fill {
  width: 100%;
  height: 100%;
}

.ua-avatar--xs {
  width: 20px;
  height: 20px;
}

.ua-avatar--md {
  width: 2.5rem;
  height: 2.5rem;
}

.ua-avatar--lg {
  width: 3rem;
  height: 3rem;
}

.ua-avatar--plain {
  overflow: hidden;
}

.ua-avatar--welcome {
  overflow: hidden;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--success-400), var(--success-600));
  box-shadow: 0 10px 18px -12px rgba(34, 197, 94, 0.5);
}

.ua-avatar--user {
  overflow: hidden;
  border-radius: 999px;
  border: 1px solid rgba(34, 197, 94, 0.18);
  background: linear-gradient(135deg, #22c55e, #15803d);
  box-shadow: 0 10px 18px -14px rgba(21, 128, 61, 0.7);
}

.ua-avatar--profile {
  overflow: hidden;
  border-radius: 999px;
  background: linear-gradient(135deg, #22c55e, #15803d);
  box-shadow: 0 14px 24px -18px rgba(21, 128, 61, 0.8);
}

.ua-image {
  width: 100%;
  height: 100%;
}

.ua-avatar--profile .ua-image {
  transform: scale(0.9);
  transform-origin: center;
}

.ua-fallback {
  flex-shrink: 0;
}

.ua-fallback--sm {
  width: 1rem;
  height: 1rem;
}

.ua-fallback--md {
  width: 1.25rem;
  height: 1.25rem;
}

.ua-fallback--lg {
  width: 1.5rem;
  height: 1.5rem;
}

.ua-fallback--white {
  color: #ffffff;
}

.ua-fallback--current {
  color: currentColor;
}

.ua-initials {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-weight: 600;
  line-height: 1;
  user-select: none;
}

.ua-initials--xs {
  font-size: 0.55rem;
  letter-spacing: -0.02em;
}

.ua-initials--md {
  font-size: 0.9rem;
  letter-spacing: -0.02em;
}

.ua-initials--lg {
  font-size: 1.05rem;
  letter-spacing: -0.02em;
}

.ua-initials--white {
  color: #ffffff;
}

.ua-initials--current {
  color: currentColor;
}

.ua-zoom-btn {
  position: absolute;
  right: -0.2rem;
  bottom: -0.2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  border: none;
  border-radius: 999px;
  background: #0f172a;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1;
  cursor: zoom-in;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.24);
}
</style>
