import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const base = process.env.SITE_URL || 'http://127.0.0.1:4173'
const outDir = process.env.SHOT_DIR || '/opt/cursor/artifacts/personal-site'
const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome'

const routes = [
  { path: '/', name: 'home', heading: '龚玥月' },
  { path: '/about', name: 'about', heading: '关于' },
  { path: '/projects', name: 'projects', heading: '项目' },
  { path: '/films', name: 'films', heading: '影片' },
  { path: '/scenes', name: 'scenes', heading: '场景' },
  { path: '/characters', name: 'characters', heading: '人物' },
  { path: '/articles', name: 'articles', heading: '文章' },
]

const report = {
  base,
  routes: [],
  images: [],
  youtube: {},
  overflow: [],
  failures: [],
}

function fail(message) {
  report.failures.push(message)
  console.error('FAIL', message)
}

async function setField(page, selector, value) {
  await page.focus(selector)
  await page.evaluate((target, next) => {
    const node = document.querySelector(target)
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(node), 'value')?.set
    setter?.call(node, next)
    node.dispatchEvent(new Event('input', { bubbles: true }))
  }, selector, value)
}

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  protocolTimeout: 180000,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
})

await mkdir(outDir, { recursive: true })

async function checkPage(page, route, viewport) {
  const response = await page.goto(`${base}${route.path}`, { waitUntil: 'load', timeout: 30000 })
  await page.waitForSelector('h1')
  const status = response?.status() ?? 0
  const heading = await page.$eval('h1', (node) => node.textContent?.trim() || '')
  const navCount = await page.$$eval('header nav a', (nodes) => nodes.length)
  const footerNav = await page.$$eval('footer a', (nodes) => nodes.map((node) => node.textContent?.trim() || ''))
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  const images = await page.$$eval('img', (nodes) =>
    nodes.map((node) => ({
      src: node.getAttribute('src') || '',
      width: node.naturalWidth,
      complete: node.complete,
    })),
  )
  const broken = images.filter((image) => !image.complete || image.width === 0)
  if (status !== 200 && status !== 304) fail(`${viewport} ${route.path} status ${status}`)
  if (heading !== route.heading) fail(`${viewport} ${route.path} heading ${heading}`)
  if (navCount !== 7) fail(`${viewport} ${route.path} nav count ${navCount}`)
  if (footerNav.length) fail(`${viewport} ${route.path} footer repeated links`)
  if (metrics.scrollWidth > metrics.clientWidth + 1) {
    fail(`${viewport} ${route.path} horizontal overflow ${metrics.scrollWidth}>${metrics.clientWidth}`)
  }
  if (route.path === '/' ) {
    const hiddenNav = await page.$$eval('header nav a', (nodes) =>
      nodes
        .filter((node) => {
          const rect = node.getBoundingClientRect()
          return rect.right > window.innerWidth + 1 || rect.left < 0
        })
        .map((node) => node.textContent?.trim() || ''),
    )
    if (hiddenNav.length) fail(`${viewport} nav clipped: ${hiddenNav.join('、')}`)
  }
  for (const image of broken) fail(`${viewport} ${route.path} broken image ${image.src}`)
  const file = path.join(outDir, `${route.name}-${viewport}.png`)
  await page.screenshot({ path: file, fullPage: true })
  report.routes.push({ viewport, path: route.path, status, heading, navCount, overflow: metrics, screenshot: file, imageCount: images.length })
  report.overflow.push({ viewport, path: route.path, ...metrics })
  report.images.push(...images.map((image) => ({ ...image, viewport, path: route.path })))
}

try {
  const desktop = await browser.newPage()
  await desktop.setViewport({ width: 1440, height: 900 })
  for (const route of routes) await checkPage(desktop, route, '1440')

  const mobile = await browser.newPage()
  await mobile.setViewport({ width: 390, height: 844 })
  for (const route of routes) await checkPage(mobile, route, '390')

  console.log('youtube: open home')
  const flow = await browser.newPage()
  await flow.setViewport({ width: 1440, height: 900 })
  await flow.goto(`${base}/`, { waitUntil: 'domcontentloaded' })
  console.log('youtube: click films')
  await Promise.all([
    flow.waitForFunction(() => location.pathname === '/films', { timeout: 15000 }),
    flow.click('header nav a[href="/films"]'),
  ])
  console.log('youtube: films open')
  const momImages = await flow.$$eval('#mom img', (nodes) => nodes.length)
  if (momImages) fail(`《我妈没把我养好》 rendered ${momImages} images`)
  const clickedHeading = await flow.$eval('h1', (node) => node.textContent?.trim())
  if (clickedHeading !== '影片') fail(`nav click landed on ${clickedHeading}`)
  report.youtube.navClick = clickedHeading

  console.log('youtube: invalid url')
  await setField(flow, 'input[name="youtube-url"]', 'https://vimeo.com/123')
  await flow.click('form button[type="submit"]')
  await flow.waitForSelector('.form-error')
  const invalidText = await flow.$eval('.form-error', (node) => node.textContent?.trim() || '')
  const iframesAfterInvalid = await flow.$$eval('iframe', (nodes) => nodes.length)
  if (!invalidText.includes('不是可识别')) fail(`invalid message: ${invalidText}`)
  if (iframesAfterInvalid !== 0) fail('invalid input created an iframe')

  await setField(flow, 'input[name="youtube-url"]', 'https://youtu.be/abcdefghijk')
  await setField(flow, 'input[name="youtube-title"]', '本机回归')
  await flow.select('select[name="youtube-film"]', 'residual')
  await flow.click('form button[type="submit"]')
  await flow.waitForSelector('[data-local-video="abcdefghijk"] iframe')
  const localSrc = await flow.$eval('[data-local-video="abcdefghijk"] iframe', (node) => node.getAttribute('src') || '')
  if (!localSrc.startsWith('https://www.youtube-nocookie.com/embed/abcdefghijk')) fail(`embed src ${localSrc}`)
  const localClaim = await flow.$eval('[data-video-id="abcdefghijk"]', (node) => node.getAttribute('data-playback-claim'))
  const localStatus = await flow.$eval('[data-video-id="abcdefghijk"] [role="status"]', (node) => node.textContent || '')
  if (localStatus.includes('已返回正在播放')) fail('local player claimed playback before YouTube did')

  await flow.reload({ waitUntil: 'load' })
  await flow.waitForSelector('[data-local-video="abcdefghijk"]')
  const persisted = await flow.$eval('[data-local-video="abcdefghijk"] h2, [data-local-video="abcdefghijk"]', () => true).catch(() => false)
  const stillThere = await flow.$('[data-local-video="abcdefghijk"]')
  if (!stillThere) fail('local entry did not survive reload')

  await setField(flow, 'input[name="youtube-url"]', 'https://www.youtube.com/watch?v=abcdefghijk')
  await flow.click('form button[type="submit"]')
  const duplicateText = await flow.$eval('.form-error', (node) => node.textContent?.trim() || '')
  if (!duplicateText.includes('已经在本机列表')) fail(`duplicate message: ${duplicateText}`)

  await setField(flow, 'input[name="youtube-url"]', 'https://www.youtube.com/shorts/M7lc1UVf-VE')
  await flow.click('form button[type="submit"]')
  const testImportText = await flow.$eval('.form-error', (node) => node.textContent?.trim() || '')
  if (!testImportText.includes('功能测试片')) fail(`test import message: ${testImportText}`)
  const stored = await flow.evaluate(() => localStorage.getItem('gong-yueyue-local-youtube-v1'))
  if (stored?.includes('M7lc1UVf-VE')) fail('functional test id was written into local library')
  const publicTestIframe = await flow.$$eval('article[data-film-scope="public"] iframe', (nodes) =>
    nodes.map((node) => node.getAttribute('src') || '').filter((src) => src.includes('M7lc1UVf-VE')),
  )
  if (publicTestIframe.length) fail('functional test iframe mixed into a public work')

  await flow.click('.functional-test button')
  await flow.waitForSelector('[data-functional-test="loaded"] iframe')
  const testSrc = await flow.$eval('[data-functional-test="loaded"] iframe', (node) => node.getAttribute('src') || '')
  if (!testSrc.startsWith('https://www.youtube-nocookie.com/embed/M7lc1UVf-VE')) fail(`test src ${testSrc}`)
  await new Promise((resolve) => setTimeout(resolve, 9000))
  const testClaim = await flow.$eval('[data-functional-test="loaded"] [data-playback-claim]', (node) => node.getAttribute('data-playback-claim'))
  const testStatus = await flow.$eval('[data-functional-test="loaded"] [role="status"]', (node) => node.textContent || '')
  if (testClaim === 'none') fail('test player never left the initial claim')
  if (testStatus.includes('已返回正在播放') && testClaim !== 'playing') fail('playing text without playing claim')
  await flow.screenshot({ path: path.join(outDir, 'films-1440-youtube.png'), fullPage: true })

  report.youtube = {
    ...report.youtube,
    invalidText,
    iframesAfterInvalid,
    localSrc,
    localClaim,
    localStatus,
    persisted: Boolean(persisted && stillThere),
    duplicateText,
    testImportText,
    stored,
    testSrc,
    testClaim,
    testStatus,
  }

  await mobile.setViewport({ width: 390, height: 844 })
  await mobile.goto(`${base}/films`, { waitUntil: 'load' })
  await mobile.waitForSelector('.embed-frame')
  const mobileFrame = await mobile.$eval('.embed-frame', (node) => {
    const rect = node.getBoundingClientRect()
    return { width: rect.width, height: rect.height, ratio: rect.width / rect.height }
  })
  if (mobileFrame.width > 390) fail(`mobile embed wider than viewport ${mobileFrame.width}`)
  if (Math.abs(mobileFrame.ratio - 16 / 9) > 0.08) fail(`mobile embed ratio ${mobileFrame.ratio}`)
  report.youtube.mobileFrame = mobileFrame
  await mobile.screenshot({ path: path.join(outDir, 'films-390-player.png'), fullPage: false })
} catch (error) {
  fail(error instanceof Error ? error.stack || error.message : String(error))
} finally {
  await browser.close()
  const reportPath = path.join(outDir, 'verify-report.json')
  await writeFile(reportPath, JSON.stringify(report, null, 2))
  console.log(JSON.stringify({ failures: report.failures, reportPath, youtube: report.youtube }, null, 2))
  if (report.failures.length) process.exit(1)
}
