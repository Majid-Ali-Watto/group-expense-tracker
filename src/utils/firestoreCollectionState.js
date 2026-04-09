function defaultMapDoc(docSnap) {
  return { id: docSnap.id, ...docSnap.data() }
}

export function buildEmptyCollectionState(includeRaw = false) {
  return includeRaw ? { raw: {}, list: [], keys: [] } : { list: [], keys: [] }
}

export function buildSnapshotCollectionState(snapshot, options = {}) {
  const {
    includeRaw = false,
    mapDoc = defaultMapDoc,
    includeItem = () => true
  } = options

  const state = buildEmptyCollectionState(includeRaw)

  snapshot.docs.forEach((docSnap) => {
    const item = mapDoc(docSnap)

    if (includeRaw) {
      state.raw[docSnap.id] = item
    }

    if (!includeItem(item, docSnap)) return

    state.list.push(item)
    state.keys.push(docSnap.id)
  })

  return state
}

export function applyCollectionState(
  state,
  { listRef, keysRef, rawRef = null, loadedRef = null, afterApply = null }
) {
  listRef.value = state.list || []
  keysRef.value = state.keys || []

  if (rawRef) {
    rawRef.value = state.raw || {}
  }

  afterApply?.(state)

  if (loadedRef) {
    loadedRef.value = true
  }
}
