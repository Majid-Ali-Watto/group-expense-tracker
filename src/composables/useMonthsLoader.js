import { getCache, setCache } from '@/utils/queryCache'

function sortMonthsDescending(months = []) {
  return [...months].sort((a, b) => b.localeCompare(a))
}

export async function loadMonthsList({
  isEnabled,
  parentPath,
  monthsPath,
  read,
  readShallow,
  monthsRef,
  loadedRef,
  errorHandler,
  onResolved
}) {
  loadedRef.value = false

  if (!isEnabled()) {
    loadedRef.value = true
    return []
  }

  const cached = getCache(monthsPath)
  if (cached) {
    monthsRef.value = cached
    loadedRef.value = true
    return cached
  }

  try {
    const parentDoc = await read(parentPath, false)
    const months = parentDoc?.months?.length
      ? sortMonthsDescending(parentDoc.months)
      : sortMonthsDescending(await readShallow(monthsPath, false))

    monthsRef.value = months
    setCache(monthsPath, months)
    onResolved?.(months)
    return months
  } catch (error) {
    if (error?.code !== 'permission-denied') {
      errorHandler?.(error)
    }
    return []
  } finally {
    loadedRef.value = true
  }
}
