<!--
  On-demand "how do I pay this person" card. Deliberately does NOT read from
  userStore (which only ever exposes a masked mobile for anyone but the
  active user — see src/utils/user-display.js) — it fetches the target
  user's own Firestore doc directly each time it opens, showing whatever
  payment accounts they've added. The mobile number ("Wallet Account") is
  only shown at all when a wallet name is attached to it — see the
  v-if="details.mobileWalletProvider" wrapper below — a narrow,
  giver-initiated exception to the app's normal masked-mobile privacy rule,
  granted only when the number is actually payment-relevant.
-->
<template>
  <el-dialog
    :model-value="visible"
    :title="t('paymentAccount.dialogTitle')"
    width="min(92vw, 380px)"
    append-to-body
    @update:model-value="$emit('update:visible', $event)"
  >
    <div v-if="loading" class="py-6 text-center text-sm text-gray-500">
      {{ t('common.loading') }}
    </div>
    <div v-else-if="!hasAnyDetails" class="py-4 text-sm text-gray-500">
      {{ t('paymentAccount.noDetails', { name: displayName }) }}
    </div>
    <div v-else class="space-y-3">
      <p class="text-sm text-gray-600">
        {{ t('paymentAccount.intro', { name: displayName }) }}
      </p>
      <template v-if="details.mobileWalletProvider">
        <div class="payment-detail-row">
          <span class="payment-detail-label">{{
            t('paymentAccount.walletNameLabel')
          }}</span>
          <span class="payment-detail-value">{{
            details.mobileWalletProvider
          }}</span>
        </div>
        <div v-if="details.mobile" class="payment-detail-row">
          <span class="payment-detail-label">{{
            t('paymentAccount.walletAccountLabel')
          }}</span>
          <span class="payment-detail-value-group">
            <span class="payment-detail-value">{{ details.mobile }}</span>
            <el-button
              text
              circle
              size="small"
              :icon="CopyDocument"
              :title="t('paymentAccount.copyAccountNumber')"
              @click="copyWalletAccount"
            />
          </span>
        </div>
      </template>
      <template v-if="details.bankName || details.bankAccountNumber">
        <div v-if="details.bankName" class="payment-detail-row">
          <span class="payment-detail-label">{{
            t('paymentAccount.bankNameLabel')
          }}</span>
          <span class="payment-detail-value">{{ details.bankName }}</span>
        </div>
        <div v-if="details.bankAccountNumber" class="payment-detail-row">
          <span class="payment-detail-label">{{
            t('paymentAccount.bankAccountLabel')
          }}</span>
          <span class="payment-detail-value-group">
            <span class="payment-detail-value">{{
              details.bankAccountNumber
            }}</span>
            <el-button
              text
              circle
              size="small"
              :icon="CopyDocument"
              :title="t('paymentAccount.copyAccountNumber')"
              @click="copyBankAccount"
            />
          </span>
        </div>
      </template>
      <div v-if="details.qrCodeUrl" class="text-center space-y-2">
        <div class="payment-qr-frame">
          <img
            :src="details.qrCodeUrl"
            :alt="t('profile.qrCodeAlt')"
            class="payment-qr-image"
            @click="qrPreviewVisible = true"
          />
        </div>
        <div class="flex justify-center gap-3">
          <el-button size="small" text @click="qrPreviewVisible = true">
            {{ t('paymentAccount.previewQrCode') }}
          </el-button>
          <el-button
            size="small"
            text
            :loading="qrDownloading"
            @click="downloadQrCode"
          >
            {{ t('paymentAccount.downloadQrCode') }}
          </el-button>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button
        size="default"
        type="primary"
        @click="$emit('update:visible', false)"
      >
        {{ t('common.close') }}
      </el-button>
    </template>
  </el-dialog>

  <ImagePreviewDialog
    v-model="qrPreviewVisible"
    :images="[{ url: details.qrCodeUrl, name: t('profile.qrCodeAlt') }]"
    :title="t('profile.qrCodeAlt')"
  />
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CopyDocument } from '@element-plus/icons-vue'
import { useClipboard, useFireBase } from '@/composables'
import { showError } from '@/utils'
import { DB_NODES } from '@/constants'
import ImagePreviewDialog from './ImagePreviewDialog.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  userUid: { type: String, default: '' },
  displayName: { type: String, default: '' }
})
defineEmits(['update:visible'])

const { t } = useI18n()
const { read } = useFireBase()
const { copyTextWithFeedback } = useClipboard()
const loading = ref(false)
const details = ref({})
const qrPreviewVisible = ref(false)
const qrDownloading = ref(false)

function copyWalletAccount() {
  copyTextWithFeedback(details.value.mobile, {
    successMessage: t('common.copied'),
    errorMessage: t('common.copyFailed')
  })
}

function copyBankAccount() {
  copyTextWithFeedback(details.value.bankAccountNumber, {
    successMessage: t('common.copied'),
    errorMessage: t('common.copyFailed')
  })
}

// Cloudinary URLs are cross-origin, so a plain <a download> is silently
// ignored by the browser (the download attribute only forces a save for
// same-origin/blob: URLs) — fetch the image and download it as a blob
// instead of just opening it in a new tab.
async function downloadQrCode() {
  if (!details.value.qrCodeUrl) return

  qrDownloading.value = true
  try {
    const response = await fetch(details.value.qrCodeUrl)
    if (!response.ok) throw new Error('Download failed')
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = blobUrl
    link.download = `${displayNameSlug.value}-payment-qr.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl)
  } catch {
    showError(t('paymentAccount.qrDownloadFailed'))
  } finally {
    qrDownloading.value = false
  }
}

// Mobile only counts as a "detail" when it's actually payment-relevant (has
// a wallet provider attached) — see the mobile row's v-if above. Without
// one, showing the number here would just be leaking it for no reason (see
// src/utils/user-display.js's getDisplayMobile — masked everywhere else).
const hasAnyDetails = computed(
  () =>
    Boolean(details.value.mobile && details.value.mobileWalletProvider) ||
    Boolean(details.value.bankName) ||
    Boolean(details.value.bankAccountNumber) ||
    Boolean(details.value.qrCodeUrl)
)

const displayNameSlug = computed(
  () =>
    (props.displayName || 'account')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'account'
)

async function loadDetails() {
  if (!props.userUid) {
    details.value = {}
    return
  }
  loading.value = true
  try {
    const user = await read(`${DB_NODES.USERS}/${props.userUid}`, false)
    details.value = user || {}
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.visible, props.userUid],
  ([visible]) => {
    if (visible) loadDetails()
  },
  { immediate: true }
)
</script>

<style scoped>
.payment-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.75rem;
  font-size: 0.875rem;
}

.payment-detail-label {
  color: var(--text-secondary, #6b7280);
  flex-shrink: 0;
}

.payment-detail-value {
  font-weight: 500;
  text-align: right;
  word-break: break-word;
}

.payment-detail-value-group {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  justify-content: flex-end;
}

.payment-qr-frame {
  width: 100%;
  box-sizing: border-box;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid var(--border-color, #e5e7eb);
  background: #fff;
}

.payment-qr-image {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: contain;
  cursor: pointer;
}
</style>
