import type { CSSProperties } from 'react'
import type { CanvasDocument, CanvasElement } from './types'

export function mediaUrl(mediaId: string, published: boolean) {
  const action = published ? 'public-media' : 'media'
  return `/api/editor?action=${action}&id=${encodeURIComponent(mediaId)}`
}

export function elementStyle(element: CanvasElement): CSSProperties {
  return {
    fontFamily: element.fontFamily,
    fontSize: element.fontSize,
    fontWeight: element.fontWeight,
    lineHeight: element.lineHeight,
    letterSpacing: element.letterSpacing,
    textAlign: element.align,
    color: element.color,
    opacity: element.opacity / 100,
    transform: `rotate(${element.rotation || 0}deg)`,
  }
}

export function ElementBody({ element, published }: { element: CanvasElement; published: boolean }) {
  if (element.type === 'image' && element.mediaId) {
    return (
      <img
        src={mediaUrl(element.mediaId, published)}
        alt={element.name}
        style={{ objectFit: element.fit === 'contain' ? 'contain' : 'cover' }}
      />
    )
  }
  return <p style={elementStyle(element)}>{element.content}</p>
}

export function StackedBoard({ document }: { document: CanvasDocument }) {
  const elements = [...document.elements].sort((a, b) => a.y - b.y || a.x - b.x)
  return (
    <div className="pv-stack" data-layout="stack">
      {elements.map((element) => (
        <article key={element.id} className="pv-card">
          {element.type === 'text' ? (
            <p
              style={{
                ...elementStyle(element),
                fontSize: Math.max(16, Math.min(40, Math.round((element.fontSize || 32) * 0.46))),
              }}
            >
              {element.content}
            </p>
          ) : (
            <ElementBody element={{ ...element, rotation: 0 }} published />
          )}
        </article>
      ))}
    </div>
  )
}

export function ScaledBoard({ document }: { document: CanvasDocument }) {
  return (
    <div className="pv-board-frame" style={{ width: 'min(1200px, 100%)', aspectRatio: `${document.width} / ${document.height}` }}>
      <div
        data-layout="absolute"
        style={{
          position: 'absolute',
          inset: 0,
          background: document.background,
          containerType: 'size',
        }}
      >
        {document.elements.map((element) => (
          <div
            key={element.id}
            style={{
              position: 'absolute',
              left: `${(element.x / document.width) * 100}%`,
              top: `${(element.y / document.height) * 100}%`,
              width: `${(element.width / document.width) * 100}%`,
              height: `${(element.height / document.height) * 100}%`,
            }}
          >
            <ElementBody element={element} published />
          </div>
        ))}
      </div>
    </div>
  )
}
