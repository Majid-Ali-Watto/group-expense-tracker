// Only auth is needed here — '@/firebase-auth' skips pulling in Firestore.
import { auth } from '@/firebase-auth'

export async function getApiAuthHeaders(headers = {}) {
  const token = await auth.currentUser?.getIdToken()

  if (!token) {
    throw new Error('No authenticated user available for API request.')
  }

  return {
    ...headers,
    Authorization: `Bearer ${token}`
  }
}
