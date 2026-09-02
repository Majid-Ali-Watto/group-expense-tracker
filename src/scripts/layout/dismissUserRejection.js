// Single Firestore write, split out of header.js and reached only via
// dynamic import() there (see the call site in Header.vue's handleNavigate)
// — Header is rendered on every route including public marketing pages, so
// a static '@/firebase' import here would force the Firestore SDK into
// every visitor's bundle. Kept as its own tiny module (rather than a
// dynamic import() of '@/firebase' directly) since dynamically importing
// that large re-export module by itself confused Rollup's SSR bundling.
import { database, doc, updateDoc, deleteField } from '@/firebase'
import { DB_NODES } from '@/constants'

export function dismissUserRejection(uid) {
  return updateDoc(doc(database, DB_NODES.USERS, uid), {
    rejectionNotification: deleteField()
  })
}
