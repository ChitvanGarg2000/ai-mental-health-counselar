import { appStore } from '@/store/app-store'

export function downloadAppDataExport() {
  const snapshot = appStore.getSnapshot()
  const json = JSON.stringify(snapshot, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const stamp = new Date().toISOString().slice(0, 10)

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `haven-export-${stamp}.json`
  anchor.click()

  URL.revokeObjectURL(url)
}
