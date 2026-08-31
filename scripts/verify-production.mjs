/**
 * Production smoke tests — streaming timing, SPA deep links, health/key probe.
 *
 * Usage:
 *   FRONTEND_URL=https://app.example.com API_URL=https://api.example.com node scripts/verify-production.mjs
 */
const FRONTEND_URL = process.env.FRONTEND_URL?.replace(/\/$/, '')
const API_URL = process.env.API_URL?.replace(/\/$/, '')

if (!FRONTEND_URL || !API_URL) {
  console.error('Set FRONTEND_URL and API_URL (no trailing slashes).')
  process.exit(1)
}

const DEEP_LINK_PATHS = ['/journal', '/toolkit', '/help', '/settings', '/chat/demo-session']

function log(title, detail) {
  console.log(`\n▸ ${title}`)
  if (detail) console.log(`  ${detail}`)
}

function pass(msg) {
  console.log(`  ✓ ${msg}`)
}

function fail(msg) {
  console.error(`  ✗ ${msg}`)
  process.exitCode = 1
}

async function checkHealth() {
  log('Health + API key landed')
  const res = await fetch(`${API_URL}/api/health`)
  if (!res.ok) {
    fail(`GET /api/health → ${res.status}`)
    return
  }
  const body = await res.json()
  pass(`ok=${body.ok}, companion=${body.companion}`)
  if (body.openRouterKeyConfigured) {
    pass('openRouterKeyConfigured=true (secret is present on the server)')
  } else {
    fail('openRouterKeyConfigured=false — OPEN_ROUTER_API_KEY missing on backend')
  }
}

async function checkDeepLinks() {
  log('Deep links survive refresh (SPA rewrite)')
  for (const path of DEEP_LINK_PATHS) {
    const res = await fetch(`${FRONTEND_URL}${path}`, { redirect: 'follow' })
    const html = await res.text()
    if (res.status !== 200) {
      fail(`${path} → HTTP ${res.status} (expected 200; add SPA rewrite rule)`)
      continue
    }
    if (!html.includes('id="root"') && !html.includes("id='root'")) {
      fail(`${path} → 200 but not the SPA shell (got a plain 404 page?)`)
      continue
    }
    pass(`${path} → 200 with SPA shell`)
  }
}

async function checkStreaming() {
  log('Chat stream arrives progressively (not one lump)')
  const started = performance.now()
  const res = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: FRONTEND_URL,
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Say hello in one short sentence.' }],
      tone: 'warm',
      name: 'friend',
    }),
  })

  if (!res.ok) {
    fail(`POST /api/chat → ${res.status}`)
    return
  }

  const reader = res.body?.getReader()
  if (!reader) {
    fail('No response body reader')
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''
  const tokenTimes = []
  let firstByteMs = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (firstByteMs === null) firstByteMs = performance.now() - started
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.trim()) continue
      const event = JSON.parse(line)
      if (event.type === 'token') {
        tokenTimes.push(performance.now() - started)
      }
    }
  }

  pass(`first byte at ${Math.round(firstByteMs ?? 0)}ms`)
  pass(`token events: ${tokenTimes.length}`)

  if (tokenTimes.length < 2) {
    fail('Fewer than 2 token events — stream may be buffered end-to-end')
    return
  }

  const spreadMs = tokenTimes[tokenTimes.length - 1] - tokenTimes[0]
  pass(`token spread: ${Math.round(spreadMs)}ms across ${tokenTimes.length} chunks`)

  if (spreadMs < 50) {
    fail('Tokens arrived in a single burst (<50ms spread) — check proxy compression/buffering')
  } else {
    pass('progressive delivery looks healthy')
  }
}

async function checkCors() {
  log('CORS allows exactly the frontend origin')
  const allowed = await fetch(`${API_URL}/api/health`, {
    headers: { Origin: FRONTEND_URL },
  })
  const allowHeader = allowed.headers.get('access-control-allow-origin')
  if (allowHeader === FRONTEND_URL) {
    pass(`Access-Control-Allow-Origin: ${allowHeader}`)
  } else {
    fail(`Expected Allow-Origin ${FRONTEND_URL}, got ${allowHeader ?? '(none)'}`)
  }

  const blocked = await fetch(`${API_URL}/api/health`, {
    headers: { Origin: 'https://evil.example' },
  })
  const blockedHeader = blocked.headers.get('access-control-allow-origin')
  if (!blockedHeader) {
    pass('wrong origin gets no Allow-Origin header')
  } else {
    fail(`wrong origin incorrectly allowed: ${blockedHeader}`)
  }
}

console.log(`\nHaven production verification`)
console.log(`  frontend: ${FRONTEND_URL}`)
console.log(`  api:      ${API_URL}`)

await checkHealth()
await checkDeepLinks()
await checkCors()
await checkStreaming()

if (process.exitCode) {
  console.error('\nSome checks failed.')
  process.exit(process.exitCode)
}
console.log('\nAll checks passed.\n')
