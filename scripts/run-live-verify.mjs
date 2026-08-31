/**
 * Spin up a production-like stack behind public HTTPS tunnels, then run verify + Lighthouse.
 * Useful when you do not have Render/Vercel URLs yet.
 */
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import localtunnel from 'localtunnel'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function run(cmd, args, env = {}) {
  return spawn(cmd, args, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  })
}

function waitForHttp(url, attempts = 40) {
  return new Promise((resolve, reject) => {
    let n = 0
    const tick = async () => {
      try {
        const res = await fetch(url)
        if (res.ok || res.status === 404) return resolve()
      } catch {
        /* retry */
      }
      if (++n >= attempts) return reject(new Error(`Timed out waiting for ${url}`))
      setTimeout(tick, 500)
    }
    tick()
  })
}

function startStaticSpa(port) {
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://localhost:${port}`)
    let filePath = path.join(root, 'dist', url.pathname === '/' ? 'index.html' : url.pathname)
    try {
      let data = await readFile(filePath)
      const ext = path.extname(filePath)
      const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' }
      res.writeHead(200, { 'Content-Type': types[ext] ?? 'application/octet-stream' })
      res.end(data)
    } catch {
      const fallback = await readFile(path.join(root, 'dist', 'index.html'))
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(fallback)
    }
  }).listen(port)
}

console.log('Starting API…')
const api = run('npm', ['start'], { NODE_ENV: 'production', PORT: '3001' })
api.stdout.on('data', (d) => process.stdout.write(`[api] ${d}`))
api.stderr.on('data', (d) => process.stderr.write(`[api] ${d}`))
await waitForHttp('http://127.0.0.1:3001/api/health')

const apiTunnel = await localtunnel({ port: 3001 })
const API_URL = apiTunnel.url.replace(/\/$/, '')
console.log(`API tunnel: ${API_URL}`)

console.log('Building frontend with VITE_API_URL…')
const build = run('npm', ['run', 'build'], { VITE_API_URL: API_URL })
await new Promise((resolve, reject) => {
  build.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`build failed ${code}`))))
})

const staticPort = 4173
const staticServer = startStaticSpa(staticPort)
await waitForHttp(`http://127.0.0.1:${staticPort}/`)

const appTunnel = await localtunnel({ port: staticPort })
const FRONTEND_URL = appTunnel.url.replace(/\/$/, '')
console.log(`App tunnel: ${FRONTEND_URL}`)

api.kill()
await new Promise((r) => setTimeout(r, 800))
console.log('Restarting API with FRONTEND_ORIGIN…')
const api2 = run('npm', ['start'], {
  NODE_ENV: 'production',
  PORT: '3001',
  FRONTEND_ORIGIN: FRONTEND_URL,
  APP_PUBLIC_URL: FRONTEND_URL,
})
api2.stdout.on('data', (d) => process.stdout.write(`[api] ${d}`))
await waitForHttp('http://127.0.0.1:3001/api/health')

const verify = run('node', ['scripts/verify-production.mjs'], { FRONTEND_URL, API_URL })
verify.stdout.pipe(process.stdout)
verify.stderr.pipe(process.stderr)
await new Promise((resolve) => verify.on('close', resolve))

const lh = run('node', ['scripts/lighthouse.mjs'], { FRONTEND_URL })
lh.stdout.pipe(process.stdout)
lh.stderr.pipe(process.stderr)
await new Promise((resolve) => lh.on('close', resolve))

console.log('\n--- Live URLs for manual phone check ---')
console.log(`Frontend: ${FRONTEND_URL}`)
console.log(`API:      ${API_URL}/api/health`)
console.log('Open the frontend URL on your phone while this process runs.\n')

process.on('SIGINT', () => process.exit(0))
// Keep tunnels alive for manual phone testing
setInterval(() => {}, 60_000)
