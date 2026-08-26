import { getApiAuthHeaders } from '@/utils'

const API_BASE_URL = import.meta.env.VITE_NODE_BE_API_URL?.trim()
const API_KEY = import.meta.env.VITE_X_API_KEY || ''

// Bug reports live in Jira now (no Firestore doc — see bug-report.js), so
// listing/edit/status-change/delete are real, user-facing backend calls —
// unlike useLoginRateLimit's callApi() these throw on failure instead of
// failing open.
async function callApi(path, { method = 'GET', body } = {}) {
  if (!API_BASE_URL) {
    throw new Error('Bug report backend is not configured.')
  }

  const headers = await getApiAuthHeaders({
    'Content-Type': 'application/json',
    'x-api-key': API_KEY
  })

  const response = await fetch(`${API_BASE_URL}/bug-reports${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {})
  })

  const responseBody = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(responseBody?.message || `Bug report request failed (${response.status}).`)
  }

  return responseBody
}

export function useBugReportsApi() {
  async function fetchBugReports() {
    const { issues } = await callApi('')
    return issues || []
  }

  async function updateBugReportStatus(issueKey, status) {
    await callApi(`/${encodeURIComponent(issueKey)}/status`, {
      method: 'PATCH',
      body: { status }
    })
  }

  // fields: { title?, category?, severity?, description?, removeAttachmentIds?, screenshots? }
  // Returns the freshly re-fetched issue so the caller can splice it straight
  // into its local list instead of doing a full re-fetch.
  async function updateBugReport(issueKey, fields) {
    const { issue } = await callApi(`/${encodeURIComponent(issueKey)}`, {
      method: 'PATCH',
      body: fields
    })
    return issue
  }

  async function deleteBugReport(issueKey) {
    await callApi(`/${encodeURIComponent(issueKey)}`, { method: 'DELETE' })
  }

  return { fetchBugReports, updateBugReportStatus, updateBugReport, deleteBugReport }
}
