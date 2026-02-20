import { ElLoading } from 'element-plus'
function startLoading() {
  const loading = ElLoading.service({
    lock: true,
    text: 'Loading',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  return loading
}
function stopLoading(loading) {
  loading.close()
}

export { startLoading, stopLoading }
