import { watch } from 'vue'

export function useRouteQuerySync({
  route,
  router,
  sources,
  buildQuery,
  deep = false
}) {
  watch(
    sources,
    () => {
      router.replace({ path: route.path, query: buildQuery() })
    },
    { deep }
  )
}
