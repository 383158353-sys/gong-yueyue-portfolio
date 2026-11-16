export type StudioElement = {
  id: string
  type: 'image' | 'video' | 'text'
  name: string
  x: number
  y: number
  width: number
  height: number
  url?: string
  text?: string
  fit?: 'cover' | 'contain'
  fontSize?: number
}

export type StudioPage = { width: number; height: number; elements: StudioElement[] }

export const STUDIO_PAGES = [
  ['home', '首页'],
  ['about', '关于'],
  ['projects', '项目'],
  ['films', '影片'],
  ['scenes', '场景'],
  ['characters', '人物'],
  ['articles', '文章'],
] as const

export type StudioPageId = (typeof STUDIO_PAGES)[number][0]

const asset = (group: string, file: string) => `/assets/canva-source/${group}/${file}.webp`

function text(id: string, name: string, value: string, x: number, y: number, width: number, fontSize: number): StudioElement {
  return { id, type: 'text', name, text: value, x, y, width, height: Math.round(fontSize * 1.6), fontSize }
}

function images(items: Array<[string, string]>, y: number, columns = 4): { elements: StudioElement[]; next: number } {
  const size = 260
  const gap = 18
  const elements = items.map(([id, url], index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    return {
      id,
      type: 'image' as const,
      name: url.split('/').pop()?.replace('.webp', '') || id,
      url,
      fit: 'cover' as const,
      x: 48 + column * (size + gap),
      y: y + row * (size + gap),
      width: size,
      height: size,
    }
  })
  const rows = Math.ceil(items.length / columns)
  return { elements, next: y + rows * (size + gap) + 24 }
}

export function seedPage(id: StudioPageId): StudioPage {
  const width = 1200
  if (id === 'home') {
    const shots = images(
      [
        ['home-still-altar', '/assets/stills/residual-altar.webp'],
        ['home-still-stair', '/assets/stills/crystal-stair.webp'],
        ['home-still-tree', '/assets/stills/luminous-tree.webp'],
        ['home-still-throne', '/assets/stills/red-throne.webp'],
      ],
      980,
    )
    return {
      width,
      height: shots.next + 40,
      elements: [
        text('home-title-cn', '中文标题', '龚玥月作品集', 48, 36, 720, 42),
        text('home-title-en', '英文标题', "GongYueyue's Portfolio", 48, 110, 900, 64),
        text('home-summary-0', '短片作品', '短片作品', 48, 240, 240, 28),
        text('home-summary-1', '场景设计', '场景设计', 320, 240, 240, 28),
        text('home-summary-2', '人物造型', '人物造型', 592, 240, 240, 28),
        text('home-summary-3', '创意设计', '创意设计', 864, 240, 240, 28),
        {
          id: 'home-hero-video',
          type: 'video',
          name: '首页视频',
          url: '/assets/home-bottom-video-no-subtitles.mp4',
          x: 48,
          y: 320,
          width: 1104,
          height: 620,
          fit: 'cover',
        },
        ...shots.elements,
      ],
    }
  }
  if (id === 'about') {
    return {
      width,
      height: 900,
      elements: [
        text('about-name', '姓名', '龚玥月 / Emore', 360, 80, 700, 48),
        {
          id: 'about-portrait',
          type: 'image',
          name: '肖像',
          url: asset('profile', 'profile-p04-08'),
          x: 48,
          y: 80,
          width: 280,
          height: 360,
          fit: 'cover',
        },
      ],
    }
  }
  if (id === 'articles') {
    return { width, height: 640, elements: [text('articles-empty', '文章空状态', '这里还没有文章。', 48, 80, 700, 32)] }
  }
  const groups: Record<string, Array<[string, string]>> = {
    films: [
      ['films-still-altar', '/assets/stills/residual-altar.webp'],
      ['films-still-stair', '/assets/stills/crystal-stair.webp'],
      ['films-still-jelly', '/assets/stills/violet-jellyfish.webp'],
      ['films-still-throne', '/assets/stills/red-throne.webp'],
      ['films-crossing-1', asset('film', 'film-p07-03')],
      ['films-crossing-2', asset('film', 'film-p07-04')],
      ['films-crossing-3', asset('film', 'film-p07-05')],
      ['films-crossing-4', asset('film', 'film-p08-03')],
      ['films-jade-1', asset('film', 'film-p08-07')],
      ['films-jade-2', asset('film', 'film-p08-08')],
      ['films-jade-3', asset('film', 'film-p08-04')],
      ['films-jade-4', asset('film', 'film-p08-05')],
      ['films-numbers-1', asset('film', 'film-p10-06')],
      ['films-numbers-2', asset('film', 'film-p11-03')],
      ['films-numbers-3', asset('film', 'film-p12-08')],
      ['films-numbers-4', asset('film', 'film-p13-04')],
      ['films-remains-1', asset('film', 'film-p14-03')],
      ['films-remains-2', asset('film', 'film-p15-03')],
      ['films-remains-3', asset('film', 'film-p15-05')],
      ['films-remains-4', asset('film', 'film-p16-07')],
      ['films-theatre-1', asset('film', 'film-p09-03')],
      ['films-theatre-2', asset('film', 'film-p09-04')],
      ['films-theatre-3', asset('film', 'film-p09-05')],
      ['films-theatre-4', asset('film', 'film-p09-06')],
    ],
    scenes: [
      ['scenes-pyramid', '/assets/stills/red-pyramid.webp'],
      ['scenes-marsh', '/assets/stills/dark-red-marsh.webp'],
      ['scenes-tree', '/assets/stills/luminous-tree.webp'],
      ['scenes-ritual', '/assets/stills/crowd-ritual.webp'],
      ['scenes-hood-1', asset('scene', 'scene-p19-03')],
      ['scenes-hood-2', asset('scene', 'scene-p19-05')],
      ['scenes-hood-3', asset('scene', 'scene-p19-07')],
      ['scenes-hood-4', asset('scene', 'scene-p19-08')],
      ['scenes-stage-1', asset('scene', 'scene-p20-03')],
      ['scenes-stage-2', asset('scene', 'scene-p20-05')],
      ['scenes-stage-3', asset('scene', 'scene-p21-03')],
      ['scenes-stage-4', asset('scene', 'scene-p21-04')],
      ['scenes-model-1', asset('scene', 'scene-p22-06')],
      ['scenes-model-2', asset('scene', 'scene-p22-09')],
      ['scenes-model-3', asset('scene', 'scene-p24-03')],
      ['scenes-model-4', asset('scene', 'scene-p24-10')],
    ],
    characters: [
      ['characters-cixi-1', asset('character', 'character-p27-03')],
      ['characters-cixi-2', asset('character', 'character-p27-04')],
      ['characters-cixi-3', asset('character', 'character-p27-05')],
      ['characters-cixi-4', asset('character', 'character-p27-06')],
      ['characters-shazhengjie-1', asset('character', 'character-p28-03')],
      ['characters-shazhengjie-2', asset('character', 'character-p28-04')],
      ['characters-shazhengjie-3', asset('character', 'character-p28-05')],
      ['characters-shazhengjie-4', asset('character', 'character-p28-06')],
      ['characters-harbin-1', asset('character', 'character-p29-04')],
      ['characters-harbin-2', asset('character', 'character-p29-05')],
      ['characters-harbin-3', asset('character', 'character-p29-06')],
      ['characters-harbin-4', asset('character', 'character-p29-07')],
      ['characters-basics-1', asset('character', 'character-p30-03')],
      ['characters-basics-2', asset('character', 'character-p30-06')],
      ['characters-basics-3', asset('character', 'character-p31-04')],
      ['characters-basics-4', asset('character', 'character-p31-06')],
      ['characters-styling-1', asset('character', 'character-p34-03')],
      ['characters-styling-2', asset('character', 'character-p35-03')],
      ['characters-styling-3', asset('character', 'character-p35-14')],
      ['characters-styling-4', asset('character', 'character-p38-03')],
    ],
    projects: [
      ['projects-poster-1', asset('creative', 'creative-p18-03')],
      ['projects-poster-2', asset('creative', 'creative-p18-04')],
      ['projects-poster-3', asset('creative', 'creative-p18-07')],
      ['projects-poster-4', asset('creative', 'creative-p18-10')],
      ['projects-blender-1', asset('film', 'film-p15-03')],
      ['projects-blender-2', asset('film', 'film-p15-04')],
      ['projects-blender-3', asset('film', 'film-p16-05')],
      ['projects-blender-4', asset('creative', 'creative-p18-09')],
      ['projects-collab-1', asset('creative', 'creative-p36-06')],
      ['projects-collab-2', asset('creative', 'creative-p36-07')],
      ['projects-collab-3', asset('creative', 'creative-p38-05')],
      ['projects-collab-4', asset('creative', 'creative-p38-08')],
      ['projects-practice-1', asset('creative', 'creative-p23-06')],
      ['projects-practice-2', asset('creative', 'creative-p24-07')],
      ['projects-practice-3', asset('creative', 'creative-p25-05')],
      ['projects-practice-4', asset('creative', 'creative-p25-23')],
    ],
  }
  const titles: Record<string, string> = { films: '短片作品', scenes: '场景设计', characters: '人物造型', projects: '创意设计' }
  const media = images(groups[id], id === 'films' ? 760 : 140)
  const elements: StudioElement[] = [text(`${id}-title`, titles[id], titles[id], 48, 36, 700, 48), ...media.elements]
  if (id === 'films') {
    elements.splice(1, 0, {
      id: 'films-trailer',
      type: 'video',
      name: '《剩余维度》预告',
      url: '/assets/hero-trailer.mp4',
      x: 48,
      y: 120,
      width: 1104,
      height: 600,
      fit: 'cover',
    })
  }
  return { width, height: media.next + 48, elements }
}

export function seedDocument(): Record<StudioPageId, StudioPage> {
  return {
    home: seedPage('home'),
    about: seedPage('about'),
    projects: seedPage('projects'),
    films: seedPage('films'),
    scenes: seedPage('scenes'),
    characters: seedPage('characters'),
    articles: seedPage('articles'),
  }
}
