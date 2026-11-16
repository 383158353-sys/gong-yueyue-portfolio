import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSite } from '../content/siteContext'
import './editor.css'

export type MediaBox = { dx: number; dy: number; width?: number; height?: number }
type MediaMap = Record<string, MediaBox>
type Corner = 'tl' | 'tr' | 'bl' | 'br'

const PAGES = [
  ['home', '首页', '/'],
  ['about', '关于', '/about'],
  ['projects', '项目', '/projects'],
  ['films', '影片', '/films'],
  ['scenes', '场景', '/scenes'],
  ['characters', '人物', '/characters'],
  ['articles', '文章', '/articles'],
] as const

const FRAME_WIDTH = 1440

const pageIdFromPath = (pathname: string) => {
  if (pathname === '/editor') return 'home'
  const id = pathname.slice('/editor/'.length)
  return PAGES.some(([key]) => key === id) ? id : 'home'
}

export const MEDIA_MAX_WIDTH = 1600
export const MEDIA_MAX_HEIGHT = 1200

export function clampMediaSize(width: number, height: number) {
  return {
    width: Math.max(48, Math.min(MEDIA_MAX_WIDTH, Math.round(width))),
    height: Math.max(36, Math.min(MEDIA_MAX_HEIGHT, Math.round(height))),
  }
}

function releaseClip(element: HTMLElement) {
  let node = element.parentElement
  while (node && node !== element.ownerDocument.body) {
    const style = getComputedStyle(node)
    if ((style.overflowX !== 'visible' || style.overflowY !== 'visible') && node.dataset.editClip == null) {
      node.dataset.editClip = `${node.style.overflow}|${node.style.overflowX}|${node.style.overflowY}`
      node.style.overflow = 'visible'
    }
    node = node.parentElement
  }
}

function restoreUnusedClips(doc: Document) {
  doc.querySelectorAll<HTMLElement>('[data-edit-clip]').forEach((node) => {
    if (node.querySelector('[data-edit-sized]')) return
    const [overflow = '', overflowX = '', overflowY = ''] = (node.dataset.editClip || '').split('|')
    node.style.overflow = overflow
    node.style.overflowX = overflowX
    node.style.overflowY = overflowY
    delete node.dataset.editClip
  })
}

export function applyMedia(doc: Document, media: MediaMap, active: boolean) {
  doc.querySelectorAll<HTMLElement>('[data-edit-id]').forEach((element) => {
    const id = element.getAttribute('data-edit-id') || ''
    const box = active ? media[id] : undefined
    const sized = Boolean(box?.width || box?.height)
    if (!box) {
      element.style.transform = ''
      element.style.width = ''
      element.style.height = ''
      element.style.maxWidth = ''
      element.style.maxHeight = ''
      element.style.minWidth = ''
      element.style.aspectRatio = ''
      delete element.dataset.editSized
      return
    }
    element.style.transform = `translate(${box.dx || 0}px, ${box.dy || 0}px)`
    if (sized) {
      element.style.maxWidth = 'none'
      element.style.maxHeight = 'none'
      element.style.minWidth = '0'
      element.style.aspectRatio = 'auto'
      element.style.boxSizing = 'border-box'
      element.dataset.editSized = 'true'
      releaseClip(element)
    }
    element.style.width = box.width ? `${box.width}px` : ''
    element.style.height = box.height ? `${box.height}px` : ''
  })
  restoreUnusedClips(doc)
}

export function visibleMediaSize(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  return { width: Math.round(rect.width), height: Math.round(rect.height) }
}

type DraftBlock = { id: string; text?: string }

function visibleText(element: HTMLElement) {
  const words = [...element.querySelectorAll('.blur-token.is-word')]
  if (words.length) return words.map((node) => node.textContent || '').join(' ')
  const chars = [...element.querySelectorAll('.blur-token.is-char')]
  if (chars.length) return chars.map((node) => node.textContent || '').join('')
  return (element.innerText || '').replace(/\s+/g, ' ').trim()
}

function CommitNumber({ label, value, onCommit }: { label: string; value: number; onCommit: (value: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null)
  const skipCommit = useRef(false)
  const shown = draft ?? String(value)
  const commit = () => {
    if (skipCommit.current) {
      skipCommit.current = false
      setDraft(null)
      return
    }
    const raw = (draft ?? String(value)).trim()
    setDraft(null)
    if (!/^-?\d+$/.test(raw) || Number(raw) === value) return
    onCommit(Number(raw))
  }
  return (
    <label>
      {label}
      <input
        type="text"
        inputMode="numeric"
        aria-label={label}
        autoComplete="off"
        spellCheck={false}
        value={shown}
        onFocus={() => setDraft((current) => current ?? String(value))}
        onChange={(event) => {
          const next = event.target.value
          if (next === '' || next === '-' || /^-?\d+$/.test(next)) setDraft(next)
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            event.currentTarget.blur()
          } else if (event.key === 'Escape') {
            event.preventDefault()
            skipCommit.current = true
            setDraft(null)
            event.currentTarget.blur()
          }
        }}
      />
    </label>
  )
}

export default function Studio() {
  const site = useSite()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const pageId = pageIdFromPath(pathname)
  const publicPath = PAGES.find(([id]) => id === pageId)?.[2] || '/'
  const frameRef = useRef<HTMLIFrameElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.6)
  const [media, setMedia] = useState<MediaMap>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [preview, setPreview] = useState(false)
  const [box, setBox] = useState<{ left: number; top: number; width: number; height: number; cssWidth: number; cssHeight: number } | null>(null)
  const mediaRef = useRef(media)
  mediaRef.current = media
  const blocksRef = useRef<DraftBlock[]>([])
  const hitRef = useRef<HTMLDivElement>(null)
  const lastTextClick = useRef({ id: '', time: 0 })

  const frameScale = () => {
    const frame = frameRef.current
    const rect = frame?.getBoundingClientRect()
    if (!frame || !rect?.width) return scale
    return rect.width / frame.offsetWidth
  }

  const applyDraftText = (doc: Document) => {
    for (const block of blocksRef.current) {
      if (typeof block.text !== 'string') continue
      const node = doc.querySelector<HTMLElement>(`[data-edit-id="${block.id}"]`)
      if (!node || node.isContentEditable) continue
      if (visibleText(node) === block.text) continue
      node.textContent = block.text
    }
  }

  const syncFrame = () => {
    const frame = frameRef.current
    const doc = frame?.contentDocument
    if (!doc) return
    applyMedia(doc, mediaRef.current, true)
    const selectedNode = selected ? doc.querySelector<HTMLElement>(`[data-edit-id="${selected}"]`) : null
    if (!selectedNode) {
      setBox(null)
      return
    }
    const rect = selectedNode.getBoundingClientRect()
    setBox({
      left: rect.left * scale,
      top: rect.top * scale,
      width: rect.width * scale,
      height: rect.height * scale,
      cssWidth: Math.round(rect.width),
      cssHeight: Math.round(rect.height),
    })
  }

  useEffect(() => {
    const labels = new Set(['水平', '垂直', '宽', '高'])
    const onPointerDown = (event: PointerEvent) => {
      const active = document.activeElement
      if (!(active instanceof HTMLInputElement) || !labels.has(active.getAttribute('aria-label') || '')) return
      if (event.target instanceof Node && active.contains(event.target)) return
      active.blur()
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [])

  useEffect(() => {
    const node = stageRef.current
    if (!node) return
    const observer = new ResizeObserver(() => setScale(Math.max(0.2, Math.min(1, (node.clientWidth - 32) / FRAME_WIDTH))))
    observer.observe(node)
    return () => observer.disconnect()
  }, [site.unlocked])

  useEffect(() => {
    if (!site.unlocked) return
    void fetch('/api/editor?action=site-draft')
      .then((response) => response.json())
      .then((payload) => {
        blocksRef.current = Array.isArray(payload.blocks) ? payload.blocks : []
        setMedia(payload.media || {})
        const doc = frameRef.current?.contentDocument
        if (doc) applyDraftText(doc)
      })
  }, [site.unlocked])

  useEffect(() => {
    const node = hitRef.current
    if (!node || preview) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const doc = frameRef.current?.contentDocument
      const win = frameRef.current?.contentWindow
      if (!doc || !win) return
      doc.documentElement.style.scrollBehavior = 'auto'
      win.scrollBy({ top: event.deltaY, left: event.deltaX, behavior: 'auto' })
      syncFrame()
    }
    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [preview, site.unlocked, selected, scale, media])

  useEffect(() => {
    const doc = frameRef.current?.contentDocument
    if (!doc) return
    doc.querySelectorAll('video').forEach((video) => { video.controls = preview })
  }, [preview, pageId])

  useEffect(() => {
    syncFrame()
  }, [media, selected, scale, pageId])

  const save = async (upload = false) => {
    const draft = await fetch('/api/editor?action=site-draft')
    const existing = await draft.json()
    const response = await fetch('/api/editor?action=site-draft', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ blocks: existing.blocks || [], pages: {}, media: mediaRef.current }),
    })
    if (!response.ok || !upload) return
    await fetch('/api/editor?action=site-publish', { method: 'POST' })
  }

  const update = (id: string, changes: Partial<MediaBox>) => {
    setMedia((current) => {
      const previous = current[id] || { dx: 0, dy: 0 }
      return { ...current, [id]: { ...previous, ...changes } }
    })
  }

  const pointerOnFrame = (event: ReactPointerEvent) => {
    const frame = frameRef.current
    if (!frame) return null
    const rect = frame.getBoundingClientRect()
    if (rect.width === 0) return null
    const liveScale = rect.width / frame.offsetWidth
    return { x: (event.clientX - rect.left) / liveScale, y: (event.clientY - rect.top) / liveScale, scale: liveScale }
  }

  const hitTarget = (doc: Document, x: number, y: number) => {
    const stack = doc.elementsFromPoint(x, y)
    for (const node of stack) {
      if (!(node instanceof doc.defaultView!.HTMLElement)) continue
      const found = node.closest<HTMLElement>('[data-edit-id]')
      if (found) return found
    }
    let best: HTMLElement | null = null
    let bestArea = Number.POSITIVE_INFINITY
    for (const element of doc.querySelectorAll<HTMLElement>('[data-edit-id]')) {
      const rect = element.getBoundingClientRect()
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) continue
      const area = rect.width * rect.height
      if (area < bestArea) {
        best = element
        bestArea = area
      }
    }
    return best
  }

  const saveText = async (id: string, text: string) => {
    const draft = await fetch('/api/editor?action=site-draft')
    const existing = await draft.json()
    const blocks: DraftBlock[] = Array.isArray(existing.blocks) ? existing.blocks : []
    const index = blocks.findIndex((block) => block.id === id)
    if (index >= 0) blocks[index] = { ...blocks[index], text }
    else blocks.push({ id, text })
    blocksRef.current = blocks
    await fetch('/api/editor?action=site-draft', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ blocks, pages: existing.pages || {}, media: mediaRef.current }),
    })
  }

  const beginTextEdit = (element: HTMLElement) => {
    const id = element.getAttribute('data-edit-id') || ''
    const original = visibleText(element)
    const originalHTML = element.innerHTML
    element.textContent = original
    element.contentEditable = 'true'
    let cancel = false
    const finish = () => {
      element.removeEventListener('blur', finish)
      element.contentEditable = 'false'
      if (cancel) {
        element.innerHTML = originalHTML
        return
      }
      const next = (element.textContent || '').replace(/\s+/g, ' ').trim()
      if (next && next !== original) void saveText(id, next)
      else element.innerHTML = originalHTML
    }
    window.setTimeout(() => {
      if (!element.isConnected) return
      element.focus()
      const selection = element.ownerDocument.getSelection()
      const range = element.ownerDocument.createRange()
      range.selectNodeContents(element)
      selection?.removeAllRanges()
      selection?.addRange(range)
      element.addEventListener('blur', finish)
    }, 0)
    element.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        cancel = true
        element.blur()
      }
    })
  }

  const startMove = (event: ReactPointerEvent) => {
    if (!site.unlocked || preview || event.button !== 0) return
    const point = pointerOnFrame(event)
    const doc = frameRef.current?.contentDocument
    if (!point || !doc) return
    const editingNode = doc.querySelector<HTMLElement>('[contenteditable="true"]')
    const target = hitTarget(doc, point.x, point.y)
    if (editingNode && editingNode !== target) editingNode.blur()
    if (!target) {
      setSelected(null)
      return
    }
    const id = target.getAttribute('data-edit-id') || ''
    const kind = target.getAttribute('data-edit-kind')
    const now = performance.now()
    if (kind === 'text' && (event.detail >= 2 || (lastTextClick.current.id === id && now - lastTextClick.current.time < 700))) {
      setSelected(id)
      beginTextEdit(target)
      lastTextClick.current = { id: '', time: 0 }
      return
    }
    lastTextClick.current = { id, time: now }
    event.preventDefault()
    setSelected(id)
    if (kind === 'text') return
    const liveScale = point.scale
    const origin = { x: event.clientX, y: event.clientY, ...(mediaRef.current[id] || { dx: 0, dy: 0 }) }
    const move = (native: PointerEvent) => {
      update(id, {
        dx: Math.round(origin.dx + (native.clientX - origin.x) / liveScale),
        dy: Math.round(origin.dy + (native.clientY - origin.y) / liveScale),
      })
    }
    const end = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
  }

  const startResize = (event: ReactPointerEvent, corner: Corner) => {
    if (!selected) return
    event.stopPropagation()
    event.preventDefault()
    const current = mediaRef.current[selected] || { dx: 0, dy: 0 }
    const node = frameRef.current?.contentDocument?.querySelector<HTMLElement>(`[data-edit-id="${selected}"]`)
    const rect = node?.getBoundingClientRect()
    const origin = {
      x: event.clientX,
      y: event.clientY,
      dx: current.dx,
      dy: current.dy,
      width: current.width || rect?.width || 120,
      height: current.height || rect?.height || 80,
    }
    const move = (native: PointerEvent) => {
    const liveScale = frameScale()
    const dx = (native.clientX - origin.x) / liveScale
    const dy = (native.clientY - origin.y) / liveScale
      let { width, height, dx: nextX, dy: nextY } = origin
      if (corner === 'br') {
        width += dx
        height += dy
      } else if (corner === 'tl') {
        width -= dx
        height -= dy
        nextX += dx
        nextY += dy
      } else if (corner === 'tr') {
        width += dx
        height -= dy
        nextY += dy
      } else {
        width -= dx
        height += dy
        nextX += dx
      }
      const size = clampMediaSize(width, height)
      update(selected, { dx: Math.round(nextX), dy: Math.round(nextY), width: size.width, height: size.height })
    }
    const end = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      const node = frameRef.current?.contentDocument?.querySelector<HTMLElement>(`[data-edit-id="${selected}"]`)
      if (!node) return
      const visible = visibleMediaSize(node)
      update(selected, visible)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
  }

  const items = () => {
    const doc = frameRef.current?.contentDocument
    if (!doc) return []
    return [...doc.querySelectorAll<HTMLElement>('[data-edit-id]')].map((element) => ({
      id: element.getAttribute('data-edit-id') || '',
      kind: element.getAttribute('data-edit-kind') === 'text' ? '字' : element.tagName === 'VIDEO' || element.classList.contains('yt-frame') ? '视频' : '图',
      name: element.getAttribute('alt') || element.getAttribute('title') || element.getAttribute('data-edit-id') || '',
    }))
  }
  const [list, setList] = useState<Array<{ id: string; kind: string; name: string }>>([])

  return (
    <div className="studio-shell">
      <header className="studio-top">
        <strong>作品集编辑</strong>
        <span>中间是现在这个页面的原排版。点照片、本地视频或 YouTube 嵌入即可拖动，四角改显示大小。导航和背景留在原处。</span>
        <button type="button" onClick={() => setPreview((value) => !value)}>{preview ? '返回编辑' : '预览播放'}</button>
        <button type="button" onClick={() => void save(false)} disabled={!site.unlocked}>保存草稿</button>
        <button type="button" onClick={() => void save(true)} disabled={!site.unlocked}>保存并上传</button>
        <Link to={publicPath}>看公开站</Link>
      </header>
      <div className="studio-body">
        <aside className="studio-side">
          <h2>页面</h2>
          {PAGES.map(([id, label]) => (
            <button key={id} type="button" className={id === pageId ? 'is-current' : ''} onClick={() => navigate(id === 'home' ? '/editor' : `/editor/${id}`)}>
              {label}
            </button>
          ))}
          <h2>这一页的媒体</h2>
          {list.map((item) => (
            <button key={item.id} type="button" className={selected === item.id ? 'is-current' : ''} onClick={() => {
              setSelected(item.id)
              const doc = frameRef.current?.contentDocument
              const win = frameRef.current?.contentWindow
              const node = doc?.querySelector<HTMLElement>(`[data-edit-id="${item.id}"]`)
              if (!doc || !win || !node) return
              doc.documentElement.style.scrollBehavior = 'auto'
              win.scrollBy({ top: node.getBoundingClientRect().top - 80, behavior: 'auto' })
            }}>
              {item.kind} {item.name}
            </button>
          ))}
        </aside>
        <div className="studio-stage" ref={stageRef}>
          <div className="studio-scroll">
            <div style={{ width: FRAME_WIDTH * scale, height: 900 * scale, position: 'relative' }}>
              <iframe
                ref={frameRef}
                title="当前页面原排版"
                src={publicPath}
                style={{ width: FRAME_WIDTH, height: 900, transform: `scale(${scale})`, transformOrigin: 'top left', border: 0, pointerEvents: preview ? 'auto' : 'none' }}
                onLoad={() => {
                  const doc = frameRef.current?.contentDocument
                  const win = frameRef.current?.contentWindow
                  if (doc) {
                    doc.documentElement.style.scrollBehavior = 'auto'
                    doc.querySelectorAll('video').forEach((video) => { video.controls = preview })
                    doc.addEventListener('scroll', syncFrame, true)
                    applyDraftText(doc)
                    window.setTimeout(() => applyDraftText(doc), 500)
                  }
                  if (win) win.scrollTo(0, 0)
                  setList(items())
                  syncFrame()
                }}
              />
              {!preview && (
                <div className="studio-hit" ref={hitRef} onPointerDown={startMove}>
                  {selected && box && (
                    <div className="studio-select" style={{ left: box.left, top: box.top, width: box.width, height: box.height }}>
                      {(['tl', 'tr', 'bl', 'br'] as Corner[]).map((corner) => (
                        <button key={corner} type="button" className={`corner ${corner}`} aria-label={`拖动调整大小 ${corner}`} onPointerDown={(event) => startResize(event, corner)} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <aside className="studio-props">
          {!site.unlocked ? (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void site.unlock()
              }}
            >
              <h2>进入编辑</h2>
              <p>页面已经是原排版。输入凭证后才能拖动和保存。</p>
              <label>
                编辑凭证
                <input type="password" value={site.token} autoComplete="current-password" onChange={(event) => site.setToken(event.target.value)} />
              </label>
              <button type="submit">进入编辑</button>
              <p role="status">{site.status}</p>
            </form>
          ) : (
            <>
              <h2>选中</h2>
              {!selected && <p>点中间画面里的照片、视频或 YouTube 区域。</p>}
              {selected && (
                <>
                  <p>{selected}</p>
                  <CommitNumber key={`${selected}-x`} label="水平" value={media[selected]?.dx ?? 0} onCommit={(next) => update(selected, { dx: Math.max(-4000, Math.min(4000, Math.round(next))) })} />
                  <CommitNumber key={`${selected}-y`} label="垂直" value={media[selected]?.dy ?? 0} onCommit={(next) => update(selected, { dy: Math.max(-4000, Math.min(4000, Math.round(next))) })} />
                  <CommitNumber key={`${selected}-w`} label="宽" value={media[selected]?.width ?? box?.cssWidth ?? 0} onCommit={(next) => update(selected, { width: Math.max(48, Math.min(MEDIA_MAX_WIDTH, Math.round(next))) })} />
                  <CommitNumber key={`${selected}-h`} label="高" value={media[selected]?.height ?? box?.cssHeight ?? 0} onCommit={(next) => update(selected, { height: Math.max(36, Math.min(MEDIA_MAX_HEIGHT, Math.round(next))) })} />
                  <p className="studio-note">Ctrl+A 后输入完整数字，Enter 或离开输入框才改画面，Esc 取消。输入过程中不会钳制。提交后宽高上限 {MEDIA_MAX_WIDTH}×{MEDIA_MAX_HEIGHT}，位置在 ±4000 内。没改过的照片和视频保持原位置。</p>
                </>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
