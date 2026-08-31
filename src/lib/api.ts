/** API base URL baked in at build time. Empty in dev → same-origin `/api` via Vite proxy. */
const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''

export function apiUrl(path: string): string {
  if (!path.startsWith('/')) {
    throw new Error(`API path must start with / (got ${path})`)
  }
  return `${API_BASE}${path}`
}
