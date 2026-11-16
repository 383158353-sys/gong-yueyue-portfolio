import { describe, expect, it } from 'vitest'
import layoutExample from '../content/layoutExample.json'
import { films } from '../content/catalog'
import {
  EMBED_ORIGIN,
  FUNCTIONAL_TEST_VIDEO_ID,
  addLocalEntry,
  createEmbedUrl,
  describeEmbedError,
  extractYouTubeId,
  loadLocalEntries,
  parseYoutubeInput,
  removeLocalEntry,
  saveLocalEntries,
  type StorageLike,
} from './youtube'

const FILMS = ['residual', 'crossing'] as const

function memoryStorage(): StorageLike & { dump: () => string | null } {
  const bag = new Map<string, string>()
  return {
    getItem: (key) => bag.get(key) ?? null,
    setItem: (key, value) => {
      bag.set(key, value)
    },
    removeItem: (key) => {
      bag.delete(key)
    },
    dump: () => bag.get('gong-yueyue-local-youtube-v1') ?? null,
  }
}

describe('extractYouTubeId', () => {
  it('reads watch, youtu.be, shorts, embed and nocookie links', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=M7lc1UVf-VE&t=12s')).toBe('M7lc1UVf-VE')
    expect(extractYouTubeId('https://youtu.be/M7lc1UVf-VE?si=abc')).toBe('M7lc1UVf-VE')
    expect(extractYouTubeId('https://www.youtube.com/shorts/M7lc1UVf-VE')).toBe('M7lc1UVf-VE')
    expect(extractYouTubeId('https://www.youtube.com/embed/M7lc1UVf-VE')).toBe('M7lc1UVf-VE')
    expect(extractYouTubeId('https://www.youtube-nocookie.com/embed/M7lc1UVf-VE')).toBe('M7lc1UVf-VE')
    expect(extractYouTubeId('https://m.youtube.com/watch?v=abcdefghijk')).toBe('abcdefghijk')
  })

  it('rejects arbitrary urls, html and non-youtube hosts', () => {
    expect(extractYouTubeId('')).toBeNull()
    expect(extractYouTubeId('https://vimeo.com/123456789')).toBeNull()
    expect(extractYouTubeId('javascript:alert(1)')).toBeNull()
    expect(extractYouTubeId('data:text/html,<script>alert(1)</script>')).toBeNull()
    expect(extractYouTubeId('<iframe src="https://evil.example/embed/aaaaaaaaaaa"></iframe>')).toBeNull()
    expect(extractYouTubeId('https://www.youtube.com/watch?v=short')).toBeNull()
    expect(extractYouTubeId('https://www.youtube.com/channel/UCxxxxxxxxxxxxxxxx')).toBeNull()
    expect(extractYouTubeId('not a url')).toBeNull()
  })

  it('pulls a youtube url out of surrounding text without rendering that text', () => {
    expect(extractYouTubeId('看这个 https://youtu.be/M7lc1UVf-VE。')).toBe('M7lc1UVf-VE')
  })
})

describe('createEmbedUrl', () => {
  it('stays on the nocookie whitelist', () => {
    const url = createEmbedUrl('M7lc1UVf-VE')
    expect(url).toBe(`${EMBED_ORIGIN}/embed/M7lc1UVf-VE?rel=0&modestbranding=1&playsinline=1&autoplay=0`)
    expect(url?.includes('autoplay=1')).toBe(false)
    expect(url?.includes('youtube.com/embed')).toBe(false)
    expect(createEmbedUrl('../etc/passwd')).toBeNull()
    expect(createEmbedUrl('M7lc1UVf-VE</iframe><script>')).toBeNull()
  })
})

describe('parseYoutubeInput', () => {
  it('returns watch and embed urls only after a valid id', () => {
    const parsed = parseYoutubeInput('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.watchUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      expect(parsed.embedUrl.startsWith(`${EMBED_ORIGIN}/embed/`)).toBe(true)
    }
  })

  it('explains invalid input', () => {
    const parsed = parseYoutubeInput('https://example.com')
    expect(parsed.ok).toBe(false)
    if (!parsed.ok) expect(parsed.error).toContain('不是可识别')
  })
})

describe('local library', () => {
  it('persists, rejects duplicates and the functional test clip', () => {
    const storage = memoryStorage()
    const first = addLocalEntry([], {
      rawUrl: 'https://youtu.be/abcdefghijk',
      title: '<b>本机</b> 记录',
      filmId: 'residual',
      allowedFilmIds: FILMS,
    }, '2026-11-15T00:00:00.000Z')
    expect(first.error).toBeUndefined()
    expect(first.entry?.title).toBe('本机 记录')
    expect(first.entry?.filmId).toBe('residual')
    saveLocalEntries(storage, first.entries)
    expect(loadLocalEntries(storage)).toEqual(first.entries)

    const duplicate = addLocalEntry(first.entries, {
      rawUrl: 'https://www.youtube.com/watch?v=abcdefghijk',
      title: 'again',
      filmId: null,
      allowedFilmIds: FILMS,
    })
    expect(duplicate.error).toContain('已经在本机列表')
    expect(duplicate.entries).toHaveLength(1)

    const testClip = addLocalEntry(first.entries, {
      rawUrl: `https://www.youtube.com/shorts/${FUNCTIONAL_TEST_VIDEO_ID}`,
      title: '官方测试片',
      filmId: 'residual',
      allowedFilmIds: FILMS,
    })
    expect(testClip.error).toContain('功能测试片')
    expect(testClip.entries.some((entry) => entry.videoId === FUNCTIONAL_TEST_VIDEO_ID)).toBe(false)

    const unknownFilm = addLocalEntry(first.entries, {
      rawUrl: 'https://www.youtube.com/embed/zzzzzzzzzzz',
      title: 'x',
      filmId: 'not-a-film',
      allowedFilmIds: FILMS,
    })
    expect(unknownFilm.error).toContain('不存在')
  })

  it('drops corrupt storage and can remove an entry', () => {
    const storage = memoryStorage()
    storage.setItem('gong-yueyue-local-youtube-v1', '{')
    expect(loadLocalEntries(storage)).toEqual([])
    const added = addLocalEntry([], {
      rawUrl: 'https://www.youtube.com/watch?v=bbbbbbbbbbb',
      title: '临时',
      filmId: null,
      allowedFilmIds: FILMS,
    })
    expect(removeLocalEntry(added.entries, 'bbbbbbbbbbb')).toEqual([])
  })
})

describe('layout example', () => {
  it('is the official sample and is not filed as a real work', () => {
    expect(layoutExample.videoId).toBe(FUNCTIONAL_TEST_VIDEO_ID)
    expect(layoutExample.label).toBe('测试视频，非本人作品；待替换')
    expect(films.some((film) => film.title.includes('测试视频') || film.summary.includes(FUNCTIONAL_TEST_VIDEO_ID))).toBe(false)
  })
})

describe('describeEmbedError', () => {
  it('does not describe a blocked embed as success', () => {
    expect(describeEmbedError(101)).toContain('不是播放成功')
    expect(describeEmbedError(150)).toContain('不是播放成功')
    expect(describeEmbedError(100)).toContain('不是播放成功')
    expect(describeEmbedError(null)).toContain('尚未确认')
  })
})
