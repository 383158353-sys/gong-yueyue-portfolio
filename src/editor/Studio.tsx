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

export function applyMedia(doc: Document, media: MediaMap, active: boolean) {
  doc.querySelectorAll<HTMLElement>('[data-edit-id]').forEach((element) => {
    const id = element.getAttribute('data-edit-id') || ''
    const box = active ? media[id] : undefined
    if (!box) {
      element.style.transform = ''
      element.style.width = ''
      element.style.height = ''
      return
    }
    element.style.transform = `translate(${box.dx || 0}px, ${box.dy || 0}px)`
    element.style.width = box.width ? `${box.width}px` : ''
    element.style.height = box.height ? `${box.height}px` : ''
  })
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
  const [box, setBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null)
  const mediaRef = useRef(media)
  mediaRef.current = media

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
    setBox({ left: rect.left * scale, top: rect.top * scale, width: rect.width * scale, height: rect.height * scale })
  }

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
      .then((payload) => setMedia(payload.media || {}))
  }, [site.unlocked])

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
    const rect = frame?.getBoundingClientRect()
    if (!rect) return null
    return { x: (event.clientX - rect.left) / scale, y: (event.clientY - rect.top) / scale }
  }

  const startMove = (event: ReactPointerEvent) => {
    if (!site.unlocked || preview || event.button !== 0) return
    const point = pointerOnFrame(event)
    const doc = frameRef.current?.contentDocument
    if (!point || !doc) return
    const hit = doc.elementFromPoint(point.x, point.y) as HTMLElement | null
    const target = hit?.closest<HTMLElement>('[data-edit-id]') || null
    if (!target) {
      setSelected(null)
      return
    }
    event.preventDefault()
    const id = target.getAttribute('data-edit-id') || ''
    setSelected(id)
    const origin = { x: event.clientX, y: event.clientY, ...(mediaRef.current[id] || { dx: 0, dy: 0 }) }
    const move = (native: PointerEvent) => {
      update(id, {
        dx: Math.round(origin.dx + (native.clientX - origin.x) / scale),
        dy: Math.round(origin.dy + (native.clientY - origin.y) / scale),
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
      const dx = (native.clientX - origin.x) / scale
      const dy = (native.clientY - origin.y) / scale
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
      update(selected, { dx: Math.round(nextX), dy: Math.round(nextY), width: Math.max(48, Math.round(width)), height: Math.max(36, Math.round(height)) })
    }
    const end = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
  }

  const items = () => {
    const doc = frameRef.current?.contentDocument
    if (!doc) return []
    return [...doc.querySelectorAll<HTMLElement>('[data-edit-id]')].map((element) => ({
      id: element.getAttribute('data-edit-id') || '',
      kind: element.tagName === 'VIDEO' ? '视频' : element.tagName === 'IFRAME' || element.classList.contains('yt-frame') ? '视频' : '图',
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
            <button key={item.id} type="button" className={selected === item.id ? 'is-current' : ''} onClick={() => { setSelected(item.id); frameRef.current?.contentDocument?.querySelector(`[data-edit-id="${item.id}"]`)?.scrollIntoView({ block: 'center' }) }}>
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
                  doc?.addEventListener('scroll', syncFrame, true)
                  setList(items())
                  syncFrame()
                }}
              />
              {!preview && (
                <div className="studio-hit" onPointerDown={startMove} onWheel={(event) => {
                  const scroller = frameRef.current?.contentDocument?.scrollingElement
                  if (!scroller) return
                  scroller.scrollTop += event.deltaY
                  syncFrame()
                }}>
                  {selected && box && (
                    <div className="studio-select" style={{ left: box.left, top: box.top, width: box.width, height: box.height }} onPointerDown={(event) => { event.stopPropagation(); const id = selected; const origin = { x: event.clientX, y: event.clientY, ...(mediaRef.current[id] || { dx: 0, dy: 0 }) }; const move = (native: PointerEvent) => update(id, { dx: Math.round(origin.dx + (native.clientX - origin.x) / scale), dy: Math.round(origin.dy + (native.clientY - origin.y) / scale) }); const end = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end) }; window.addEventListener('pointermove', move); window.addEventListener('pointerup', end) }}>
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
                  <label>水平<input type="number" value={media[selected]?.dx || 0} onChange={(event) => update(selected, { dx: Number(event.target.value) })} /></label>
                  <label>垂直<input type="number" value={media[selected]?.dy || 0} onChange={(event) => update(selected, { dy: Number(event.target.value) })} /></label>
                  <label>宽<input type="number" value={media[selected]?.width || Math.round((box?.width || 0) / scale)} onChange={(event) => update(selected, { width: Number(event.target.value) })} /></label>
                  <label>高<input type="number" value={media[selected]?.height || Math.round((box?.height || 0) / scale)} onChange={(event) => update(selected, { height: Number(event.target.value) })} /></label>
                  <p className="studio-note">没改过的内容不会写入。上传后只移动改过的媒体，导航和背景仍在。手机不使用这些桌面位移。</p>
                </>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
