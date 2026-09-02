<template>
  <el-checkbox
    :model-value="modelValue"
    class="terms-consent-checkbox text-sm text-gray-700"
    @update:modelValue="$emit('update:modelValue', $event)"
  >
    <i18n-t keypath="auth.actions.agreeToTerms" tag="span">
      <template #terms>
        <RouterLink :to="withLocale('/terms')" @click.stop>{{
          t('footer.terms')
        }}</RouterLink>
      </template>
      <template #privacy>
        <RouterLink :to="withLocale('/privacy')" @click.stop>{{
          t('footer.privacy')
        }}</RouterLink>
      </template>
    </i18n-t>
  </el-checkbox>
</template>

<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const withLocale = (path) => (route.meta?.locale === 'ur' ? `/ur${path}` : path)

defineProps({
  modelValue: { type: Boolean, default: false }
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
/* Element Plus's default .el-checkbox is a fixed-height, single-line
   inline-flex row — fine for a short label, but this one wraps to 2-3
   lines on narrow screens, so the box needs to stay pinned to the top of
   the (now variable-height, wrapping) label instead of vertical-centered
   against it. */
/* NOTE: the scoped class goes OUTSIDE :deep() — it's on this component's
   own root element (already scope-tagged by Vue), so it needs no :deep()
   at all. :deep() is reserved for the part of the selector reaching past
   it, into Element Plus's own unscoped internals (.el-checkbox__label
   etc.). Wrapping the whole selector in :deep() (as an earlier version of
   this file did) requires an actual ANCESTOR carrying the scope attribute,
   which doesn't exist here — so none of those rules ever matched. */
.terms-consent-checkbox {
  display: flex;
  align-items: flex-start;
  height: auto;
  width: 100%;
  white-space: normal;
}

.terms-consent-checkbox :deep(.el-checkbox__input) {
  margin-top: 2px;
  flex: 0 0 auto;
}

/* Element Plus's own .el-checkbox__label is display:inline-block, which
   sizes to its content (i.e. never wraps, just overflows) — force it into
   a block that actually fills and wraps within the remaining row width. */
.terms-consent-checkbox :deep(.el-checkbox__label) {
  display: block;
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 1.4;
}

/* Same link color as the "Forgot Password?" / "Resend Verification Email"
   links on this same screen (GenericButton.vue's .gb-link) — without this,
   RouterLink inherits el-checkbox__label's text color and reads as plain
   text instead of a link. */
.terms-consent-checkbox :deep(.el-checkbox__label a) {
  color: #16a34a !important;
  font-weight: 600;
  text-decoration: none;
  text-underline-offset: 2px;
}

.terms-consent-checkbox :deep(.el-checkbox__label a:hover) {
  color: #15803d !important;
  text-decoration: underline;
}
</style>
