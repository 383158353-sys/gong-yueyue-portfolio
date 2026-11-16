import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { handleEditorRequest, resolveEditorConfig } from './editorHandler.mjs'

const TOKEN = 'local-test-token'
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

function envFor(dir) {
  return { EDITOR_ACCESS_TOKEN: TOKEN, EDITOR_STORE: 'file', EDITOR_STORE_DIR: dir, VERCEL: '' }
}

async function call(dir, { method = 'GET', action = 'draft', token = '', cookie = '', body = null }) {
  const headers = {}
  if (token) headers.authorization = `Bearer ${token}`
  if (cookie) headers.cookie = cookie
  return handleEditorRequest({
    method,
    url: `/api/editor?action=${action}`,
    headers,
    body: body ? Buffer.from(JSON.stringify(body)) : Buffer.alloc(0),
    env: envFor(dir),
  })
}

function payload(result) {
  return JSON.parse(result.body.toString('utf8'))
}

test('missing credentials fail closed', async () => {
  const closed = resolveEditorConfig({})
  assert.equal(closed.configured, false)
  const result = await handleEditorRequest({
    method: 'PUT',
    url: '/api/editor?action=draft',
    headers: {},
    body: Buffer.from('{}'),
    env: {},
  })
  assert.equal(result.status, 503)
  assert.equal(payload(result).error, 'unconfigured')
})

test('file storage is refused on Vercel even with a token', () => {
  const config = resolveEditorConfig({
    EDITOR_ACCESS_TOKEN: TOKEN,
    EDITOR_STORE: 'file',
    EDITOR_STORE_DIR: '/tmp/ignored',
    VERCEL: '1',
  })
  assert.equal(config.configured, false)
  assert.equal(config.reason, 'file_store_not_durable_on_vercel')
})

test('draft survives a new request, publish is separate, and strangers are rejected', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'editor-store-'))
  try {
    const denied = await call(dir, { method: 'GET', action: 'draft' })
    assert.equal(denied.status, 401)

    const wrong = await call(dir, { method: 'PUT', action: 'draft', token: 'nope', body: { document: {} } })
    assert.equal(wrong.status, 401)

    const session = await call(dir, { method: 'POST', action: 'session', token: TOKEN })
    assert.equal(session.status, 200)
    const setCookie = session.headers['set-cookie']
    assert.match(setCookie, /HttpOnly/)
    assert.doesNotMatch(setCookie, new RegExp(TOKEN))
    const cookie = setCookie.split(';')[0]

    const upload = await call(dir, {
      method: 'POST',
      action: 'upload',
      cookie,
      body: { mime: 'image/png', dataBase64: PNG.toString('base64') },
    })
    assert.equal(upload.status, 201)
    const mediaId = payload(upload).mediaId

    const document = {
      width: 1200,
      height: 1600,
      background: '#12080a',
      elements: [
        {
          id: 'text-marker-1',
          type: 'text',
          name: '标题',
          x: 80,
          y: 90,
          width: 480,
          height: 80,
          rotation: 0,
          opacity: 100,
          content: '草稿记号-不要出现在公开页',
          fontSize: 42,
          fontFamily: 'sans-serif',
          fontWeight: 700,
          color: '#ffffff',
          align: 'left',
          lineHeight: 1.2,
          letterSpacing: 0,
        },
        {
          id: 'image-marker-1',
          type: 'image',
          name: '小图',
          x: 80,
          y: 200,
          width: 240,
          height: 160,
          rotation: 0,
          opacity: 100,
          mediaId,
          fit: 'cover',
        },
      ],
    }
    const saved = await call(dir, { method: 'PUT', action: 'draft', cookie, body: { document } })
    assert.equal(saved.status, 200)

    const restored = payload(await call(dir, { method: 'GET', action: 'draft', cookie }))
    assert.equal(restored.document.elements[0].content, '草稿记号-不要出现在公开页')
    assert.equal(restored.document.elements[1].mediaId, mediaId)

    const beforePublish = payload(await call(dir, { method: 'GET', action: 'published' }))
    assert.equal(beforePublish.document, null)

    const publicMedia = await call(dir, { method: 'GET', action: `public-media&id=${mediaId}` })
    assert.equal(publicMedia.status, 404)

    const published = await call(dir, { method: 'POST', action: 'publish', cookie })
    assert.equal(published.status, 200)
    const after = payload(await call(dir, { method: 'GET', action: 'published' }))
    assert.equal(after.document.elements[0].content, '草稿记号-不要出现在公开页')
    const opened = await call(dir, { method: 'GET', action: `public-media&id=${mediaId}` })
    assert.equal(opened.status, 200)
    assert.equal(Buffer.compare(opened.body, PNG), 0)

    const raw = await readFile(path.join(dir, 'draft.json'), 'utf8')
    assert.match(raw, /草稿记号/)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
