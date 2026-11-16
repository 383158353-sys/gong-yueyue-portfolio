import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { BlobNotFoundError, get, put } from '@vercel/blob'

const MAX_UPLOAD = 6 * 1024 * 1024
const MEDIA_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

const BLOB_PREFIX_DEFAULT = 'editor/private-canvas'

export function resolveEditorConfig(env = process.env) {
  const token = String(env.EDITOR_ACCESS_TOKEN || '')
  const storeMode = String(env.EDITOR_STORE || '')
  const dir = String(env.EDITOR_STORE_DIR || '')
  const onVercel = env.VERCEL === '1'
  const secureCookie = env.EDITOR_COOKIE_SECURE === '1' || onVercel
  if (!token) return { configured: false, reason: 'missing_token', token: '', store: null }
  if (env.BLOB_READ_WRITE_TOKEN || env.BLOB_STORE_ID) {
    return { configured: true, reason: 'vercel-blob', token, store: createBlobStore(env), secureCookie }
  }
  if (onVercel && storeMode === 'file') {
    return { configured: false, reason: 'file_store_not_durable_on_vercel', token: '', store: null }
  }
  if (!onVercel && storeMode === 'file' && dir) {
    return { configured: true, reason: 'file', token, store: createFileStore(dir), secureCookie }
  }
  return { configured: false, reason: 'missing_store', token: '', store: null }
}

function blobPath(env, name) {
  const prefix = String(env.EDITOR_BLOB_PREFIX || BLOB_PREFIX_DEFAULT).replace(/^\/+|\/+$/g, '')
  return `${prefix}/${name}`
}

function blobAuth(env) {
  if (env.BLOB_READ_WRITE_TOKEN) return { token: env.BLOB_READ_WRITE_TOKEN }
  return { storeId: env.BLOB_STORE_ID }
}

function createBlobStore(env) {
  const auth = blobAuth(env)
  const read = async (pathname) => {
    try {
      return await get(pathname, { access: 'private', useCache: false, ...auth })
    } catch (error) {
      if (error instanceof BlobNotFoundError || error?.name === 'BlobNotFoundError') return null
      throw error
    }
  }
  const bodyBuffer = async (result) => {
    if (!result?.stream) return null
    return Buffer.from(await new Response(result.stream).arrayBuffer())
  }
  return {
    kind: 'vercel-blob',
    async read(name) {
      const result = await read(blobPath(env, name))
      if (!result?.stream) return null
      return JSON.parse((await bodyBuffer(result)).toString('utf8'))
    },
    async write(name, value) {
      await put(blobPath(env, name), JSON.stringify(value), {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
        ...auth,
      })
    },
    async saveMedia(id, buffer, mime) {
      await put(blobPath(env, `media/${id}`), buffer, {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: mime,
        ...auth,
      })
    },
    async readMedia(id) {
      const result = await read(blobPath(env, `media/${id}`))
      const buffer = await bodyBuffer(result)
      if (!buffer) return null
      return { mime: result.blob?.contentType || 'application/octet-stream', buffer }
    },
  }
}

function createFileStore(dir) {
  const file = async (name) => path.join(dir, name)
  return {
    kind: 'file',
    directory: dir,
    async read(name) {
      try {
        return JSON.parse(await readFile(await file(name), 'utf8'))
      } catch (error) {
        if (error && error.code === 'ENOENT') return null
        throw error
      }
    },
    async write(name, value) {
      await mkdir(dir, { recursive: true })
      const target = await file(name)
      const temporary = `${target}.${process.pid}.tmp`
      await writeFile(temporary, JSON.stringify(value))
      await rename(temporary, target)
    },
    async saveMedia(id, buffer, mime) {
      const folder = path.join(dir, 'media')
      await mkdir(folder, { recursive: true })
      await writeFile(path.join(folder, id), buffer)
      await writeFile(path.join(folder, `${id}.json`), JSON.stringify({ mime }))
    },
    async readMedia(id) {
      try {
        const meta = JSON.parse(await readFile(path.join(dir, 'media', `${id}.json`), 'utf8'))
        const buffer = await readFile(path.join(dir, 'media', id))
        return { mime: meta.mime, buffer }
      } catch (error) {
        if (error && error.code === 'ENOENT') return null
        throw error
      }
    },
  }
}

function header(headers, name) {
  if (!headers) return ''
  const wanted = name.toLowerCase()
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === wanted) {
      const value = headers[key]
      return Array.isArray(value) ? value.join(';') : String(value ?? '')
    }
  }
  return ''
}

function bearer(headers) {
  const match = /^Bearer\s+(\S+)\s*$/i.exec(header(headers, 'authorization'))
  return match ? match[1] : ''
}

function cookie(headers, name) {
  const parts = header(headers, 'cookie').split(';')
  for (const part of parts) {
    const index = part.indexOf('=')
    if (index === -1) continue
    if (part.slice(0, index).trim() === name) return decodeURIComponent(part.slice(index + 1).trim())
  }
  return ''
}

function sameSecret(left, right) {
  const a = Buffer.from(String(left))
  const b = Buffer.from(String(right))
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

function sessionValue(token) {
  return createHmac('sha256', token).update('portfolio-editor-session-v1').digest('hex')
}

function sessionCookie(token, secure) {
  const flags = ['HttpOnly', 'SameSite=Lax', 'Path=/api/editor', 'Max-Age=43200']
  if (secure) flags.push('Secure')
  return `portfolio_editor_session=${sessionValue(token)}; ${flags.join('; ')}`
}

function json(status, payload, extraHeaders = {}) {
  return {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extraHeaders },
    body: Buffer.from(JSON.stringify(payload)),
  }
}

function numberIn(value, min, max) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
}

function validateDocument(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('invalid_document')
  if (!numberIn(input.width, 320, 4000) || !numberIn(input.height, 320, 8000)) throw new Error('invalid_document')
  if (typeof input.background !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(input.background)) throw new Error('invalid_document')
  if (!Array.isArray(input.elements) || input.elements.length > 80) throw new Error('invalid_document')
  const elements = input.elements.map((element) => {
    if (!element || typeof element.id !== 'string' || element.id.length < 8 || element.id.length > 80) throw new Error('invalid_document')
    if (element.type !== 'image' && element.type !== 'text') throw new Error('invalid_document')
    if (typeof element.name !== 'string' || element.name.length > 120) throw new Error('invalid_document')
    if (!numberIn(element.x, -2000, 8000) || !numberIn(element.y, -2000, 8000)) throw new Error('invalid_document')
    if (!numberIn(element.width, 20, 4000) || !numberIn(element.height, 20, 4000)) throw new Error('invalid_document')
    if (!numberIn(element.rotation, -360, 360) || !numberIn(element.opacity, 0, 100)) throw new Error('invalid_document')
    const next = {
      id: element.id,
      type: element.type,
      name: element.name,
      x: Math.round(element.x),
      y: Math.round(element.y),
      width: Math.round(element.width),
      height: Math.round(element.height),
      rotation: element.rotation,
      opacity: element.opacity,
    }
    if (element.type === 'image') {
      if (typeof element.mediaId !== 'string' || !MEDIA_ID.test(element.mediaId)) throw new Error('invalid_document')
      next.mediaId = element.mediaId
      next.fit = element.fit === 'contain' ? 'contain' : 'cover'
    } else {
      if (typeof element.content !== 'string' || element.content.length > 2000) throw new Error('invalid_document')
      next.content = element.content
      next.fontSize = numberIn(element.fontSize, 8, 240) ? element.fontSize : 32
      next.fontFamily = typeof element.fontFamily === 'string' && element.fontFamily.length <= 160 ? element.fontFamily : 'sans-serif'
      next.fontWeight = numberIn(element.fontWeight, 300, 800) ? element.fontWeight : 400
      next.color = typeof element.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(element.color) ? element.color : '#ffffff'
      next.align = element.align === 'center' || element.align === 'right' ? element.align : 'left'
      next.lineHeight = numberIn(element.lineHeight, 0.6, 3) ? element.lineHeight : 1.2
      next.letterSpacing = numberIn(element.letterSpacing, -15, 40) ? element.letterSpacing : 0
    }
    return next
  })
  return { width: input.width, height: input.height, background: input.background, elements }
}

function usesMedia(document, id) {
  return Boolean(document && Array.isArray(document.elements) && document.elements.some((element) => element.mediaId === id))
}

function authorize(headers, config) {
  const presented = bearer(headers)
  const session = cookie(headers, 'portfolio_editor_session')
  const bearerOk = Boolean(presented) && sameSecret(presented, config.token)
  const cookieOk = Boolean(session) && sameSecret(session, sessionValue(config.token))
  return { bearerOk, ok: bearerOk || cookieOk }
}

export async function handleEditorRequest({ method, url, headers, body, env }) {
  const config = resolveEditorConfig(env)
  const action = new URL(url, 'http://editor.local').searchParams.get('action') || ''
  const upper = String(method || 'GET').toUpperCase()

  if (upper === 'GET' && action === 'status') {
    return json(200, { configured: config.configured, storage: config.configured ? config.reason : 'none' })
  }

  if (upper === 'GET' && action === 'published') {
    if (!config.configured) return json(200, { configured: false, document: null })
    return json(200, { configured: true, document: await config.store.read('published.json') })
  }

  if (upper === 'GET' && action === 'site-published') {
    if (!config.configured) return json(200, { configured: false, blocks: [], pages: {} })
    const document = await config.store.read('site-published.json')
    return json(200, { configured: true, blocks: document?.blocks || [], pages: document?.pages || {} })
  }

  if (upper === 'GET' && action === 'public-media') {
    if (!config.configured) return json(404, { error: 'not_found' })
    const id = new URL(url, 'http://editor.local').searchParams.get('id') || ''
    if (!MEDIA_ID.test(id)) return json(404, { error: 'not_found' })
    const published = await config.store.read('published.json')
    if (!usesMedia(published, id)) return json(404, { error: 'not_found' })
    const media = await config.store.readMedia(id)
    if (!media) return json(404, { error: 'not_found' })
    return { status: 200, headers: { 'content-type': media.mime, 'cache-control': 'public, max-age=300' }, body: media.buffer }
  }

  if (!config.configured) return json(503, { error: 'unconfigured', reason: config.reason })
  const auth = authorize(headers, config)

  if (upper === 'POST' && action === 'session') {
    if (!auth.bearerOk) return json(401, { error: 'unauthorized' })
    return json(200, { ok: true }, { 'set-cookie': sessionCookie(config.token, config.secureCookie) })
  }

  if (!auth.ok) return json(401, { error: 'unauthorized' })

  if (upper === 'GET' && action === 'draft') {
    return json(200, { document: await config.store.read('draft.json') })
  }

  if (upper === 'PUT' && action === 'draft') {
    let payload
    try {
      payload = JSON.parse(Buffer.from(body || '').toString('utf8') || '{}')
    } catch {
      return json(400, { error: 'invalid_json' })
    }
    let document
    try {
      document = validateDocument(payload.document)
    } catch {
      return json(400, { error: 'invalid_document' })
    }
    for (const element of document.elements) {
      if (element.mediaId && !(await config.store.readMedia(element.mediaId))) return json(400, { error: 'missing_media' })
    }
    await config.store.write('draft.json', document)
    return json(200, { ok: true })
  }

  if (upper === 'POST' && action === 'upload') {
    let payload
    try {
      payload = JSON.parse(Buffer.from(body || '').toString('utf8') || '{}')
    } catch {
      return json(400, { error: 'invalid_json' })
    }
    if (!ALLOWED_MIME.has(payload.mime)) return json(400, { error: 'unsupported_type' })
    let buffer
    try {
      buffer = Buffer.from(String(payload.dataBase64 || ''), 'base64')
    } catch {
      return json(400, { error: 'invalid_file' })
    }
    if (!buffer.length || buffer.length > MAX_UPLOAD) return json(400, { error: 'invalid_file' })
    const mediaId = randomUUID()
    await config.store.saveMedia(mediaId, buffer, payload.mime)
    return json(201, { mediaId, url: `/api/editor?action=media&id=${mediaId}` })
  }

  if (upper === 'GET' && action === 'media') {
    const id = new URL(url, 'http://editor.local').searchParams.get('id') || ''
    if (!MEDIA_ID.test(id)) return json(404, { error: 'not_found' })
    const media = await config.store.readMedia(id)
    if (!media) return json(404, { error: 'not_found' })
    return { status: 200, headers: { 'content-type': media.mime, 'cache-control': 'private, no-store' }, body: media.buffer }
  }

  if (upper === 'POST' && action === 'publish') {
    const draft = await config.store.read('draft.json')
    if (!draft) return json(400, { error: 'no_draft' })
    await config.store.write('published.json', draft)
    return json(200, { ok: true })
  }

  if (upper === 'GET' && action === 'site-draft') {
    const document = await config.store.read('site-draft.json')
    return json(200, { blocks: document?.blocks || [], pages: document?.pages || {} })
  }

  if (upper === 'PUT' && action === 'site-draft') {
    let payload
    try {
      payload = JSON.parse(Buffer.from(body || '').toString('utf8') || '{}')
    } catch {
      return json(400, { error: 'invalid_json' })
    }
    let document
    try {
      document = validateSite(payload)
    } catch {
      return json(400, { error: 'invalid_document' })
    }
    await config.store.write('site-draft.json', document)
    return json(200, { ok: true })
  }

  if (upper === 'POST' && action === 'site-publish') {
    const draft = await config.store.read('site-draft.json')
    if (!draft) return json(400, { error: 'no_draft' })
    await config.store.write('site-published.json', draft)
    return json(200, { ok: true })
  }

  if (upper === 'POST' && action === 'site-rollback') {
    await config.store.write('site-published.json', { blocks: [] })
    return json(200, { ok: true })
  }

  return json(404, { error: 'not_found' })
}

const SITE_ID = /^[a-z0-9-]{3,80}$/

function validateSite(input) {
  if (!input || !Array.isArray(input.blocks) || input.blocks.length > 400) throw new Error('invalid_document')
  const blocks = input.blocks.map((block) => {
    if (!block || !SITE_ID.test(block.id || '')) throw new Error('invalid_document')
    const next = { id: block.id }
    if (block.text != null) {
      if (typeof block.text !== 'string' || block.text.length > 2000) throw new Error('invalid_document')
      next.text = block.text
    }
    if (block.extra != null) {
      if (typeof block.extra !== 'string' || block.extra.length > 500) throw new Error('invalid_document')
      next.extra = block.extra
    }
    if (block.detail != null) {
      if (typeof block.detail !== 'string' || block.detail.length > 2000) throw new Error('invalid_document')
      next.detail = block.detail
    }
    if (block.order != null) {
      if (!Number.isInteger(block.order) || block.order < 0 || block.order > 500) throw new Error('invalid_document')
      next.order = block.order
    }
    if (block.align != null) {
      if (!['left', 'center', 'right'].includes(block.align)) throw new Error('invalid_document')
      next.align = block.align
    }
    if (block.fontSize != null) {
      if (typeof block.fontSize !== 'number' || block.fontSize < 12 || block.fontSize > 120) throw new Error('invalid_document')
      next.fontSize = block.fontSize
    }
    if (block.fontWeight != null) {
      if (![400, 700].includes(block.fontWeight)) throw new Error('invalid_document')
      next.fontWeight = block.fontWeight
    }
    if (block.color != null) {
      if (typeof block.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(block.color)) throw new Error('invalid_document')
      next.color = block.color
    }
    if (block.imageScale != null) {
      if (typeof block.imageScale !== 'number' || block.imageScale < 0.6 || block.imageScale > 1.6) throw new Error('invalid_document')
      next.imageScale = Math.round(block.imageScale * 100) / 100
    }
    for (const key of ['x', 'y', 'width', 'height']) {
      if (block[key] != null) {
        if (typeof block[key] !== 'number' || !Number.isFinite(block[key]) || block[key] < -400 || block[key] > 8000) throw new Error('invalid_document')
        next[key] = Math.round(block[key])
      }
    }
    if (block.hidden != null) {
      if (typeof block.hidden !== 'boolean') throw new Error('invalid_document')
      next.hidden = block.hidden
    }
    return next
  })
  return { blocks, pages: validatePages(input.pages) }
}

const PAGE_KEYS = ['home', 'about', 'projects', 'films', 'scenes', 'characters', 'articles']
const ASSET_URL = /^\/assets\/[a-z0-9./_-]+$/

function validatePages(input) {
  if (input == null) return {}
  if (typeof input !== 'object' || Array.isArray(input)) throw new Error('invalid_document')
  const pages = {}
  for (const key of Object.keys(input)) {
    if (!PAGE_KEYS.includes(key)) throw new Error('invalid_document')
    const page = input[key]
    if (!page || !Array.isArray(page.elements) || page.elements.length > 240) throw new Error('invalid_document')
    const width = Number(page.width)
    const height = Number(page.height)
    if (!Number.isFinite(width) || width < 320 || width > 4000) throw new Error('invalid_document')
    if (!Number.isFinite(height) || height < 240 || height > 12000) throw new Error('invalid_document')
    pages[key] = {
      width: Math.round(width),
      height: Math.round(height),
      elements: page.elements.map((element) => {
        if (!element || !SITE_ID.test(element.id || '')) throw new Error('invalid_document')
        if (!['image', 'video', 'text'].includes(element.type)) throw new Error('invalid_document')
        const next = {
          id: element.id,
          type: element.type,
          name: typeof element.name === 'string' ? element.name.slice(0, 80) : element.id,
          x: num(element.x, -2000, 12000),
          y: num(element.y, -2000, 12000),
          width: num(element.width, 24, 4000),
          height: num(element.height, 24, 4000),
        }
        if (element.url != null) {
          if (typeof element.url !== 'string' || !ASSET_URL.test(element.url) || element.url.includes('..')) throw new Error('invalid_document')
          next.url = element.url
        }
        if (element.text != null) {
          if (typeof element.text !== 'string' || element.text.length > 2000) throw new Error('invalid_document')
          next.text = element.text
        }
        if (element.fit != null) {
          if (!['cover', 'contain'].includes(element.fit)) throw new Error('invalid_document')
          next.fit = element.fit
        }
        if (element.fontSize != null) next.fontSize = num(element.fontSize, 12, 120)
        return next
      }),
    }
  }
  return pages
}

function num(value, min, max) {
  const number = Number(value)
  if (!Number.isFinite(number) || number < min || number > max) throw new Error('invalid_document')
  return Math.round(number)
}

export async function handleNodeRequest(req, res, env = process.env) {
  const chunks = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  const result = await handleEditorRequest({
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: Buffer.concat(chunks),
    env,
  })
  res.statusCode = result.status
  for (const [key, value] of Object.entries(result.headers)) res.setHeader(key, value)
  res.end(result.body)
}
