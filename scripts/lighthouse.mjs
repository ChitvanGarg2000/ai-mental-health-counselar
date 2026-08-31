/**
 * Run Lighthouse (performance + accessibility) against the live frontend.
 *
 * Usage:
 *   FRONTEND_URL=https://app.example.com node scripts/lighthouse.mjs
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FRONTEND_URL = process.env.FRONTEND_URL?.replace(/\/$/, '')

if (!FRONTEND_URL) {
  console.error('Set FRONTEND_URL (no trailing slash).')
  process.exit(1)
}

const outDir = path.join(__dirname, '..', 'reports', 'lighthouse')
await mkdir(outDir, { recursive: true })

const chromePath =
  process.env.CHROME_PATH ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const routes = [
  { name: 'home', url: FRONTEND_URL },
  { name: 'journal', url: `${FRONTEND_URL}/journal` },
  { name: 'help', url: `${FRONTEND_URL}/help` },
]

function runLighthouse(url, outputPath) {
  return new Promise((resolve, reject) => {
    const args = [
      url,
      '--chrome-flags=--headless=new',
      `--chrome-path=${chromePath}`,
      '--only-categories=performance,accessibility',
      '--form-factor=mobile',
      '--screenEmulation.mobile=true',
      '--output=json',
      `--output-path=${outputPath}`,
      '--quiet',
    ]
    const child = spawn('npx', ['lighthouse', ...args], {
      stdio: 'inherit',
      shell: true,
    })
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`lighthouse exit ${code}`))))
  })
}

const summary = []

for (const route of routes) {
  const outputPath = path.join(outDir, `${route.name}.json`)
  console.log(`\nLighthouse (mobile): ${route.url}`)
  await runLighthouse(route.url, outputPath)
  const report = JSON.parse(await readFile(outputPath, 'utf8'))
  const perf = Math.round((report.categories.performance?.score ?? 0) * 100)
  const a11y = Math.round((report.categories.accessibility?.score ?? 0) * 100)
  summary.push({ route: route.name, performance: perf, accessibility: a11y })
  console.log(`  performance: ${perf}  accessibility: ${a11y}`)
}

await writeFile(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2))
console.log(`\nReports saved to ${outDir}`)
