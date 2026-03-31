import { defineAsyncComponent } from 'vue'
import { LoadingSkeleton } from '@/components/shared'

export function loadAsyncComponent(loader) {
  return defineAsyncComponent({
    loader,
    delay: 0,
    suspensible: false,
    loadingComponent: LoadingSkeleton
  })
}
