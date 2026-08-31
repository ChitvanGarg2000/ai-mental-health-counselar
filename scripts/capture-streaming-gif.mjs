/**
 * Capture a README demo GIF of a streaming reply (mobile viewport).
 *
 * Usage (preview + API must already be running):
 *   FRONTEND_URL=http://localhost:4173 node scripts/capture-streaming-gif.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { GIFEncoder, quantize, applyPalette } from 'gifenc'
import { PNG } from 'pngjs'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FRONTEND_URL = (process.env.FRONTEND_URL ?? 'http://localhost:4173').replace(/\/$/, '')
const OUT_DIR = path.join(__dirname, '..', 'docs')
const OUT_GIF = path.join(OUT_DIR, 'streaming-demo.gif')

await mkdir(OUT_DIR, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
})

console.log(`Opening ${FRONTEND_URL}/chat …`)
await page.goto(`${FRONTEND_URL}/chat`, { waitUntil: 'domcontentloaded' })

const composer = page.locator('textarea').first()
await composer.waitFor({ timeout: 10000 })
await composer.fill('I had a rough day at work.')
await composer.press('Enter')

await page.waitForTimeout(800)

const frames = []
const frameCount = 22
const intervalMs = 200
const targetW = 390
const targetH = 700

for (let i = 0; i < frameCount; i++) {
  const buf = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 390, height: 700 } })
  frames.push(buf)
  await page.waitForTimeout(intervalMs)
}

await browser.close()

const gif = GIFEncoder()

for (const frame of frames) {
  const png = PNG.sync.read(frame)
  const { width, height, data } = png
  const palette = quantize(data, 256)
  const index = applyPalette(data, palette)
  gif.writeFrame(index, width, height, { palette, delay: intervalMs })
}

gif.finish()
await writeFile(OUT_GIF, Buffer.from(gif.bytes()))
console.log(`Saved ${OUT_GIF} (${frames.length} frames, ${targetW}×${targetH})`)
