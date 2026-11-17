export type CanvasElement = {
  id: string
  type: 'image' | 'text'
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  mediaId?: string
  fit?: 'cover' | 'contain'
  content?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: number
  color?: string
  align?: 'left' | 'center' | 'right'
  lineHeight?: number
  letterSpacing?: number
}

export type CanvasDocument = {
  width: number
  height: number
  background: string
  elements: CanvasElement[]
}

export const emptyDocument = (): CanvasDocument => ({
  width: 1200,
  height: 1600,
  background: '#12080a',
  elements: [],
})

export const FONT_CHOICES = [
  { label: '黑体', value: '"PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif' },
  { label: '宋体', value: '"Songti SC", "Noto Serif SC", "SimSun", serif' },
  { label: '等宽', value: '"SFMono-Regular", "Cascadia Mono", ui-monospace, monospace' },
]
