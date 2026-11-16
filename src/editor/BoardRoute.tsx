import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ScaledBoard, StackedBoard } from './CanvasView'
import type { CanvasDocument } from './types'
import './editor.css'

export default function BoardRoute() {
  const [document, setDocument] = useState<CanvasDocument | null>(null)
  const [narrow, setNarrow] = useState(() => window.innerWidth < 768)

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    let active = true
    fetch('/api/editor?action=published')
      .then((response) => response.json())
      .then((payload) => {
        if (active) setDocument(payload.document || null)
      })
      .catch(() => {
        if (active) setDocument(null)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <main className="pv-app">
      <div className="pv-bar">
        <h1>已发布画布</h1>
        <Link to="/">返回作品集</Link>
      </div>
      <div className="pv-board">
        {!document || document.elements.length === 0 ? (
          <p className="pv-empty">这张画布还没有发布。首页、影片和其余六个栏目保持原来的内容。</p>
        ) : narrow ? (
          <StackedBoard document={document} />
        ) : (
          <ScaledBoard document={document} />
        )}
      </div>
    </main>
  )
}
