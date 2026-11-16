import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { snapPosition, snapThresholdForScale } from './geometry'
import { seedDocument, STUDIO_PAGES, type StudioElement, type StudioPage, type StudioPageId } from './pageSeed'
import { useSite } from '../content/siteContext'
import './editor.css'

type Pages = Record<string, StudioPage>
type Corner = 'tl' | 'tr' | 'bl' | 'br'

const pageIdFromPath = (pathname: string): StudioPageId => {
  if (pathname === '/editor') return 'home'
  const id = pathname.slice('/editor/'.length)
  return STUDIO_PAGES.some(([key]) => key === id) ? (id as StudioPageId) : 'home'
}

export default function Studio() {
  const site = useSite()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const pageId = pageIdFromPath(pathname)
  const [pages, setPages] = useState<Pages>(() => seedDocument())
  const [saved, setSaved] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [preview, setPreview] = useState(false)
  const [editingText, setEditingText] = useState<string | null>(null)
  const [guides, setGuides] = useState<Array<{ type: 'v'; x: number } | { type: 'h'; y: number }>>([])
  const [zoom, setZoom] = useState(1)
  const stageRef = useRef<HTMLDivElement>(null)
  const [available, setAvailable] = useState(900)
  const pagesRef = useRef(pages)
  pagesRef.current = pages
  const page = pages[pageId] || seedDocument()[pageId]
  const current = page.elements.find((element) => element.id === selected[0])
  const scale = Math.min(zoom, Math.max(0.2, (available - 48) / page.width))

  useEffect(() => {
    setSelected([])
    setEditingText(null)
    setGuides([])
  }, [pageId])

  useEffect(() => {
    const node = stageRef.current
    if (!node) return
    const observer = new ResizeObserver(() => setAvailable(node.clientWidth))
    observer.observe(node)
    return () => observer.disconnect()
  }, [site.unlocked])

  const load = async () => {
    const response = await fetch('/api/editor?action=site-draft')
    const payload = await response.json()
    const next = payload.pages && Object.keys(payload.pages).length ? payload.pages : seedDocument()
    setPages(next)
    setSaved(JSON.stringify(next))
  }

  const save = async (upload = false) => {
    const draft = await fetch('/api/editor?action=site-draft')
    const existing = await draft.json()
    const response = await fetch('/api/editor?action=site-draft', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ blocks: existing.blocks || [], pages: pagesRef.current }),
    })
    if (!response.ok) return
    setSaved(JSON.stringify(pagesRef.current))
    if (!upload) return
    await fetch('/api/editor?action=site-publish', { method: 'POST' })
  }

  const patch = (id: string, changes: Partial<StudioElement>) => {
    setPages((currentPages) => ({
      ...currentPages,
      [pageId]: {
        ...currentPages[pageId],
        elements: currentPages[pageId].elements.map((element) => (element.id === id ? { ...element, ...changes } : element)),
      },
    }))
  }

  if (!site.unlocked) {
    return (
      <form
        className="studio-gate"
        onSubmit={(event) => {
          event.preventDefault()
          void site.unlock().then(() => load())
        }}
      >
        <h1>作品集编辑</h1>
        <p>独立工作台。打开后就是现在这七页里的照片、视频和文字，不是空白画布。</p>
        <label>
          编辑凭证
          <input type="password" value={site.token} autoComplete="current-password" onChange={(event) => site.setToken(event.target.value)} />
        </label>
        <button type="submit">进入编辑</button>
        <p role="status">{site.status}</p>
      </form>
    )
  }

  return (
    <div className="studio-shell">
      <header className="studio-top">
        <strong>作品集编辑</strong>
        <span>点一下就选中。拖动改位置，四个角改显示大小。文字双击可改。预览时才播放视频。</span>
        <button type="button" onClick={() => setPreview((value) => !value)}>{preview ? '返回编辑' : '预览播放'}</button>
        <button type="button" onClick={() => void save(false)}>保存草稿</button>
        <button type="button" onClick={() => void save(true)}>保存并上传</button>
        <Link to={pageId === 'home' ? '/' : `/${pageId}`}>看公开站</Link>
      </header>
      <div className="studio-body">
        <aside className="studio-side">
          <h2>页面</h2>
          {STUDIO_PAGES.map(([id, label]) => (
            <button key={id} type="button" className={id === pageId ? 'is-current' : ''} onClick={() => navigate(id === 'home' ? '/editor' : `/editor/${id}`)}>
              {label}
            </button>
          ))}
          <h2>这一页</h2>
          {[...page.elements].reverse().map((element) => (
            <button key={element.id} type="button" className={selected.includes(element.id) ? 'is-current' : ''} onClick={() => setSelected([element.id])}>
              {element.type === 'image' ? '图' : element.type === 'video' ? '视频' : '字'} {element.name}
            </button>
          ))}
        </aside>
        <div className="studio-stage" ref={stageRef} onPointerDown={() => { if (!preview) { setSelected([]); setEditingText(null) } }}>
          <div className="studio-zoom">
            <button type="button" onClick={() => setZoom((value) => Math.max(0.2, Math.round((value - 0.1) * 10) / 10))}>缩小</button>
            <span>{Math.round(scale * 100)}%</span>
            <button type="button" onClick={() => setZoom((value) => Math.min(1.5, Math.round((value + 0.1) * 10) / 10))}>放大</button>
          </div>
          <div className="studio-scroll">
            <div className="studio-sheet" style={{ width: page.width * scale, height: page.height * scale }} onPointerDown={(event) => event.stopPropagation()}>
              <div style={{ width: page.width, height: page.height, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                {guides.map((guide, index) => (
                  <i key={index} className={guide.type === 'v' ? 'pv-guide-v' : 'pv-guide-h'} style={guide.type === 'v' ? { left: guide.x } : { top: guide.y }} />
                ))}
                {page.elements.map((element) => (
                  <SheetElement
                    key={element.id}
                    element={element}
                    selected={selected.includes(element.id)}
                    preview={preview}
                    editing={editingText === element.id}
                    scale={scale}
                    page={page}
                    others={page.elements}
                    onSelect={(additive) => setSelected((current) => (additive ? (current.includes(element.id) ? current.filter((id) => id !== element.id) : [...current, element.id]) : [element.id]))}
                    onPatch={(changes) => patch(element.id, changes)}
                    onGuides={setGuides}
                    onEdit={() => setEditingText(element.id)}
                    onEditDone={() => setEditingText(null)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <aside className="studio-props">
          <h2>选中</h2>
          {!current && <p>还没有选中。点中间的照片、视频或文字。</p>}
          {current && (
            <>
              <p>{current.name}</p>
              <p>{current.type === 'image' ? '独立照片' : current.type === 'video' ? '独立视频' : '文字'}</p>
              <label>X<input type="number" value={current.x} onChange={(event) => patch(current.id, { x: Number(event.target.value) })} /></label>
              <label>Y<input type="number" value={current.y} onChange={(event) => patch(current.id, { y: Number(event.target.value) })} /></label>
              <label>宽<input type="number" value={current.width} onChange={(event) => patch(current.id, { width: Number(event.target.value) })} /></label>
              <label>高<input type="number" value={current.height} onChange={(event) => patch(current.id, { height: Number(event.target.value) })} /></label>
              {current.type !== 'text' && (
                <label>
                  显示
                  <select value={current.fit || 'cover'} onChange={(event) => patch(current.id, { fit: event.target.value as 'cover' | 'contain' })}>
                    <option value="cover">填充裁切</option>
                    <option value="contain">完整显示</option>
                  </select>
                </label>
              )}
              {current.type === 'text' && (
                <label>
                  文字
                  <textarea value={current.text || ''} onChange={(event) => patch(current.id, { text: event.target.value })} />
                </label>
              )}
              <button type="button" onClick={() => patch(current.id, { x: 0 })}>左对齐画布</button>
              <p className="studio-note">{saved === JSON.stringify(pages) ? '草稿已是当前画面。' : '还没保存。保存并上传后，宽屏公开页才换成这张画布；手机改成从上往下排。'}</p>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}

function SheetElement({
  element,
  selected,
  preview,
  editing,
  scale,
  page,
  others,
  onSelect,
  onPatch,
  onGuides,
  onEdit,
  onEditDone,
}: {
  element: StudioElement
  selected: boolean
  preview: boolean
  editing: boolean
  scale: number
  page: StudioPage
  others: StudioElement[]
  onSelect: (additive: boolean) => void
  onPatch: (changes: Partial<StudioElement>) => void
  onGuides: (guides: Array<{ type: 'v'; x: number } | { type: 'h'; y: number }>) => void
  onEdit: () => void
  onEditDone: () => void
}) {
  const gesture = useRef<{ x: number; y: number; box: StudioElement; corner?: Corner } | null>(null)
  const pending = useRef<Partial<StudioElement> | null>(null)
  const [live, setLive] = useState<Partial<StudioElement> | null>(null)
  const view = { ...element, ...live }

  const start = (event: ReactPointerEvent, corner?: Corner) => {
    if (preview || editing || event.button !== 0) return
    event.stopPropagation()
    if (event.detail === 2 && !corner && element.type === 'text') {
      onEdit()
      return
    }
    event.preventDefault()
    if (event.shiftKey && !corner) {
      onSelect(true)
      return
    }
    onSelect(false)
    gesture.current = { x: event.clientX, y: event.clientY, box: element, corner }
    const move = (native: PointerEvent) => {
      const current = gesture.current
      if (!current) return
      const dx = (native.clientX - current.x) / scale
      const dy = (native.clientY - current.y) / scale
      if (current.corner) {
      const next = resizeBox(current.box, dx, dy, current.corner, native.shiftKey)
      pending.current = next
      setLive(next)
      return
    }
    let x = Math.round(current.box.x + dx)
    let y = Math.round(current.box.y + dy)
    const snap = snapPosition(
      { id: element.id, x, y, width: current.box.width, height: current.box.height },
      others.filter((item) => item.id !== element.id),
      page.width,
      page.height,
      snapThresholdForScale(scale),
    )
    if (snap.snapX !== null) x = snap.snapX
    if (snap.snapY !== null) y = snap.snapY
    pending.current = { x, y }
    setLive({ x, y })
    onGuides(snap.guides)
    }
    const end = () => {
      if (pending.current) onPatch(pending.current)
      pending.current = null
      gesture.current = null
      setLive(null)
      onGuides([])
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
  }

  return (
    <div
      className={`studio-el ${selected && !preview ? 'is-selected' : ''}`}
      data-studio-id={element.id}
      data-studio-type={element.type}
      style={{ left: view.x, top: view.y, width: view.width, height: view.height }}
      onPointerDown={(event) => start(event)}
      onDoubleClick={() => {
        if (!preview && element.type === 'text') onEdit()
      }}
    >
      {element.type === 'text' ? (
        <div
          className="studio-text"
          contentEditable={editing}
          suppressContentEditableWarning
          style={{ fontSize: element.fontSize || 32 }}
          onBlur={(event) => {
            if (editing) {
              onPatch({ text: event.currentTarget.textContent || '' })
              onEditDone()
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') event.currentTarget.blur()
          }}
        >
          {element.text}
        </div>
      ) : (
        <div className="element-media">
          {element.type === 'video' ? (
            <video src={element.url} controls={preview} muted={!preview} playsInline />
          ) : (
            <img src={element.url} alt={element.name} draggable={false} style={{ objectFit: element.fit === 'contain' ? 'contain' : 'cover' }} />
          )}
        </div>
      )}
      {selected && !preview && !editing && (
        <>
          {(['tl', 'tr', 'bl', 'br'] as Corner[]).map((corner) => (
            <button key={corner} type="button" className={`corner ${corner}`} aria-label={`拖动调整大小 ${corner}`} onPointerDown={(event) => start(event, corner)} />
          ))}
        </>
      )}
    </div>
  )
}

function resizeBox(start: StudioElement, dx: number, dy: number, corner: Corner, keepRatio: boolean) {
  let { x, y, width, height } = start
  const ratio = start.width / start.height
  if (corner === 'br') {
    width += dx
    height += dy
  } else if (corner === 'tl') {
    x += dx
    y += dy
    width -= dx
    height -= dy
  } else if (corner === 'tr') {
    y += dy
    width += dx
    height -= dy
  } else {
    x += dx
    width -= dx
    height += dy
  }
  if (keepRatio) height = width / ratio
  width = Math.max(48, Math.round(width))
  height = Math.max(36, Math.round(height))
  return { x: Math.round(x), y: Math.round(y), width, height }
}

export function PublishedCanvas({ doc, stacked }: { doc: StudioPage; stacked: boolean }) {
  const elements = stacked ? [...doc.elements].sort((a, b) => a.y - b.y || a.x - b.x) : doc.elements
  if (stacked) {
    return (
      <div className="studio-public-stack">
        {elements.map((element) => (
          <div key={element.id} className="studio-stack-item">
            {element.type === 'text' ? <p style={{ fontSize: Math.min(element.fontSize || 28, 32) }}>{element.text}</p> : element.type === 'video' ? <video src={element.url} controls playsInline /> : <img src={element.url} alt={element.name} />}
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="studio-public" style={{ height: doc.height }}>
      {elements.map((element) => (
        <div key={element.id} data-studio-id={element.id} style={{ left: element.x, top: element.y, width: element.width, height: element.height }}>
          {element.type === 'text' ? <p style={{ fontSize: element.fontSize }}>{element.text}</p> : element.type === 'video' ? <video src={element.url} controls playsInline /> : <img src={element.url} alt={element.name} style={{ objectFit: element.fit === 'contain' ? 'contain' : 'cover' }} />}
        </div>
      ))}
    </div>
  )
}
