import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { snapPosition, snapThresholdForScale } from '../editor/geometry'

export type BlockOverride = {
  id: string
  text?: string
  extra?: string
  detail?: string
  order?: number
  align?: 'left' | 'center' | 'right'
  fontSize?: number
  fontWeight?: number
  color?: string
  imageScale?: number
  hidden?: boolean
  x?: number
  y?: number
  width?: number
  height?: number
}

type HistoryState = { past: BlockOverride[][]; future: BlockOverride[][] }

type SiteContextValue = {
  editing: boolean
  unlocked: boolean
  configured: boolean | null
  storage: string
  status: string
  selected: string[]
  guideId: string | null
  guides: { group: string; x: number | null; y: number | null } | null
  layoutMode: boolean
  desktopLayout: boolean
  showPlacement: boolean
  token: string
  setToken: (value: string) => void
  unlock: () => Promise<void>
  save: () => Promise<void>
  publish: () => Promise<void>
  rollback: () => Promise<void>
  override: (id: string) => BlockOverride | undefined
  select: (id: string, additive?: boolean) => void
  pointerDown: (event: ReactPointerEvent, block: { id: string; group: string; order: number }) => void
  patch: (id: string, changes: Partial<BlockOverride>, record?: boolean) => void
  deleteSelected: () => void
  undo: () => void
  redo: () => void
  alignText: (align: 'left' | 'center' | 'right') => void
  moveSelectedToStart: () => void
  alignSelectedTogether: () => void
  toggleLayout: () => void
  startResize: (event: ReactPointerEvent, id: string) => void
}

const SiteContext = createContext<SiteContextValue | null>(null)

export function useSite() {
  const value = useContext(SiteContext)
  if (!value) throw new Error('site context missing')
  return value
}

function upsert(list: BlockOverride[], id: string, changes: Partial<BlockOverride>) {
  const existing = list.find((item) => item.id === id)
  return existing ? list.map((item) => (item.id === id ? { ...item, ...changes } : item)) : [...list, { id, ...changes }]
}

function measureRoots(current: BlockOverride[]) {
  let next = current
  const roots = [...document.querySelectorAll('[data-layout-root]')]
  roots.forEach((root) => {
    const group = root.getAttribute('data-layout-root')
    if (!group) return
    const space = rootSpace(root as HTMLElement)
    const rootId = `root-${group}`
    if (next.find((item) => item.id === rootId)?.height == null) {
      next = upsert(next, rootId, { width: Math.ceil(space.width), height: Math.ceil(space.height) })
    }
    root.querySelectorAll(`[data-group="${group}"]`).forEach((node) => {
      const id = node.getAttribute('data-block-id')
      if (!id) return
      const existing = next.find((item) => item.id === id)
      if (existing?.x != null && existing.y != null && existing.width != null && existing.height != null) return
      next = upsert(next, id, boxInRoot(node as HTMLElement, root as HTMLElement))
    })
  })
  return next
}

function sameBlocks(blocks: BlockOverride[]) {
  return JSON.stringify(blocks)
}

let activeGesture: { kind: 'move' | 'resize'; pointerId: number } | null = null

function rootSpace(root: HTMLElement) {
  const rect = root.getBoundingClientRect()
  const style = getComputedStyle(root)
  const borderLeft = Number.parseFloat(style.borderLeftWidth) || 0
  const borderTop = Number.parseFloat(style.borderTopWidth) || 0
  return {
    originX: rect.left + borderLeft - root.scrollLeft,
    originY: rect.top + borderTop - root.scrollTop,
    width: root.clientWidth,
    height: root.clientHeight,
  }
}

function pointInRoot(clientX: number, clientY: number, root: HTMLElement) {
  const space = rootSpace(root)
  return { x: clientX - space.originX, y: clientY - space.originY, width: space.width, height: space.height }
}

function boxInRoot(node: HTMLElement, root: HTMLElement) {
  const rect = node.getBoundingClientRect()
  const origin = pointInRoot(rect.left, rect.top, root)
  return {
    x: Math.round(origin.x),
    y: Math.round(origin.y),
    width: Math.max(36, Math.round(rect.width)),
    height: Math.max(24, Math.round(rect.height)),
  }
}

function hitsResizeHandle(host: HTMLElement, clientX: number, clientY: number) {
  const handle = host.querySelector(':scope > .edit-resize')
  if (!handle) return false
  const rect = handle.getBoundingClientRect()
  const pad = 14
  return clientX >= rect.left - pad && clientX <= rect.right + pad && clientY >= rect.top - pad && clientY <= rect.bottom + pad
}

export function SiteProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const editing = pathname === '/editor' || pathname.startsWith('/editor/')
  const [published, setPublished] = useState<BlockOverride[]>([])
  const [draft, setDraft] = useState<BlockOverride[]>([])
  const [saved, setSaved] = useState('[]')
  const [unlocked, setUnlocked] = useState(false)
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [storage, setStorage] = useState('none')
  const [status, setStatus] = useState('正在读取作品集')
  const [selected, setSelected] = useState<string[]>([])
  const [guideId, setGuideId] = useState<string | null>(null)
  const [guides, setGuides] = useState<SiteContextValue['guides']>(null)
  const [layoutMode, setLayoutMode] = useState(false)
  const [desktopLayout, setDesktopLayout] = useState(true)
  const [token, setToken] = useState('')
  const history = useRef<HistoryState>({ past: [], future: [] })
  const draftRef = useRef(draft)
  const layoutModeRef = useRef(layoutMode)
  draftRef.current = draft
  layoutModeRef.current = layoutMode

  useEffect(() => {
    let active = true
    fetch('/api/editor?action=status')
      .then((response) => response.json())
      .then((payload) => {
        if (!active) return
        setConfigured(Boolean(payload.configured))
        setStorage(payload.storage || 'none')
      })
      .catch(() => {
        if (active) setConfigured(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (editing) return
    let active = true
    fetch('/api/editor?action=site-published')
      .then((response) => response.json())
      .then((payload) => {
        if (active) setPublished(Array.isArray(payload.blocks) ? payload.blocks : [])
      })
      .catch(() => {
        if (active) setPublished([])
      })
    return () => {
      active = false
    }
  }, [editing, pathname])

  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)')
    const update = () => {
      const mode = document.querySelector('[data-view-mode]')?.getAttribute('data-view-mode')
      setDesktopLayout(query.matches && mode !== 'mobile')
    }
    update()
    query.addEventListener('change', update)
    const observer = new MutationObserver(update)
    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['data-view-mode'] })
    return () => {
      query.removeEventListener('change', update)
      observer.disconnect()
    }
  }, [pathname])

  const overrides = editing && unlocked ? draft : published

  const commit = (next: BlockOverride[]) => {
    history.current = { past: [...history.current.past, draftRef.current].slice(-40), future: [] }
    draftRef.current = next
    setDraft(next)
  }

  const patch = (id: string, changes: Partial<BlockOverride>, record = true) => {
    const current = draftRef.current
    const existing = current.find((block) => block.id === id)
    const next = existing
      ? current.map((block) => (block.id === id ? { ...block, ...changes } : block))
      : [...current, { id, ...changes }]
    if (record) commit(next)
    else setDraft(next)
  }

  const value = useMemo<SiteContextValue>(() => {
    const override = (id: string) => overrides.find((block) => block.id === id)
    return {
      editing,
      unlocked,
      configured,
      storage,
      status,
      selected,
      guideId,
      guides,
      layoutMode,
      desktopLayout,
      showPlacement: desktopLayout && ((editing && layoutMode) || !editing),
      token,
      setToken,
      unlock: async () => {
        const response = await fetch('/api/editor?action=session', {
          method: 'POST',
          headers: { authorization: `Bearer ${token}` },
        })
        if (!response.ok) {
          setStatus(response.status === 401 ? '凭证被拒绝。' : '现在不能进入编辑。')
          return
        }
        const draftResponse = await fetch('/api/editor?action=site-draft')
        const payload = await draftResponse.json()
        const blocks = Array.isArray(payload.blocks) ? payload.blocks : []
        setDraft(blocks)
        setSaved(sameBlocks(blocks))
        setUnlocked(true)
        setToken('')
        setStatus(blocks.length ? '已恢复这份作品集草稿。公开页面还是发布前的版本。' : '已载入当前作品集原文。改动保存前不会影响公开页面。')
      },
      save: async () => {
        const blocks = draftRef.current
        const response = await fetch('/api/editor?action=site-draft', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ blocks }),
        })
        if (!response.ok) {
          setStatus('保存被拒绝。公开页面没有改变。')
          return
        }
        setSaved(sameBlocks(blocks))
        setStatus('草稿已保存。刷新后重新输入凭证可以恢复。公开栏目还没变。')
      },
      publish: async () => {
        if (sameBlocks(draftRef.current) !== saved) {
          setStatus('先保存草稿，再发布到公开栏目。')
          return
        }
        const response = await fetch('/api/editor?action=site-publish', { method: 'POST' })
        setStatus(response.ok ? '已发布到原来的栏目页面。首页、项目、场景等路由会读取这份稿。' : '发布被拒绝。')
        if (response.ok) setPublished(draftRef.current)
      },
      rollback: async () => {
        if (!window.confirm('让公开栏目回到代码里的原版？编辑草稿会保留。')) return
        const response = await fetch('/api/editor?action=site-rollback', { method: 'POST' })
        if (!response.ok) {
          setStatus('回退被拒绝。')
          return
        }
        setPublished([])
        setStatus('公开栏目已回到原版。草稿还在。')
      },
      override,
      select: (id, additive) => {
        setSelected((current) => (additive ? Array.from(new Set([...current, id])) : [id]))
      },
      pointerDown: (event, block) => {
        if (!editing || !unlocked || event.button !== 0) return
        if (activeGesture?.kind === 'resize') return
        const host = event.currentTarget as HTMLElement
        if ((event.target as HTMLElement).closest('button, a, input, textarea, .edit-resize') || hitsResizeHandle(host, event.clientX, event.clientY)) {
          if (layoutModeRef.current && hitsResizeHandle(host, event.clientX, event.clientY)) {
            event.stopPropagation()
            const resize = value.startResize
            resize(event, block.id)
          }
          return
        }
        event.preventDefault()
        event.stopPropagation()
        const additive = event.shiftKey
        setSelected((current) => (additive ? Array.from(new Set([...current, block.id])) : [block.id]))
        if (!layoutModeRef.current || activeGesture) return
        const before = draftRef.current
        const root = host.closest('[data-layout-root]') as HTMLElement | null
        if (!root) return
        const originBox = boxInRoot(host, root)
        if (before.find((item) => item.id === block.id)?.x == null) {
          const seeded = measureRoots(before)
          draftRef.current = seeded
          setDraft(seeded)
        }
        const startClient = { x: event.clientX, y: event.clientY }
        activeGesture = { kind: 'move', pointerId: event.pointerId }
        const move = (native: PointerEvent) => {
          if (activeGesture?.kind !== 'move' || !layoutModeRef.current) return
          let x = Math.round(originBox.x + native.clientX - startClient.x)
          let y = Math.round(originBox.y + native.clientY - startClient.y)
          const others = [...root.querySelectorAll(`[data-group="${block.group}"]`)]
            .map((node) => {
              const id = node.getAttribute('data-block-id') || ''
              const item = draftRef.current.find((entry) => entry.id === id)
              if (!id || id === block.id || item?.x == null || item.y == null || item.width == null || item.height == null) return null
              return { id, x: item.x, y: item.y, width: item.width, height: item.height }
            })
            .filter((item): item is { id: string; x: number; y: number; width: number; height: number } => Boolean(item))
          const space = rootSpace(root)
          const snap = snapPosition(
            { id: block.id, x, y, width: originBox.width, height: originBox.height },
            others,
            space.width,
            space.height,
            snapThresholdForScale(1),
          )
          if (snap.snapX !== null) x = snap.snapX
          if (snap.snapY !== null) y = snap.snapY
          const guideX = snap.guides.find((guide) => guide.type === 'v')
          const guideY = snap.guides.find((guide) => guide.type === 'h')
          setGuides({ group: block.group, x: guideX && 'x' in guideX ? guideX.x : null, y: guideY && 'y' in guideY ? guideY.y : null })
          const next = upsert(draftRef.current, block.id, { x, y, width: originBox.width, height: originBox.height })
          const bottom = y + originBox.height + 32
          const rootId = `root-${block.group}`
          const rootBlock = next.find((item) => item.id === rootId)
          const grown = rootBlock?.height != null && bottom > rootBlock.height ? upsert(next, rootId, { height: bottom }) : next
          draftRef.current = grown
          setDraft(grown)
        }
        const end = () => {
          window.removeEventListener('pointermove', move)
          window.removeEventListener('pointerup', end)
          window.removeEventListener('pointercancel', end)
          if (activeGesture?.pointerId === event.pointerId) activeGesture = null
          setGuides(null)
          history.current = { past: [...history.current.past, before].slice(-40), future: [] }
          setStatus('已自由移动。位置和参考线用的是同一组容器坐标。宽屏公开页在发布后使用它，手机仍按原顺序往下排。')
        }
        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', end)
        window.addEventListener('pointercancel', end)
      },
      startResize: (event, id) => {
        if (!layoutModeRef.current) return
        if (activeGesture?.kind === 'resize' && activeGesture.pointerId === event.pointerId) return
        event.stopPropagation()
        event.preventDefault()
        const host = ((event.currentTarget as HTMLElement).closest('[data-block-id]') ?? event.currentTarget) as HTMLElement
        const root = host.closest('[data-layout-root]') as HTMLElement | null
        const before = draftRef.current
        const existing = before.find((item) => item.id === id)
        const measured = root ? boxInRoot(host, root) : null
        const origin = {
          x: event.clientX,
          y: event.clientY,
          width: existing?.width ?? measured?.width ?? Math.round(host.getBoundingClientRect().width),
          height: existing?.height ?? measured?.height ?? Math.round(host.getBoundingClientRect().height),
          left: existing?.x ?? measured?.x,
          top: existing?.y ?? measured?.y,
        }
        activeGesture = { kind: 'resize', pointerId: event.pointerId }
        const move = (native: PointerEvent) => {
          if (activeGesture?.kind !== 'resize') return
          const width = Math.max(80, Math.round(origin.width + native.clientX - origin.x))
          const height = Math.max(36, Math.round(origin.height + native.clientY - origin.y))
          const next = upsert(draftRef.current, id, { width, height })
          draftRef.current = next
          setDraft(next)
        }
        const end = () => {
          window.removeEventListener('pointermove', move)
          window.removeEventListener('pointerup', end)
          window.removeEventListener('pointercancel', end)
          if (activeGesture?.pointerId === event.pointerId) activeGesture = null
          history.current = { past: [...history.current.past, before].slice(-40), future: [] }
          setStatus('已改框的宽高。位置没有跟着变。')
        }
        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', end)
        window.addEventListener('pointercancel', end)
      },
      patch,
      deleteSelected: () => {
        if (!selected.length) return
        const next = selected.reduce((list, id) => {
          const existing = list.find((item) => item.id === id)
          return existing ? list.map((item) => (item.id === id ? { ...item, hidden: true } : item)) : [...list, { id, hidden: true }]
        }, draftRef.current)
        commit(next)
        setSelected([])
        setStatus('已从这一版草稿隐藏所选。可以撤销。原版代码还在，未发布不会影响公开页面。')
      },
      undo: () => {
        const previous = history.current.past[history.current.past.length - 1]
        if (!previous) return
        history.current = { past: history.current.past.slice(0, -1), future: [draftRef.current, ...history.current.future] }
        draftRef.current = previous
        setDraft(previous)
      },
      redo: () => {
        const next = history.current.future[0]
        if (!next) return
        history.current = { past: [...history.current.past, draftRef.current], future: history.current.future.slice(1) }
        draftRef.current = next
        setDraft(next)
      },
      alignText: (align) => {
        if (!selected.length) {
          setStatus('先选中文字或卡片。')
          return
        }
        const next = selected.reduce((list, id) => {
          const existing = list.find((item) => item.id === id)
          return existing ? list.map((item) => (item.id === id ? { ...item, align } : item)) : [...list, { id, align }]
        }, draftRef.current)
        commit(next)
      },
      moveSelectedToStart: () => {
        if (!selected.length) {
          setStatus('先选中一个内容块。')
          return
        }
        if (!layoutModeRef.current) {
          setStatus('先打开布局编辑，再把所选放到画布左边。')
          return
        }
        const next = selected.reduce((list, id) => upsert(list, id, { x: 0, align: 'left' }), draftRef.current)
        commit(next)
        setStatus('已把所选的左边贴到这一组的左边缘。')
      },
      alignSelectedTogether: () => {
        if (selected.length < 2) {
          setStatus('彼此对齐需要至少选中两个。只选中一个时用左对齐画布。')
          return
        }
        if (!layoutModeRef.current) {
          setStatus('先打开布局编辑，再让所选互相左对齐。')
          return
        }
        const boxes = selected.map((id) => draftRef.current.find((item) => item.id === id)).filter((item) => item?.x != null)
        const left = Math.min(...boxes.map((item) => item?.x ?? 0))
        const next = selected.reduce((list, id) => upsert(list, id, { x: left, align: 'left' }), draftRef.current)
        commit(next)
        setStatus('所选元素的左边已经互相对齐。')
      },
      toggleLayout: () => {
        if (!unlocked) return
        if (layoutModeRef.current) {
          setLayoutMode(false)
          setGuides(null)
          setStatus('已退出布局编辑。未发布的位置不会出现在公开页面。')
          return
        }
        const next = measureRoots(draftRef.current)
        commit(next)
        setLayoutMode(true)
        setStatus('布局编辑已打开。元素先停在原位置，可以自由拖动和改框。')
      },
    }
  }, [editing, unlocked, configured, storage, status, selected, guideId, guides, layoutMode, desktopLayout, token, published, draft, saved])

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

export function LayoutGuides({ group }: { group: string }) {
  const site = useSite()
  if (!site.guides || site.guides.group !== group) return null
  return (
    <>
      {site.guides.x != null && <i className="pv-guide-v" data-guide="v" style={{ left: site.guides.x }} />}
      {site.guides.y != null && <i className="pv-guide-h" data-guide="h" style={{ top: site.guides.y }} />}
    </>
  )
}
export function placementStyle(block: BlockOverride | undefined, active: boolean) {
  if (!active || block?.x == null || block.y == null || block.width == null || block.height == null) return undefined
  return {
    position: 'absolute' as const,
    left: block.x,
    top: block.y,
    width: block.width,
    height: block.height,
    margin: 0,
    zIndex: 3,
  }
}

export function layoutRootStyle(height: number | undefined, active: boolean) {
  if (!active) return undefined
  return { position: 'relative' as const, height: height || undefined, minHeight: height || undefined }
}

export function TextBind({ id, group, fallback, className }: { id: string; group: string; fallback: string; className?: string }) {
  const site = useSite()
  const block = site.override(id)
  if (block?.hidden && !site.editing) return null
  const editing = site.editing && site.unlocked
  const placed = site.desktopLayout && ((site.editing && site.layoutMode) || !site.editing)
  return (
    <span
      className={`${className ?? ''} ${editing ? 'edit-block' : ''} ${placed && block?.x != null ? 'is-placed' : ''} ${site.selected.includes(id) ? 'is-selected' : ''} ${site.guideId === id ? 'is-guide' : ''} ${block?.hidden ? 'is-hidden-block' : ''}`}
      data-hidden={block?.hidden ? 'true' : undefined}
      style={{ ...blockStyle(block), ...placementStyle(block, placed), ...(site.selected.includes(id) ? { zIndex: 8 } : {}) }}
      data-block-id={editing || placed ? id : undefined}
      data-group={editing || placed ? group : undefined}
      data-order={block?.order}
      data-x={block?.x}
      data-y={block?.y}
      data-width={block?.width}
      data-height={block?.height}
      onPointerDown={editing ? (event) => site.pointerDown(event, { id, group, order: block?.order ?? 0 }) : undefined}
    >
      {block?.text ?? fallback}
      {editing && site.layoutMode && site.selected.includes(id) && (
        <button
          type="button"
          className="edit-resize"
          aria-label="拖动调整大小"
          onPointerDownCapture={(event) => {
            event.stopPropagation()
            event.preventDefault()
            site.startResize(event, id)
          }}
        />
      )}
    </span>
  )
}

export function blockStyle(block: BlockOverride | undefined) {
  if (!block) return undefined
  return {
    fontSize: block.fontSize ? `${block.fontSize}px` : undefined,
    fontWeight: block.fontWeight,
    textAlign: block.align,
    color: block.color,
  } as const
}
