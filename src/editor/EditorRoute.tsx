import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { ElementBody } from './CanvasView'
import { alignSelection, autoLayoutGrid, snapPosition } from './geometry'
import type { Guide } from './geometry'
import { emptyDocument, FONT_CHOICES } from './types'
import type { CanvasDocument, CanvasElement } from './types'
import './editor.css'

type HistoryState = { past: CanvasDocument[]; future: CanvasDocument[] }

const textDefaults = {
  fontSize: 42,
  fontFamily: FONT_CHOICES[0].value,
  fontWeight: 700,
  color: '#ffffff',
  align: 'left' as const,
  lineHeight: 1.2,
  letterSpacing: 0,
}

async function readError(response: Response) {
  const payload = await response.json().catch(() => ({}))
  return payload.error || `http_${response.status}`
}

export default function EditorRoute() {
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [token, setToken] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [document, setDocument] = useState<CanvasDocument>(emptyDocument)
  const [saved, setSaved] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [status, setStatus] = useState('正在检查服务端配置')
  const [guides, setGuides] = useState<Guide[]>([])
  const [scale, setScale] = useState(1)
  const history = useRef<HistoryState>({ past: [], future: [] })
  const stageRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/editor?action=status')
      .then((response) => response.json())
      .then((payload) => {
        setConfigured(Boolean(payload.configured))
        setStatus(payload.configured ? '服务端已配置。凭证不会写进页面。' : '服务端未配置，读写已关闭。')
      })
      .catch(() => {
        setConfigured(false)
        setStatus('无法连接编辑接口。')
      })
  }, [])

  useEffect(() => {
    const node = stageRef.current
    if (!node) return
    const measure = () => setScale(Math.min(1, (node.clientWidth - 8) / document.width))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [document.width, unlocked])

  const dirty = JSON.stringify(document) !== saved
  const current = document.elements.find((element) => element.id === selected[0])

  const commit = (next: CanvasDocument) => {
    history.current = { past: [...history.current.past, document].slice(-40), future: [] }
    setDocument(next)
  }

  const patch = (id: string, changes: Partial<CanvasElement>, recordHistory = true) => {
    const next = { ...document, elements: document.elements.map((element) => (element.id === id ? { ...element, ...changes } : element)) }
    if (recordHistory) commit(next)
    else setDocument(next)
  }

  const patchMany = (updates: Array<{ id: string; changes: Partial<CanvasElement> }>) => {
    const map = new Map(updates.map((update) => [update.id, update.changes]))
    commit({
      ...document,
      elements: document.elements.map((element) => (map.has(element.id) ? { ...element, ...map.get(element.id) } : element)),
    })
  }

  const unlock = async () => {
    const response = await fetch('/api/editor?action=session', { method: 'POST', headers: { authorization: `Bearer ${token}` } })
    if (!response.ok) {
      setStatus(response.status === 401 ? '凭证被拒绝。' : `无法进入：${await readError(response)}`)
      return
    }
    const draft = await fetch('/api/editor?action=draft')
    if (!draft.ok) {
      setStatus(`草稿没有读到：${await readError(draft)}`)
      return
    }
    const payload = await draft.json()
    const next = payload.document || emptyDocument()
    setDocument(next)
    setSaved(JSON.stringify(next))
    setUnlocked(true)
    setToken('')
    setStatus(payload.document ? '已从服务端恢复草稿。' : '还没有草稿。')
  }

  const save = async () => {
    const response = await fetch('/api/editor?action=draft', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ document }),
    })
    if (!response.ok) {
      setStatus(`保存被拒绝：${await readError(response)}`)
      return
    }
    setSaved(JSON.stringify(document))
    setStatus('草稿已写入服务端。刷新后重新输入凭证可以恢复。公开页面不会因此改变。')
  }

  const publish = async () => {
    if (dirty) {
      setStatus('先保存草稿，再发布。')
      return
    }
    const response = await fetch('/api/editor?action=publish', { method: 'POST' })
    setStatus(response.ok ? '已发布。只有 /board 读取这份发布稿。' : `发布被拒绝：${await readError(response)}`)
  }

  const upload = async (file: File) => {
    const dataBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
      reader.onerror = () => reject(new Error('read_failed'))
      reader.readAsDataURL(file)
    })
    const response = await fetch('/api/editor?action=upload', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mime: file.type, dataBase64 }),
    })
    if (!response.ok) {
      setStatus(`上传被拒绝：${await readError(response)}`)
      return
    }
    const payload = await response.json()
    const id = crypto.randomUUID()
    const element: CanvasElement = {
      id,
      type: 'image',
      name: file.name,
      x: 80,
      y: 80 + document.elements.length * 24,
      width: 320,
      height: 220,
      rotation: 0,
      opacity: 100,
      mediaId: payload.mediaId,
      fit: 'cover',
    }
    commit({ ...document, elements: [...document.elements, element] })
    setSelected([id])
    setStatus('图片已上传到服务端。还没有写入草稿，需要再点保存。')
  }

  const addText = () => {
    const id = crypto.randomUUID()
    const element: CanvasElement = {
      id,
      type: 'text',
      name: '文字',
      x: 80,
      y: 80,
      width: 520,
      height: 90,
      rotation: 0,
      opacity: 100,
      content: '写下你的句子',
      ...textDefaults,
    }
    commit({ ...document, elements: [...document.elements, element] })
    setSelected([id])
  }

  const onPointerDown = (event: ReactPointerEvent, element: CanvasElement, mode: 'move' | 'resize') => {
    if (event.button !== 0) return
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    const origin = { x: event.clientX, y: event.clientY, element: { ...element }, mode }
    const move = (native: PointerEvent) => {
      const dx = (native.clientX - origin.x) / scale
      const dy = (native.clientY - origin.y) / scale
      if (origin.mode === 'resize') {
        const width = Math.round(Math.max(30, Math.min(document.width - origin.element.x, origin.element.width + dx)))
        const height = native.shiftKey
          ? Math.round(Math.max(24, width * (origin.element.height / origin.element.width)))
          : Math.round(Math.max(24, Math.min(document.height - origin.element.y, origin.element.height + dy)))
        patch(origin.element.id, { width, height }, false)
        return
      }
      let x = Math.round(Math.max(0, Math.min(document.width - origin.element.width, origin.element.x + dx)))
      let y = Math.round(Math.max(0, Math.min(document.height - origin.element.height, origin.element.y + dy)))
      const snap = snapPosition({ ...origin.element, x, y }, document.elements, document.width, document.height)
      if (snap.snapX !== null) x = snap.snapX
      if (snap.snapY !== null) y = snap.snapY
      setGuides(snap.guides)
      patch(origin.element.id, { x, y }, false)
    }
    const end = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      setGuides([])
      setDocument((latest) => {
        history.current = { past: [...history.current.past, document].slice(-40), future: [] }
        return latest
      })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
  }

  const undo = () => {
    const previous = history.current.past[history.current.past.length - 1]
    if (!previous) return
    history.current = { past: history.current.past.slice(0, -1), future: [document, ...history.current.future] }
    setDocument(previous)
  }

  const redo = () => {
    const next = history.current.future[0]
    if (!next) return
    history.current = { past: [...history.current.past, document], future: history.current.future.slice(1) }
    setDocument(next)
  }

  const exportJson = () => {
    const link = window.document.createElement('a')
    link.href = URL.createObjectURL(new Blob([JSON.stringify(document, null, 2)], { type: 'application/json' }))
    link.download = 'canvas-draft.json'
    link.click()
  }

  if (configured === false) {
    return (
      <main className="pv-app">
        <p className="pv-banner">编辑接口已关闭。线上预览没有编辑凭证，也没有可持久的存储，所以不能匿名摆放或保存。这不是隐藏网址能绕过的。</p>
        <div className="pv-gate">
          <h1>私人画布还不能保存</h1>
          <p>{status}</p>
          <Link to="/">返回作品集</Link>
        </div>
      </main>
    )
  }

  if (!unlocked) {
    return (
      <main className="pv-app">
        <p className="pv-banner">这是私人编辑页。地址本身不是权限。凭证只在服务端比对，草稿写在服务端，不写进浏览器本地存储。</p>
        <form
          className="pv-gate"
          onSubmit={(event) => {
            event.preventDefault()
            void unlock()
          }}
        >
          <h1>进入私人画布</h1>
          <label>
            编辑凭证
            <input type="password" value={token} autoComplete="current-password" onChange={(event) => setToken(event.target.value)} />
          </label>
          <button type="submit">进入</button>
          <p>{status}</p>
          <Link to="/">返回作品集</Link>
        </form>
      </main>
    )
  }

  return (
    <main className="pv-app">
      <p className="pv-banner">
        当前保存是这个开发服务上的服务端文件，不是已经接通的云端。线上预览在配置凭证和持久存储之前会拒绝读写。未点发布时，公开作品集和 /board 都不会用这份草稿。
      </p>
      <div className="pv-bar">
        <h1>私人画布</h1>
        <button type="button" onClick={undo}>撤销</button>
        <button type="button" onClick={redo}>重做</button>
        <button type="button" onClick={() => void save()}>保存草稿</button>
        <button type="button" onClick={() => void publish()} disabled={dirty}>发布</button>
        <button type="button" onClick={exportJson}>导出 JSON</button>
        <Link to="/board">查看已发布</Link>
        <Link to="/">返回作品集</Link>
        <span className="pv-status" role="status">{status}</span>
      </div>
      <div className="pv-work">
        <aside className="pv-side">
          <button type="button" onClick={() => fileRef.current?.click()}>上传图片</button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (file) void upload(file)
            }}
          />
          <button type="button" onClick={addText}>添加文字</button>
          <button
            type="button"
            onClick={() => commit({ ...document, elements: autoLayoutGrid(document.elements, document.width, 2) })}
          >
            网格排版
          </button>
          <button type="button" onClick={() => {
            const chosen = document.elements.filter((element) => selected.includes(element.id))
            if (chosen.length < 2) return
            const aligned = alignSelection(chosen, 'left')
            patchMany(aligned.map((item) => ({ id: item.id, changes: { x: item.x, y: item.y } })))
          }}>左对齐所选</button>
          <button type="button" onClick={() => {
            if (!current) return
            patch(current.id, { x: Math.round((document.width - current.width) / 2) })
          }}>水平居中画布</button>
          <button type="button" onClick={() => {
            if (!current) return
            patch(current.id, { rotation: ((current.rotation || 0) + 90) % 360 })
          }}>旋转 90°</button>
        </aside>
        <div className="pv-stage-wrap" ref={stageRef} onPointerDown={() => setSelected([])}>
          <div
            ref={sheetRef}
            className="pv-sheet"
            data-scale={scale}
            style={{ width: document.width, height: document.height, transform: `scale(${scale})`, background: document.background }}
          >
            {document.elements.map((element) => (
              <div
                key={element.id}
                className={selected.includes(element.id) ? 'pv-element is-selected' : 'pv-element'}
                data-element-id={element.id}
                data-x={element.x}
                data-y={element.y}
                data-width={element.width}
                data-height={element.height}
                style={{ left: element.x, top: element.y, width: element.width, height: element.height, cursor: 'move' }}
                onPointerDown={(event) => {
                  if ((event.target as HTMLElement).closest('.pv-handle')) return
                  setSelected((currentIds) => (event.shiftKey ? Array.from(new Set([...currentIds, element.id])) : [element.id]))
                  onPointerDown(event, element, 'move')
                }}
              >
                <div className="pv-content">
                  <ElementBody element={element} published={false} />
                </div>
                {selected.includes(element.id) && (
                  <button
                    type="button"
                    className="pv-handle"
                    aria-label="拖动调整大小"
                    onPointerDown={(event) => onPointerDown(event, element, 'resize')}
                  />
                )}
              </div>
            ))}
            {guides.map((guide) =>
              guide.type === 'v' ? (
                <i key={`v${guide.x}`} className="pv-guide-v" style={{ left: guide.x }} />
              ) : (
                <i key={`h${guide.y}`} className="pv-guide-h" style={{ top: guide.y }} />
              ),
            )}
          </div>
        </div>
        <aside className="pv-props">
          {!current && <p>选中图片或文字后调整。</p>}
          {current?.type === 'text' && (
            <>
              <label>
                文字
                <textarea rows={4} value={current.content || ''} onChange={(event) => patch(current.id, { content: event.target.value })} />
              </label>
              <label>
                字号
                <input aria-label="字号" type="number" min={8} max={240} value={current.fontSize || 32} onChange={(event) => patch(current.id, { fontSize: Math.min(240, Math.max(8, Number(event.target.value) || 8)) })} />
              </label>
              <div>
                {[32, 48, 72].map((size) => (
                  <button key={size} type="button" onClick={() => patch(current.id, { fontSize: size })}>{size}</button>
                ))}
              </div>
              <label>
                字重
                <select aria-label="字重" value={current.fontWeight || 400} onChange={(event) => patch(current.id, { fontWeight: Number(event.target.value) })}>
                  <option value={400}>常规</option>
                  <option value={700}>粗体</option>
                </select>
              </label>
              <label>
                字体
                <select aria-label="字体" value={current.fontFamily} onChange={(event) => patch(current.id, { fontFamily: event.target.value })}>
                  {FONT_CHOICES.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}
                </select>
              </label>
              <label>
                颜色
                <input aria-label="文字颜色" type="color" value={current.color || '#ffffff'} onChange={(event) => patch(current.id, { color: event.target.value })} />
              </label>
              <label>
                对齐
                <select aria-label="对齐" value={current.align || 'left'} onChange={(event) => patch(current.id, { align: event.target.value as CanvasElement['align'] })}>
                  <option value="left">左</option>
                  <option value="center">中</option>
                  <option value="right">右</option>
                </select>
              </label>
              <label>
                行距
                <input aria-label="行距" type="number" min={0.8} max={2.4} step={0.05} value={current.lineHeight || 1.2} onChange={(event) => patch(current.id, { lineHeight: Number(event.target.value) })} />
              </label>
            </>
          )}
          {current?.type === 'image' && (
            <label>
              图片适应
              <select aria-label="图片适应" value={current.fit || 'cover'} onChange={(event) => patch(current.id, { fit: event.target.value as CanvasElement['fit'] })}>
                <option value="cover">裁切铺满</option>
                <option value="contain">完整显示</option>
              </select>
            </label>
          )}
        </aside>
      </div>
    </main>
  )
}
