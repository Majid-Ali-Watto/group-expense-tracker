import { auth } from '@/firebase'

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
