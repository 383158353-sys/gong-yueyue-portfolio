// Drag snap and grid placement are adapted from the owner's ejected CanvasArt
// source (app 6ab7badc6b3c55bfd9a45edd): snapUtils.js and autoLayoutUtils.js.
// The algorithms are unchanged. This file does not import Base44.

export const SNAP_THRESHOLD = 6

export type Box = {
  id: string
  x: number
  y: number
  width: number
  height: number
}

export type Guide = { type: 'v'; x: number } | { type: 'h'; y: number }

export function snapThresholdForScale(scale: number) {
  const safeScale = Math.max(scale, 0.2)
  return Math.max(18, Math.round(16 / safeScale))
}

export function snapPosition(el: Box, others: Box[], canvasW: number, canvasH: number, threshold = SNAP_THRESHOLD) {
  const vStops = [0, canvasW / 2, canvasW]
  const hStops = [0, canvasH / 2, canvasH]

  others.forEach((other) => {
    if (other.id === el.id) return
    vStops.push(other.x, other.x + other.width / 2, other.x + other.width)
    hStops.push(other.y, other.y + other.height / 2, other.y + other.height)
  })

  const dV = [
    { val: el.x, offset: 0 },
    { val: el.x + el.width / 2, offset: el.width / 2 },
    { val: el.x + el.width, offset: el.width },
  ]
  const dH = [
    { val: el.y, offset: 0 },
    { val: el.y + el.height / 2, offset: el.height / 2 },
    { val: el.y + el.height, offset: el.height },
  ]

  let snapX: number | null = null
  let guideX: number | null = null
  let minDiffX = Number.POSITIVE_INFINITY
  vStops.forEach((stop) => {
    dV.forEach((edge) => {
      const diff = Math.abs(stop - edge.val)
      if (diff <= threshold && diff < minDiffX) {
        minDiffX = diff
        guideX = stop
        snapX = stop - edge.offset
      }
    })
  })

  let snapY: number | null = null
  let guideY: number | null = null
  let minDiffY = Number.POSITIVE_INFINITY
  hStops.forEach((stop) => {
    dH.forEach((edge) => {
      const diff = Math.abs(stop - edge.val)
      if (diff <= threshold && diff < minDiffY) {
        minDiffY = diff
        guideY = stop
        snapY = stop - edge.offset
      }
    })
  })

  const guides: Guide[] = []
  if (guideX !== null) guides.push({ type: 'v', x: guideX })
  if (guideY !== null) guides.push({ type: 'h', y: guideY })
  return { snapX, snapY, guides }
}

export type LayoutElement = Box & {
  type: string
  height: number
  fit?: string
}

export function autoLayoutGrid<T extends LayoutElement>(elements: T[], canvasWidth: number, cols = 2): T[] {
  const gap = 24
  const padding = 60
  const hasElements = elements.length > 0
  const startX = hasElements ? Math.min(...elements.map((element) => element.x)) : padding
  const startY = hasElements ? Math.min(...elements.map((element) => element.y)) : padding
  const contentWidth = canvasWidth - startX - padding
  const colWidth = Math.max(120, (contentWidth - gap * (cols - 1)) / cols)
  const texts = elements.filter((element) => element.type === 'text')
  const media = elements.filter((element) => element.type !== 'text')
  let currentY = startY
  const result: T[] = []

  texts.forEach((text) => {
    result.push({ ...text, x: startX, y: currentY })
    currentY += (text.height || 60) + gap
  })

  let rowStartY = currentY
  for (let index = 0; index < media.length; index += cols) {
    const row = media.slice(index, index + cols)
    const rowHeights = row.map((item) => {
      const ratio = item.width && item.height ? item.height / item.width : 1
      return Math.round(colWidth * ratio)
    })
    const rowHeight = Math.max(...rowHeights)
    row.forEach((item, column) => {
      const x = startX + column * (colWidth + gap)
      result.push({
        ...item,
        x: Math.round(x),
        y: rowStartY,
        width: Math.round(colWidth),
        height: rowHeights[column],
        fit: 'cover',
      })
    })
    rowStartY += rowHeight + gap
  }

  return result
}

export function alignToCanvas(element: Box, canvasW: number, canvasH: number, mode: 'left' | 'right' | 'top' | 'bottom' | 'centerH' | 'centerV') {
  if (mode === 'left') return { id: element.id, x: 0, y: element.y }
  if (mode === 'right') return { id: element.id, x: Math.round(canvasW - element.width), y: element.y }
  if (mode === 'top') return { id: element.id, x: element.x, y: 0 }
  if (mode === 'bottom') return { id: element.id, x: element.x, y: Math.round(canvasH - element.height) }
  if (mode === 'centerH') return { id: element.id, x: Math.round((canvasW - element.width) / 2), y: element.y }
  return { id: element.id, x: element.x, y: Math.round((canvasH - element.height) / 2) }
}

export function alignSelection(elements: Box[], mode: 'left' | 'right' | 'top' | 'bottom' | 'centerH' | 'centerV') {
  const bounds = elements.reduce(
    (acc, element) => ({
      minX: Math.min(acc.minX, element.x),
      maxX: Math.max(acc.maxX, element.x + element.width),
      minY: Math.min(acc.minY, element.y),
      maxY: Math.max(acc.maxY, element.y + element.height),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  )
  return elements.map((element) => {
    if (mode === 'left') return { id: element.id, x: bounds.minX, y: element.y }
    if (mode === 'right') return { id: element.id, x: bounds.maxX - element.width, y: element.y }
    if (mode === 'top') return { id: element.id, x: element.x, y: bounds.minY }
    if (mode === 'bottom') return { id: element.id, x: element.x, y: bounds.maxY - element.height }
    if (mode === 'centerH') {
      const centerX = (bounds.minX + bounds.maxX) / 2
      return { id: element.id, x: Math.round(centerX - element.width / 2), y: element.y }
    }
    const centerY = (bounds.minY + bounds.maxY) / 2
    return { id: element.id, x: element.x, y: Math.round(centerY - element.height / 2) }
  })
}
