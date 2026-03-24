import { ElLoading } from 'element-plus'

let loadingInstance = null
let activeLoadCount = 0

function getDefaultOptions() {
  return {
    lock: true,
    text: 'Loading',
    background: 'rgba(0, 0, 0, 0.7)'
  }
}

function startLoading(options = {}) {
  const token = { active: false }
  activeLoadCount += 1
  token.active = true

  if (!loadingInstance) {
    loadingInstance = ElLoading.service({
      ...getDefaultOptions(),
      ...options
    })
  }

  return token
}

function stopLoading(token) {
  if (!token?.active) return

  token.active = false
  activeLoadCount = Math.max(0, activeLoadCount - 1)

  if (activeLoadCount === 0 && loadingInstance) {
    loadingInstance.close()
    loadingInstance = null
  }
}

async function withLoading(task, enabled = true, options = {}) {
  const token = enabled ? startLoading(options) : null

  try {
    return await task()
  } finally {
    if (token) stopLoading(token)
  }
}

export { startLoading, stopLoading, withLoading }
