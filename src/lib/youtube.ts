/**
 * YouTube 链接解析与嵌入地址。
 *
 * 解析规则移植自 lingoclub-web（只读，不改该仓库）：
 * - src/lib/youtubeTranscriptClient.js 的 extractYouTubeId / normalizeYouTubeUrl
 * - src/lib/youtubePlayerConfig.js 的固定嵌入参数与错误码说明
 * - src/components/study/players/YouTubePlayer.jsx 的 iframe 白名单思路
 *
 * 这里不抓字幕、不走 LingoClub 后端。嵌入域名只允许 youtube-nocookie.com。
 * 不使用 get-youtube-id 的 fuzzy 模式，避免把任意 11 位字符串当成视频。
 */

const YOUTUBE_ID_RX = /^[A-Za-z0-9_-]{11}$/
export const EMBED_ORIGIN = 'https://www.youtube-nocookie.com'

/** YouTube IFrame Player API 文档长期使用的公开示例片，不是作者作品。 */
export const FUNCTIONAL_TEST_VIDEO_ID = 'M7lc1UVf-VE'

export const LOCAL_LIBRARY_KEY = 'gong-yueyue-local-youtube-v1'

export type YoutubeParseResult =
  | { ok: true; videoId: string; watchUrl: string; embedUrl: string }
  | { ok: false; error: string }

export type LocalYoutubeEntry = {
  videoId: string
  watchUrl: string
  embedUrl: string
  title: string
  filmId: string | null
  savedAt: string
}

export type StorageLike = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem?: (key: string) => void
}

export function isYoutubeId(value: string | null | undefined): value is string {
  return typeof value === 'string' && YOUTUBE_ID_RX.test(value)
}

export function extractYouTubeId(url: string): string | null {
  try {
    const input = String(url || '').trim()
    const match = input.match(/https?:\/\/[A-Za-z0-9\-._~:/?#[\]@!$&*+,;=%]+/i)
    const value = (match?.[0] || input).replace(/[),.;!?，。；！？]+$/u, '')
    if (/^\s*(javascript|data|vbscript):/i.test(value)) return null
    const parsed = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
    if (parsed.username || parsed.password) return null
    const host = parsed.hostname.toLowerCase()
    if (host === 'youtu.be') {
      const id = parsed.pathname.match(/^\/([A-Za-z0-9_-]{11})/)?.[1] || ''
      return YOUTUBE_ID_RX.test(id) ? id : null
    }
    const isYouTube =
      host === 'youtube.com' ||
      host.endsWith('.youtube.com') ||
      host === 'youtube-nocookie.com' ||
      host.endsWith('.youtube-nocookie.com')
    if (!isYouTube) return null
    const queryId = parsed.searchParams.get('v') || ''
    if (YOUTUBE_ID_RX.test(queryId)) return queryId
    const pathId = parsed.pathname.match(/^\/(?:embed|shorts|v|live)\/([A-Za-z0-9_-]{11})(?:[/?]|$)/)?.[1]
    if (pathId && YOUTUBE_ID_RX.test(pathId)) return pathId
  } catch {
    return null
  }
  return null
}

export function createEmbedUrl(videoId: string): string | null {
  if (!isYoutubeId(videoId)) return null
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    autoplay: '0',
  })
  return `${EMBED_ORIGIN}/embed/${encodeURIComponent(videoId)}?${params.toString()}`
}

export function normalizeYouTubeUrl(url: string): string | null {
  const videoId = extractYouTubeId(url)
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null
}

export function parseYoutubeInput(input: string): YoutubeParseResult {
  const videoId = extractYouTubeId(input)
  if (!videoId) {
    return { ok: false, error: '这不是可识别的 YouTube 链接。请使用 watch、youtu.be、shorts 或 embed 地址。' }
  }
  const embedUrl = createEmbedUrl(videoId)
  const watchUrl = normalizeYouTubeUrl(input)
  if (!embedUrl || !watchUrl) {
    return { ok: false, error: '视频 ID 无法生成安全的嵌入地址。' }
  }
  if (!embedUrl.startsWith(`${EMBED_ORIGIN}/embed/`)) {
    return { ok: false, error: '嵌入地址不在允许的域名内。' }
  }
  return { ok: true, videoId, watchUrl, embedUrl }
}

export function isFunctionalTestVideo(videoId: string): boolean {
  return videoId === FUNCTIONAL_TEST_VIDEO_ID
}

export function describeEmbedError(code: number | null): string {
  if (code === 153) return 'YouTube 未收到来源信息（153）。这不是播放成功。'
  if (code === 101 || code === 150) {
    return 'YouTube 拒绝嵌入（101/150）。常见原因是作者禁止嵌入，或当前网络被要求验证。这不是播放成功。'
  }
  if (code === 100) return '该视频可能已删除、设为私密，或 ID 无效（100）。这不是播放成功。'
  if (code === 2 || code === 5) return `YouTube 播放器参数或播放器出错（${code}）。这不是播放成功。`
  if (code !== null) return `YouTube 嵌入播放器返回错误（${code}）。这不是播放成功。`
  return '尚未确认远程播放。播放器没有画面时，请打开原视频，不要把它当成已经播成。'
}

export function sanitizeLocalTitle(value: string): string {
  const text = value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  return text.slice(0, 80)
}

export function loadLocalEntries(storage: StorageLike | null): LocalYoutubeEntry[] {
  if (!storage) return []
  try {
    const raw = storage.getItem(LOCAL_LIBRARY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item) => {
      if (!item || typeof item !== 'object') return []
      const record = item as Partial<LocalYoutubeEntry>
      if (!isYoutubeId(record.videoId) || isFunctionalTestVideo(record.videoId)) return []
      const embedUrl = createEmbedUrl(record.videoId)
      const watchUrl = `https://www.youtube.com/watch?v=${record.videoId}`
      if (!embedUrl) return []
      const filmId = typeof record.filmId === 'string' && record.filmId ? record.filmId : null
      return [
        {
          videoId: record.videoId,
          watchUrl,
          embedUrl,
          title: sanitizeLocalTitle(record.title || '') || '未命名本机视频',
          filmId,
          savedAt: typeof record.savedAt === 'string' ? record.savedAt : '',
        },
      ]
    })
  } catch {
    return []
  }
}

export function saveLocalEntries(storage: StorageLike, entries: LocalYoutubeEntry[]): void {
  storage.setItem(LOCAL_LIBRARY_KEY, JSON.stringify(entries))
}

export function addLocalEntry(
  entries: LocalYoutubeEntry[],
  input: { rawUrl: string; title: string; filmId: string | null; allowedFilmIds: readonly string[] },
  now = new Date().toISOString(),
): { entries: LocalYoutubeEntry[]; error?: string; entry?: LocalYoutubeEntry } {
  const parsed = parseYoutubeInput(input.rawUrl)
  if (!parsed.ok) return { entries, error: parsed.error }
  if (isFunctionalTestVideo(parsed.videoId)) {
    return { entries, error: '这是功能测试片，不能写入作品库，也不会挂到公开作品上。' }
  }
  if (entries.some((entry) => entry.videoId === parsed.videoId)) {
    return { entries, error: '这条视频已经在本机列表里，没有重复写入。' }
  }
  const filmId = input.filmId && input.allowedFilmIds.includes(input.filmId) ? input.filmId : null
  if (input.filmId && !filmId) {
    return { entries, error: '不能关联到不存在的作品。' }
  }
  const entry: LocalYoutubeEntry = {
    videoId: parsed.videoId,
    watchUrl: parsed.watchUrl,
    embedUrl: parsed.embedUrl,
    title: sanitizeLocalTitle(input.title) || '未命名本机视频',
    filmId,
    savedAt: now,
  }
  return { entries: [...entries, entry], entry }
}

export function removeLocalEntry(entries: LocalYoutubeEntry[], videoId: string): LocalYoutubeEntry[] {
  return entries.filter((entry) => entry.videoId !== videoId)
}
