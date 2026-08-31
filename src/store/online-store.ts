function createOnlineStore() {
  let online = typeof navigator !== 'undefined' ? navigator.onLine : true
  const listeners = new Set<() => void>()

  function handleChange() {
    const next = navigator.onLine
    if (next === online) return
    online = next
    listeners.forEach((listener) => listener())
  }

  function subscribe(listener: () => void) {
    listeners.add(listener)
    if (listeners.size === 1 && typeof window !== 'undefined') {
      window.addEventListener('online', handleChange)
      window.addEventListener('offline', handleChange)
    }
    return () => {
      listeners.delete(listener)
      if (listeners.size === 0 && typeof window !== 'undefined') {
        window.removeEventListener('online', handleChange)
        window.removeEventListener('offline', handleChange)
      }
    }
  }

  function getSnapshot(): boolean {
    return online
  }

  return { subscribe, getSnapshot }
}

export const onlineStore = createOnlineStore()
