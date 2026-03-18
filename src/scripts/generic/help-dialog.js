import { ref, computed } from 'vue'

export const HelpDialog = (props, emit) => {
  const isMobile = ref(window.innerWidth < 768)
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 768
  })

  const openSections = ref(['start'])

  const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const handleClose = () => {
    visible.value = false
  }

  const handleLogout = () => {
    visible.value = false
    emit('logout')
  }

  return {
    isMobile,
    openSections,
    visible,
    handleClose,
    handleLogout
  }
}
