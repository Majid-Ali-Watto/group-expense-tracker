import { ref, onMounted, onUnmounted } from 'vue'

export function useMobileScreen(breakpoint = 640) {
  const isMobileScreen = ref(window.innerWidth < breakpoint)
  const onResize = () => {
    isMobileScreen.value = window.innerWidth < breakpoint
  }
  onMounted(() => window.addEventListener('resize', onResize))
  onUnmounted(() => window.removeEventListener('resize', onResize))
  return { isMobileScreen }
}
