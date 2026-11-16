import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

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
  scaleSelected: (delta: number) => void
}

const SiteContext = createContext<SiteContextValue | null>(null)

export function useSite() {
  const value = useContext(SiteContext)
  if (!value) throw new Error('site context missing')
  return value
}

function sameBlocks(blocks: BlockOverride[]) {
  return JSON.stringify(blocks)
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
  const [token, setToken] = useState('')
  const history = useRef<HistoryState>({ past: [], future: [] })
  const draftRef = useRef(draft)
  draftRef.current = draft

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
        if ((event.target as HTMLElement).closest('button, a, input, textarea')) return
        event.stopPropagation()
        const additive = event.shiftKey
        setSelected((current) => (additive ? Array.from(new Set([...current, block.id])) : [block.id]))
        const origin = { x: event.clientX, y: event.clientY }
        let guide: string | null = null
        const move = (native: PointerEvent) => {
          const moved = Math.hypot(native.clientX - origin.x, native.clientY - origin.y)
          if (moved < 6) return
          const nodes = [...document.querySelectorAll(`[data-group="${block.group}"]`)]
          let best: string | null = null
          let bestDist = 28
          for (const node of nodes) {
            const id = node.getAttribute('data-block-id')
            if (!id || id === block.id) continue
            const rect = node.getBoundingClientRect()
            const dx = native.clientX < rect.left ? rect.left - native.clientX : native.clientX > rect.right ? native.clientX - rect.right : 0
            const dy = native.clientY < rect.top ? rect.top - native.clientY : native.clientY > rect.bottom ? native.clientY - rect.bottom : 0
            const dist = Math.hypot(dx, dy)
            if (dist < bestDist) {
              bestDist = dist
              best = id
            }
          }
          guide = best
          setGuideId(best)
        }
        const end = () => {
          window.removeEventListener('pointermove', move)
          window.removeEventListener('pointerup', end)
          setGuideId(null)
          if (!guide) return
          const current = draftRef.current
          const targetNode = document.querySelector(`[data-block-id="${guide}"]`)
          const sourceOrder = current.find((item) => item.id === block.id)?.order ?? block.order
          const targetOrder = current.find((item) => item.id === guide)?.order ?? Number(targetNode?.getAttribute('data-order') || block.order)
          const next = [block.id, guide].reduce((list, id) => {
            const existing = list.find((item) => item.id === id)
            const order = id === block.id ? targetOrder : sourceOrder
            return existing ? list.map((item) => (item.id === id ? { ...item, order } : item)) : [...list, { id, order }]
          }, current)
          commit(next)
          setStatus('已按参考线交换位置。手机端按这个顺序往下排，不使用桌面像素。')
        }
        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', end)
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
        setDraft(previous)
      },
      redo: () => {
        const next = history.current.future[0]
        if (!next) return
        history.current = { past: [...history.current.past, draftRef.current], future: history.current.future.slice(1) }
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
          setStatus('先选中一个内容块。只选中一个时，对齐是把它放到这一组的最前。')
          return
        }
        const next = selected.reduce((list, id, index) => {
          const existing = list.find((item) => item.id === id)
          const order = index
          return existing ? list.map((item) => (item.id === id ? { ...item, order, align: item.align ?? 'left' } : item)) : [...list, { id, order, align: 'left' as const }]
        }, draftRef.current)
        commit(next)
        setStatus('已放到这一组最前，文字左对齐。')
      },
      alignSelectedTogether: () => {
        if (selected.length < 2) {
          setStatus('彼此对齐需要至少选中两个。只选中一个时用左对齐画布。')
          return
        }
        const next = selected.reduce((list, id, index) => {
          const existing = list.find((item) => item.id === id)
          const order = index
          return existing ? list.map((item) => (item.id === id ? { ...item, order, align: 'left' as const } : item)) : [...list, { id, order, align: 'left' as const }]
        }, draftRef.current)
        commit(next)
        setStatus('所选内容已互相靠左排到一起。')
      },
      scaleSelected: (delta) => {
        const id = selected[0]
        if (!id) return
        const existing = draftRef.current.find((item) => item.id === id)
        const imageScale = Math.min(1.6, Math.max(0.6, Math.round(((existing?.imageScale ?? 1) + delta) * 100) / 100))
        patch(id, { imageScale })
      },
    }
  }, [editing, unlocked, configured, storage, status, selected, guideId, token, published, draft, saved])

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

export function TextBind({ id, group, fallback, className }: { id: string; group: string; fallback: string; className?: string }) {
  const site = useSite()
  const block = site.override(id)
  if (block?.hidden && !site.editing) return null
  const editing = site.editing && site.unlocked
  return (
    <span
      className={`${className ?? ''} ${editing ? 'edit-block' : ''} ${site.selected.includes(id) ? 'is-selected' : ''} ${site.guideId === id ? 'is-guide' : ''}`}
      style={blockStyle(block)}
      data-block-id={editing ? id : undefined}
      data-group={editing ? group : undefined}
      data-order={block?.order}
      onPointerDown={editing ? (event) => site.pointerDown(event, { id, group, order: block?.order ?? 0 }) : undefined}
    >
      {block?.text ?? fallback}
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
