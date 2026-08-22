import {
  ArrowDownToLine,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  Film,
  Mail,
  Menu,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import GhostCursor from './components/GhostCursor/GhostCursor'
import Lanyard from './components/Lanyard/Lanyard'
import LiquidEther from './components/LiquidEther/LiquidEther'

type Still = {
  src: string
  title: string
  caption: string
  group: string
}

type WorkItem = {
  title: string
  role: string
  detail: string
  assets?: string[]
  pages?: number[]
  focus?: string[]
  materials?: string[]
  process?: string[]
}

type Spark = {
  x: number
  y: number
  angle: number
  startTime: number
}

type ViewMode = 'desktop' | 'mobile'

const navItems = [
  { label: '首页', href: '#home' },
  { label: '短片作品', href: '#films' },
  { label: '场景设计', href: '#scenes' },
  { label: '人物造型', href: '#characters' },
  { label: '创意设计', href: '#creative' },
]

const canvaAsset = (group: 'film' | 'scene' | 'character' | 'creative', file: string) =>
  `/assets/canva-source/${group}/${file}.webp`

const profilePhoto = '/assets/canva-source/profile/profile-p04-08.webp'

const stills: Still[] = [
  {
    src: '/assets/stills/residual-altar.webp',
    title: '穹顶祭坛',
    caption: '玻璃化穹顶、悬浮陨石与中心发光头骨，建立影片的科幻宗教气质。',
    group: 'AI 短片《剩余维度》',
  },
  {
    src: '/assets/stills/crystal-stair.webp',
    title: '水晶阶梯',
    caption: '通向未知空间的透明阶梯，用冷青色和碎石漂浮感强化穿越感。',
    group: 'AI 短片《剩余维度》',
  },
  {
    src: '/assets/stills/dark-red-marsh.webp',
    title: '暗红沼泽',
    caption: '血红水面与黑色洞穴地形，连接禁忌、仪式和宿命的视觉线索。',
    group: 'AI 短片《剩余维度》',
  },
  {
    src: '/assets/stills/violet-jellyfish.webp',
    title: '紫色菌林',
    caption: '发光水母、丝状树根和镜面水域，形成异域生命的柔性空间。',
    group: 'AI 短片《剩余维度》',
  },
  {
    src: '/assets/stills/luminous-tree.webp',
    title: '发光古树',
    caption: '银蓝树冠、夜雾和溪流构成影片中偏神性的自然场景。',
    group: 'AI 短片《剩余维度》',
  },
  {
    src: '/assets/stills/red-pyramid.webp',
    title: '红色金字塔',
    caption: '冷灰荒原里的红色几何体，制造未来遗迹和压迫性权力象征。',
    group: 'AI 短片《剩余维度》',
  },
  {
    src: '/assets/stills/red-throne.webp',
    title: '赤色王座',
    caption: '垂直红光、骨质阶梯和帷幕状结构，推高终章的仪式张力。',
    group: 'AI 短片《剩余维度》',
  },
  {
    src: '/assets/stills/crowd-ritual.webp',
    title: '群像仪式',
    caption: '手臂群像、锁链和中心怪诞形体，呈现集体意识被召唤的画面。',
    group: 'AI 短片《剩余维度》',
  },
]

const filmAssetGroups = {
  residual: [
    '/assets/stills/residual-altar.webp',
    '/assets/stills/crystal-stair.webp',
    '/assets/stills/violet-jellyfish.webp',
    '/assets/stills/red-throne.webp',
  ],
  crossing: [
    canvaAsset('film', 'film-p07-03'),
    canvaAsset('film', 'film-p07-04'),
    canvaAsset('film', 'film-p07-05'),
    canvaAsset('film', 'film-p08-03'),
  ],
  jade: [
    canvaAsset('film', 'film-p08-07'),
    canvaAsset('film', 'film-p08-08'),
    canvaAsset('film', 'film-p08-04'),
    canvaAsset('film', 'film-p08-05'),
  ],
  numbers: [
    canvaAsset('film', 'film-p10-06'),
    canvaAsset('film', 'film-p11-03'),
    canvaAsset('film', 'film-p12-08'),
    canvaAsset('film', 'film-p13-04'),
  ],
  remains: [
    canvaAsset('film', 'film-p14-03'),
    canvaAsset('film', 'film-p15-03'),
    canvaAsset('film', 'film-p15-05'),
    canvaAsset('film', 'film-p16-07'),
  ],
  theatre: [
    canvaAsset('film', 'film-p09-03'),
    canvaAsset('film', 'film-p09-04'),
    canvaAsset('film', 'film-p09-05'),
    canvaAsset('film', 'film-p09-06'),
  ],
}

const sceneAssetGroups = {
  residualWorld: [
    '/assets/stills/red-pyramid.webp',
    '/assets/stills/dark-red-marsh.webp',
    '/assets/stills/luminous-tree.webp',
    '/assets/stills/crowd-ritual.webp',
  ],
  redHood: [
    canvaAsset('scene', 'scene-p19-03'),
    canvaAsset('scene', 'scene-p19-05'),
    canvaAsset('scene', 'scene-p19-07'),
    canvaAsset('scene', 'scene-p19-08'),
  ],
  stage: [
    canvaAsset('scene', 'scene-p20-03'),
    canvaAsset('scene', 'scene-p20-05'),
    canvaAsset('scene', 'scene-p21-03'),
    canvaAsset('scene', 'scene-p21-04'),
  ],
  model: [
    canvaAsset('scene', 'scene-p22-06'),
    canvaAsset('scene', 'scene-p22-09'),
    canvaAsset('scene', 'scene-p24-03'),
    canvaAsset('scene', 'scene-p24-10'),
  ],
}

const characterAssetGroups = {
  cixi: [
    canvaAsset('character', 'character-p27-03'),
    canvaAsset('character', 'character-p27-04'),
    canvaAsset('character', 'character-p27-05'),
    canvaAsset('character', 'character-p27-06'),
  ],
  shazhengjie: [
    canvaAsset('character', 'character-p28-03'),
    canvaAsset('character', 'character-p28-04'),
    canvaAsset('character', 'character-p28-05'),
    canvaAsset('character', 'character-p28-06'),
  ],
  harbin: [
    canvaAsset('character', 'character-p29-04'),
    canvaAsset('character', 'character-p29-05'),
    canvaAsset('character', 'character-p29-06'),
    canvaAsset('character', 'character-p29-07'),
  ],
  basics: [
    canvaAsset('character', 'character-p30-03'),
    canvaAsset('character', 'character-p30-06'),
    canvaAsset('character', 'character-p31-04'),
    canvaAsset('character', 'character-p31-06'),
  ],
  styling: [
    canvaAsset('character', 'character-p34-03'),
    canvaAsset('character', 'character-p35-03'),
    canvaAsset('character', 'character-p35-14'),
    canvaAsset('character', 'character-p38-03'),
  ],
}

const creativeAssetGroups = {
  motionPoster: [
    canvaAsset('creative', 'creative-p18-03'),
    canvaAsset('creative', 'creative-p18-04'),
    canvaAsset('creative', 'creative-p18-07'),
    canvaAsset('creative', 'creative-p18-10'),
  ],
  blender: [
    canvaAsset('film', 'film-p15-03'),
    canvaAsset('film', 'film-p15-04'),
    canvaAsset('film', 'film-p16-05'),
    canvaAsset('creative', 'creative-p18-09'),
  ],
  collaboration: [
    canvaAsset('creative', 'creative-p36-06'),
    canvaAsset('creative', 'creative-p36-07'),
    canvaAsset('creative', 'creative-p38-05'),
    canvaAsset('creative', 'creative-p38-08'),
  ],
  designPractice: [
    canvaAsset('creative', 'creative-p23-06'),
    canvaAsset('creative', 'creative-p24-07'),
    canvaAsset('creative', 'creative-p25-05'),
    canvaAsset('creative', 'creative-p25-23'),
  ],
}

const filmWorks: WorkItem[] = [
  {
    title: '《剩余维度》',
    role: 'AI 影像短片 / 毕业设计重点项目',
    detail:
      '围绕未来、神秘、仪式和压迫感建立视听系统，完成世界观、分镜、视觉生成、后期调色、声音设计与成片输出。',
    assets: filmAssetGroups.residual,
    pages: [6],
    focus: ['世界观与视听风格', '分镜静帧', 'AI 视觉生成', '后期与声音设计'],
    materials: ['关键场景静帧', '视听风格展板', '制作流程', '成片视频'],
    process: ['灵感与世界观', '脚本创作', '风格探索', '分镜规划', '视觉生成', '后期制作', '声音设计', '成片输出'],
  },
  {
    title: '《相交线》',
    role: '未来感短片 / 美术指导',
    detail: '负责影像气质、场景视觉和美术风格控制，强化未来感空间叙事。',
    assets: filmAssetGroups.crossing,
    pages: [7],
    focus: ['未来感空间', '场景美术控制', '影像氛围', '视觉叙事'],
    materials: ['剧照资料', '场景参考', '美术执行记录'],
    process: ['阅读剧本与人物关系', '确定空间调性', '搭建场景视觉参考', '配合拍摄调整画面'],
  },
  {
    title: '《玉夬》',
    role: '超现实短片 / 服装化妆设计',
    detail: '围绕人物身份和超现实氛围建立服化妆视觉系统。',
    assets: filmAssetGroups.jade,
    pages: [8],
    focus: ['服装轮廓', '妆面质感', '超现实人物气质', '镜头适配'],
    materials: ['造型方案', '妆发参考', '拍摄现场图像'],
    process: ['分析角色身份', '确定材质和色彩', '完成妆造落地', '根据镜头光线修正细节'],
  },
  {
    title: '戏剧资料与影像实践',
    role: '戏剧资料 / 表演经历 / 项目记录',
    detail: '整理旧版作品集中的戏剧资料、表演经历与现场项目记录，作为短片创作和舞台经验的补充档案。',
    assets: filmAssetGroups.theatre,
    pages: [9],
    focus: ['戏剧资料整理', '现场影像记录', '表演与项目经验', '影像美术积累'],
    materials: ['项目剧照', '现场资料', '旧版作品集页面'],
    process: ['项目参与', '现场记录', '资料归档', '转化为作品集叙事'],
  },
  {
    title: '《巾帼数韵》',
    role: '数字动画短片 / 分镜、美术造型、后期动画',
    detail:
      '主创作品，获全国大学生计算机设计大赛市一等奖、全国二等奖。作品讲述清代女数学家王贞仪的一生。',
    assets: filmAssetGroups.numbers,
    pages: [10, 11, 12, 13],
    focus: ['数字动画', '分镜设计', '人物美术造型', '后期动画'],
    materials: ['获奖信息', '角色与场景图', '动画镜头资料', '旧版项目页'],
    process: ['确定历史人物主题', '编写叙事结构', '绘制分镜与角色', '完成动画和后期输出'],
  },
  {
    title: '《遗骸》',
    role: '独立视效短片片段 / 一人全流程制作',
    detail:
      '以未来废墟、肉身消逝和枯骨永生为视觉隐喻，完成实拍、抠像、跟踪、特效、三维场景和合成。',
    assets: filmAssetGroups.remains,
    pages: [14, 15, 16],
    focus: ['一人全流程', 'Blender 三维场景', 'Nuke / AE 合成', '独立视效片段'],
    materials: ['实拍素材', '三维场景', '合成过程', '成片静帧'],
    process: ['实拍采集', '抠像与跟踪', '三维空间搭建', '合成调色输出'],
  },
]

const sceneWorks: WorkItem[] = [
  {
    title: '《剩余维度》世界观场景',
    role: 'AI 场景设定 / 分镜静帧 / 风格探索',
    detail: '将科幻、神秘、暗黑、异域与宿命感整合为连续空间，形成可被剪辑推进的场景序列。',
    assets: sceneAssetGroups.residualWorld,
  },
  {
    title: '儿童剧《小红帽》',
    role: '项目制作 / 效果图 / 平面图 / 海报设计',
    detail: '完成舞台空间、效果图和视觉物料的项目化输出。',
    assets: sceneAssetGroups.redHood,
    pages: [19],
  },
  {
    title: '舞台效果图设计',
    role: '《失明城市》《风声》《海鸥》《杨澜公》',
    detail: '围绕戏剧文本建立舞台氛围、空间层次和视觉结构。',
    assets: sceneAssetGroups.stage,
    pages: [20, 21],
  },
  {
    title: '舞台模型与场景练习',
    role: '模型制作 / 场景手绘 / 板绘',
    detail: '从手绘、模型到数字绘制，训练空间构成和画面叙事。',
    assets: sceneAssetGroups.model,
    pages: [22, 24, 25],
  },
]

const characterWorks: WorkItem[] = [
  {
    title: '《德龄与慈禧》',
    role: '服装化妆设计',
    detail: '围绕历史人物、身份阶层和时代气质建立服化妆方案。',
    assets: characterAssetGroups.cixi,
    pages: [27],
  },
  {
    title: '《沙正街174号》',
    role: '原创话剧 / 化妆设计',
    detail: '以剧目人物为核心完成妆造表达与舞台适配。',
    assets: characterAssetGroups.shazhengjie,
    pages: [28],
  },
  {
    title: '《哈尔滨之恋》',
    role: '服装化妆设计',
    detail: '结合年代、地域和角色关系设计人物造型。',
    assets: characterAssetGroups.harbin,
    pages: [29],
  },
  {
    title: '影视造型基础',
    role: '秦汉 / 民国 / 清朝 / 年龄妆 / 特效刀伤',
    detail: '覆盖不同历史时期、年龄层和特效妆面训练。',
    assets: characterAssetGroups.basics,
    pages: [30, 31],
  },
  {
    title: '人物造型与民族妆造',
    role: '《安魂曲》《无名》《彝族》及多种造型风格',
    detail: '通过服装、妆面、发型和场景还原完成角色视觉塑造。',
    assets: characterAssetGroups.styling,
    pages: [32, 33, 34, 35],
  },
]

const creativeWorks: WorkItem[] = [
  {
    title: '动态海报与短视频特效',
    role: 'Nuke / AE / Nuke 合成',
    detail: '以动态视觉、光效、跟踪和合成能力完成短视频视觉包装。',
    assets: creativeAssetGroups.motionPoster,
    pages: [18],
  },
  {
    title: 'Blender 建模与三维实践',
    role: '建模 / 场景搭建 / 分层渲染',
    detail: '将三维场景搭建、灯光、摄影机运动和合成流程整合到影像创作中。',
    assets: creativeAssetGroups.blender,
    pages: [15, 16, 18],
  },
  {
    title: '创作交流与摄影合作',
    role: '杭州 ST 装置摄影工作室 / 艺人合作 / 时尚摄影',
    detail: '参与 AIGC、建模、3D 打印、视效和时尚肖像创作交流，拓展视觉语言。',
    assets: creativeAssetGroups.collaboration,
    pages: [36, 37, 38, 39],
  },
  {
    title: '设计练习与综合创作',
    role: '服装练习 / 手绘板绘 / 项目视觉',
    detail: '以平面、绘画、服装和综合设计训练支撑影像美术表达。',
    assets: creativeAssetGroups.designPractice,
    pages: [23, 25],
  },
]

const processSteps = [
  ['灵感与世界观', '从意识、宿命、科幻与神秘学出发，建立影片的精神内核。'],
  ['脚本创作', '将世界观转化为可剪辑的叙事节点，明确角色、场景与情绪走向。'],
  ['风格探索', '收集参考并确定黑蓝、幽紫、血红等主视觉色彩和材质方向。'],
  ['分镜规划', '使用分镜和文字描述控制镜头语言、景别、运动与节奏。'],
  ['视觉生成', '通过 AI 图像与视频生成建立关键场景，再反复筛选和统一风格。'],
  ['后期制作', '剪辑、调色、修复、质感增强与镜头节奏整理，提升影像完整度。'],
  ['声音设计', '低频冲击、空间氛围、人声吟唱和节奏推进共同塑造听觉叙事。'],
  ['成片输出', '输出 16:9 成片，用展板和作品集归纳完整创作过程。'],
]

const sectionSummaries = [
  ['短片作品', '3 部短片主创、3 部美术指导或执行、5 部服装造型、1 部主演经验。'],
  ['场景设计', '舞台效果图、模型、手绘和 AI 场景生成共同支撑空间叙事。'],
  ['人物造型', '覆盖历史、民族、戏剧、影视和特效妆面，强调角色身份表达。'],
  ['创意设计', '整合 Nuke、AE、Blender、摄影、AIGC 与综合平面设计能力。'],
]

function getInitialViewMode(): ViewMode {
  if (typeof window === 'undefined') return 'desktop'

  const view = new URLSearchParams(window.location.search).get('view')
  if (view === 'mobile' || view === 'desktop') return view
  return window.matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop'
}

function handleInteractivePointerMove(event: React.PointerEvent<HTMLElement>) {
  if (window.matchMedia('(pointer: coarse)').matches) return
  const element = event.currentTarget
  const rect = element.getBoundingClientRect()
  const x = (event.clientX - rect.left) / rect.width
  const y = (event.clientY - rect.top) / rect.height

  element.style.setProperty('--spotlight-x', `${x * 100}%`)
  element.style.setProperty('--spotlight-y', `${y * 100}%`)
  element.style.setProperty('--card-tilt-x', `${(0.5 - y) * 5}deg`)
  element.style.setProperty('--card-tilt-y', `${(x - 0.5) * 7}deg`)
}

function handleInteractivePointerLeave(event: React.PointerEvent<HTMLElement>) {
  const element = event.currentTarget
  element.style.setProperty('--spotlight-x', '50%')
  element.style.setProperty('--spotlight-y', '50%')
  element.style.setProperty('--card-tilt-x', '0deg')
  element.style.setProperty('--card-tilt-y', '0deg')
}

function useHeroParallax() {
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    let frame = 0
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0

    const render = () => {
      frame = 0
      currentX += (targetX - currentX) * 0.12
      currentY += (targetY - currentY) * 0.12

      element.style.setProperty('--hero-video-x', `${currentX * -18}px`)
      element.style.setProperty('--hero-video-y', `${currentY * -10}px`)
      element.style.setProperty('--hero-field-x', `${currentX * 24}px`)
      element.style.setProperty('--hero-field-y', `${currentY * 16}px`)
      element.style.setProperty('--hero-light-x', `${50 + currentX * 18}%`)
      element.style.setProperty('--hero-light-y', `${42 + currentY * 16}%`)

      if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
        frame = requestAnimationFrame(render)
      }
    }

    const queue = () => {
      if (!frame) frame = requestAnimationFrame(render)
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (window.matchMedia('(pointer: coarse)').matches) return
      const rect = element.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width
      const y = (event.clientY - rect.top) / rect.height
      targetX = x - 0.5
      targetY = y - 0.5
      element.style.setProperty('--hero-reveal-x', `${x * 100}%`)
      element.style.setProperty('--hero-reveal-y', `${y * 100}%`)
      queue()
    }

    const handlePointerLeave = () => {
      targetX = 0
      targetY = 0
      element.style.setProperty('--hero-reveal-x', '57%')
      element.style.setProperty('--hero-reveal-y', '42%')
      queue()
    }

    element.addEventListener('pointermove', handlePointerMove)
    element.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      cancelAnimationFrame(frame)
      element.removeEventListener('pointermove', handlePointerMove)
      element.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [])

  return ref
}

function useReveal() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.reveal'))
    if (!elements.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.16, rootMargin: '0px 0px -6% 0px' },
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeStill, setActiveStill] = useState(0)
  const [lightbox, setLightbox] = useState<Still | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [activeWork, setActiveWork] = useState<WorkItem | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode)
  const heroRef = useHeroParallax()
  useReveal()

  const currentStill = stills[activeStill]

  const nextStill = () => setActiveStill((value) => (value + 1) % stills.length)
  const prevStill = () => setActiveStill((value) => (value - 1 + stills.length) % stills.length)
  const handleViewModeChange = (nextMode: ViewMode) => {
    const url = new URL(window.location.href)
    url.searchParams.set('view', nextMode)
    window.history.pushState({}, '', url)
    setViewMode(nextMode)
    setMenuOpen(false)
  }

  useEffect(() => {
    const handlePopState = () => setViewMode(getInitialViewMode())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return (
    <ClickSpark>
      <main className={`portfolio-shell portfolio-${viewMode} min-h-screen overflow-x-hidden bg-[#060203] text-white`} data-view-mode={viewMode}>
      <Navigation menuOpen={menuOpen} setMenuOpen={setMenuOpen} viewMode={viewMode} onViewModeChange={handleViewModeChange} />

      <section id="home" ref={heroRef} className="hero-shell relative min-h-[100dvh] overflow-hidden">
        <BackgroundVideo src="/assets/home-bottom-video-no-subtitles.mp4" poster="/assets/stills/residual-altar.webp" />
        <div className="hero-frost-layer" aria-hidden="true" />
        <div className="hero-clarity-ring" aria-hidden="true" />
        <GhostCursor
          className="hero-water-cursor"
          color="#ff9b88"
          trailLength={64}
          inertia={0.58}
          grainIntensity={0.025}
          bloomStrength={0.1}
          bloomRadius={1.15}
          bloomThreshold={0.02}
          brightness={1.05}
          edgeIntensity={0}
          zIndex={3}
        />
        <div className="absolute inset-0 z-[1] bg-[linear-gradient(90deg,#090203_0%,rgba(9,2,3,0.58)_24%,rgba(9,2,3,0.16)_52%,rgba(9,2,3,0)_76%)]" />
        <div className="absolute inset-0 z-[1] bg-[linear-gradient(0deg,#060203_0%,rgba(6,2,3,0.58)_11%,rgba(6,2,3,0)_36%)]" />
        <div className="hero-grid-lines" aria-hidden="true" />
        <svg className="hero-glow" viewBox="0 0 900 220" aria-hidden="true">
          <defs>
            <filter id="cyan-glow" x="-20%" y="-80%" width="140%" height="260%">
              <feGaussianBlur stdDeviation="25" />
            </filter>
          </defs>
          <ellipse cx="450" cy="96" rx="330" ry="46" fill="#e52c30" opacity="0.32" filter="url(#cyan-glow)" />
          <ellipse cx="450" cy="112" rx="260" ry="28" fill="#2a0506" opacity="0.56" filter="url(#cyan-glow)" />
        </svg>
        <HeroAtmosphere />
        <div className="bottom-blur-overlay absolute inset-0 z-[2] pointer-events-none" />

        <div className="relative z-10 flex min-h-[100dvh] items-end px-4 pb-10 pt-24 sm:px-6 sm:pb-12 md:px-12 lg:pb-16">
          <div className="mx-auto w-full max-w-[1400px]">
            <div className="hero-content max-w-5xl">
              <p className="animate-blur-fade-up hero-eyebrow" style={{ animationDelay: '300ms' }}>
                Emore / Graduation Portfolio 2026
              </p>

              <h1 className="animate-blur-fade-up hero-title" style={{ animationDelay: '420ms' }}>
                <span className="hero-title-en">
                  <BlurWords text="GongYueyue's Portfolio" split="word" delay={520} />
                </span>
                <span className="hero-title-cn">
                  <BlurWords text="龚玥月作品集" split="char" delay={780} />
                </span>
              </h1>

              <div className="animate-blur-fade-up hero-actions mt-8 flex flex-wrap gap-3 sm:gap-4" style={{ animationDelay: '650ms' }}>
                <a className="primary-button" href="#films">
                  查看作品 <ArrowRight size={18} />
                </a>
                <button className="liquid-glass glass-button" type="button" onClick={() => setProfileOpen(true)}>
                  个人简介 <User size={18} />
                </button>
                <a className="liquid-glass glass-button" href="/assets/docs/gong-yueyue-portfolio.pdf" download>
                  <ArrowDownToLine size={18} /> 下载作品集
                </a>
              </div>
            </div>
          </div>
        </div>
        <ProfileLanyard open={profileOpen} onClose={() => setProfileOpen(false)} />
      </section>

      <section className="relative z-10 border-y border-white/8 bg-[#060203] px-4 py-8 sm:px-6 md:px-12">
        <div className="summary-strip-grid mx-auto grid max-w-[1400px] gap-4 md:grid-cols-4">
          {sectionSummaries.map(([title, summary], index) => (
            <div
              className="reveal summary-tile spotlight-surface"
              style={{ transitionDelay: `${index * 70}ms` }}
              onPointerMove={handleInteractivePointerMove}
              onPointerLeave={handleInteractivePointerLeave}
              key={title}
            >
              <p className="text-lg tracking-[-0.03em] text-white">{title}</p>
              <p className="mt-3 text-sm leading-6 text-white/58">{summary}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="films" className="section-block bg-[#100507]">
        <SectionMotionLayer image="/assets/stills/red-throne.webp" variant="film" />
        <div className="mx-auto max-w-[1400px]">
          <SectionHeader
            title="短片作品"
            body="以《剩余维度》为核心，整合短片美术、服装化妆、数字动画和独立视效片段。"
          />

          <div className="film-feature-layout mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_420px]">
            <div className="reveal overflow-hidden rounded-[28px] border border-white/10 bg-[#16080a]">
              <video className="aspect-video w-full bg-black object-cover" src="/assets/hero-trailer.mp4" poster="/assets/stills/residual-altar.webp" controls playsInline />
              <div className="p-5 sm:p-8">
                <div className="flex flex-wrap gap-3 text-sm text-white/58">
                  <span>AI 影像短片</span>
                  <span>毕业设计</span>
                  <span>视听风格设定</span>
                </div>
                <h3 className="mt-4 text-3xl tracking-[-0.04em] sm:text-5xl">《剩余维度》</h3>
                <p className="mt-4 max-w-3xl text-base leading-8 text-white/64">
                  这是一次寻找意义的旅程：从意识的探索，到宿命的揭示；从文字到影像，从想象到现实。
                </p>
              </div>
            </div>

            <div className="reveal grid gap-4" style={{ transitionDelay: '90ms' }}>
              <FeaturePanel icon={<Eye size={20} />} title="视觉风格" items={['科幻、神秘', '暗黑、深邃', '异域、奇观', '仪式、宿命']} />
              <FeaturePanel icon={<Film size={20} />} title="听觉风格" items={['氛围主导', '低频冲击', '人声吟唱', '节奏递进']} />
            </div>
          </div>

          <div className="portfolio-card-grid film-project-grid mt-12">
            {filmWorks.map((item, index) => (
              <WorkCard key={item.title} item={item} index={index} onOpen={() => setActiveWork(item)} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-block bg-[#0a0304]">
        <SectionMotionLayer image="/assets/stills/crowd-ritual.webp" variant="process" />
        <div className="mx-auto max-w-[1400px]">
          <SectionHeader title="《剩余维度》制作流程" body="从世界观到成片输出，保留展板中的完整创作链路，并转化为网页叙事。" titleClassName="section-title-no-wrap" />
          <div className="process-grid mt-10">
            {processSteps.map(([title, body], index) => (
              <div className="reveal process-step" style={{ transitionDelay: `${index * 45}ms` }} key={title}>
                <span className="process-index">{String(index + 1).padStart(2, '0')}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="scenes" className="section-block bg-[#100507]">
        <SectionMotionLayer image="/assets/stills/dark-red-marsh.webp" variant="scene" />
        <div className="mx-auto max-w-[1400px]">
          <SectionHeader title="场景设计" body="通过 AI 场景生成、舞台效果图、模型和手绘训练，建立可叙事的空间系统。" />

          <div className="scene-feature-layout mt-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
            <button className="reveal image-stage" onClick={() => setLightbox(currentStill)} type="button">
              <img src={currentStill.src} alt={currentStill.title} />
              <div className="stage-copy">
                <span>{currentStill.group}</span>
                <h3>{currentStill.title}</h3>
                <p>{currentStill.caption}</p>
              </div>
            </button>

            <div className="reveal flex flex-col justify-between gap-4" style={{ transitionDelay: '90ms' }}>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
                <p className="text-sm text-white/56">场景控制</p>
                <h3 className="mt-3 text-3xl tracking-[-0.04em]">冷青、幽紫与血红之间的空间转场</h3>
                <p className="mt-4 text-sm leading-7 text-white/62">
                  场景不只承担画面奇观，也承担情绪分区：玻璃空间是探索，紫色森林是神性，红色仪式空间是压迫和终局。
                </p>
              </div>
              <div className="flex gap-3">
                <button className="liquid-glass icon-button" type="button" onClick={prevStill} aria-label="上一张场景">
                  <ChevronLeft size={20} />
                </button>
                <button className="liquid-glass icon-button" type="button" onClick={nextStill} aria-label="下一张场景">
                  <ChevronRight size={20} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {stills.map((still, index) => (
                  <button
                    className={`thumb-button ${index === activeStill ? 'is-active' : ''}`}
                    key={still.src}
                    onClick={() => setActiveStill(index)}
                    type="button"
                    aria-label={still.title}
                  >
                    <img src={still.src} alt="" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="portfolio-card-grid mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {sceneWorks.map((item, index) => (
              <WorkCard key={item.title} item={item} index={index} onOpen={() => setActiveWork(item)} />
            ))}
          </div>
        </div>
      </section>

      <section id="characters" className="section-block bg-[#0a0304]">
        <SectionMotionLayer image={characterAssetGroups.styling[0]} variant="character" />
        <div className="mx-auto max-w-[1400px]">
          <SectionHeader title="人物造型" body="从历史服化道到特效妆面，从戏剧人物到民族妆造，强调角色身份与影像质感。" />

          <div className="character-feature-layout mt-10 grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
            <div className="reveal character-copy">
              <Users size={26} />
              <h3>服装、化妆、发型和道具共同服务角色叙事。</h3>
              <p>
                旧作品集中保留了历史人物、原创话剧、影视造型基础、特效刀伤、民族妆造、艺人合作和时尚摄影等完整内容。网页中重新整理重点项目，让每一组人物造型都能以图像、角色和项目资料展开。
              </p>
            </div>
            <div className="portfolio-card-grid grid gap-4 sm:grid-cols-2">
              {characterWorks.map((item, index) => (
                <WorkCard key={item.title} item={item} index={index} onOpen={() => setActiveWork(item)} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="creative" className="section-block bg-[#100507]">
        <SectionMotionLayer image={creativeAssetGroups.collaboration[0]} variant="creative" />
        <div className="mx-auto max-w-[1400px]">
          <SectionHeader title="创意设计" body="把软件能力转化为风格表达，覆盖动态海报、视效合成、Blender 场景和跨媒介创作。" />

          <div className="creative-feature-layout mt-10 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <SourceMosaic
              label="Canva source materials"
              title="从动态海报到综合视觉练习"
              body="旧版作品集中的平面、手绘、三维和摄影合作素材已拆出为独立图片，在网页中重新组织展示。"
              images={[
                ...creativeAssetGroups.motionPoster.slice(0, 2),
                ...creativeAssetGroups.designPractice.slice(0, 3),
                ...creativeAssetGroups.collaboration.slice(0, 1),
              ]}
            />
            <div className="portfolio-card-grid grid gap-4 sm:grid-cols-2">
              {creativeWorks.map((item, index) => (
                <WorkCard key={item.title} item={item} index={index} onOpen={() => setActiveWork(item)} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/8 bg-[#060203] px-4 py-10 sm:px-6 md:px-12">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-2xl tracking-[-0.04em]">龚玥月 / Emore</p>
            <p className="mt-2 text-sm text-white/52">影像美术 / AI 短片 / 人物造型 / 创意设计</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-white/62">
            <a className="footer-link" href="mailto:383158353@qq.com">
              <Mail size={16} /> 383158353@qq.com
            </a>
            <span className="footer-link">
              <User size={16} /> 重庆大学美视电影学院
            </span>
          </div>
        </div>
      </footer>

      {lightbox && <Lightbox item={lightbox} onClose={() => setLightbox(null)} />}
      {activeWork && <WorkDetailModal item={activeWork} onClose={() => setActiveWork(null)} onPreview={setLightbox} />}
      </main>
    </ClickSpark>
  )
}

function ClickSpark({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sparksRef = useRef<Spark[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return

    const resizeCanvas = () => {
      const rect = parent.getBoundingClientRect()
      const pixelRatio = window.devicePixelRatio || 1
      canvas.width = Math.max(1, Math.floor(rect.width * pixelRatio))
      canvas.height = Math.max(1, Math.floor(rect.height * pixelRatio))
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      const context = canvas.getContext('2d')
      context?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    }

    const observer = new ResizeObserver(resizeCanvas)
    observer.observe(parent)
    resizeCanvas()

    return () => observer.disconnect()
  }, [])

  const drawSpark = useCallback((timestamp: number) => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    context.clearRect(0, 0, canvas.width, canvas.height)
    sparksRef.current = sparksRef.current.filter((spark) => {
      const duration = 440
      const elapsed = timestamp - spark.startTime
      if (elapsed >= duration) return false

      const progress = elapsed / duration
      const eased = progress * (2 - progress)
      const distance = eased * 24
      const lineLength = 10 * (1 - eased)
      const x1 = spark.x + distance * Math.cos(spark.angle)
      const y1 = spark.y + distance * Math.sin(spark.angle)
      const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle)
      const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle)

      context.strokeStyle = `rgba(229, 44, 48, ${1 - progress})`
      context.lineWidth = 1.8
      context.beginPath()
      context.moveTo(x1, y1)
      context.lineTo(x2, y2)
      context.stroke()

      return true
    })

    if (sparksRef.current.length) requestAnimationFrame(drawSpark)
  }, [])

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const now = performance.now()
    const sparkCount = 8

    sparksRef.current.push(
      ...Array.from({ length: sparkCount }, (_, index) => ({
        x,
        y,
        angle: (Math.PI * 2 * index) / sparkCount,
        startTime: now,
      })),
    )
    requestAnimationFrame(drawSpark)
  }

  return (
    <div className="click-spark-shell" onClick={handleClick}>
      <canvas className="click-spark-canvas" ref={canvasRef} aria-hidden="true" />
      {children}
    </div>
  )
}

function VersionSwitch({
  viewMode,
  onViewModeChange,
  compact = false,
}: {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  compact?: boolean
}) {
  return (
    <div className={`version-switch ${compact ? 'is-compact' : ''}`} role="group" aria-label="查看版本">
      {(['desktop', 'mobile'] as const).map((mode) => (
        <button
          className={viewMode === mode ? 'is-active' : ''}
          key={mode}
          type="button"
          onClick={() => onViewModeChange(mode)}
          aria-pressed={viewMode === mode}
        >
          {mode === 'desktop' ? '电脑版' : '手机版'}
        </button>
      ))}
    </div>
  )
}

function Navigation({
  menuOpen,
  setMenuOpen,
  viewMode,
  onViewModeChange,
}: {
  menuOpen: boolean
  setMenuOpen: (value: boolean) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}) {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-4 py-4 sm:px-6 md:px-12">
      <nav className="liquid-glass nav-shell mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4">
        <a className="animate-blur-fade-up text-sm font-semibold tracking-[0.14em] text-white" href="#home" style={{ animationDelay: '0ms' }}>
          GONG YUEYUE / EMORE
        </a>

        <div className="desktop-nav-links hidden items-center gap-7 lg:flex">
          {navItems.map((item, index) => (
            <a
              className="animate-blur-fade-up text-base text-white/74 transition-colors hover:text-[var(--accent)]"
              href={item.href}
              key={item.label}
              style={{ animationDelay: `${100 + index * 45}ms` }}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="desktop-nav-actions hidden items-center gap-3 lg:flex">
          <VersionSwitch viewMode={viewMode} onViewModeChange={onViewModeChange} />
          <a className="animate-blur-fade-up liquid-glass nav-action" href="/assets/docs/gong-yueyue-portfolio.pdf" download style={{ animationDelay: '380ms' }}>
            <ArrowDownToLine size={17} /> 下载作品集
          </a>
          <a className="animate-blur-fade-up liquid-glass nav-circle" href="mailto:383158353@qq.com" aria-label="联系" style={{ animationDelay: '430ms' }}>
            <Mail size={17} />
          </a>
        </div>

        <button
          className="animate-blur-fade-up liquid-glass nav-circle nav-toggle"
          style={{ animationDelay: '360ms' }}
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="菜单"
        >
          <Menu className={`menu-icon ${menuOpen ? 'is-hidden' : ''}`} size={20} />
          <X className={`menu-icon is-x ${menuOpen ? 'is-open' : ''}`} size={20} />
        </button>
      </nav>

      <div className={`mobile-menu ${menuOpen ? 'is-open' : ''}`}>
        <VersionSwitch viewMode={viewMode} onViewModeChange={onViewModeChange} compact />
        {navItems.map((item, index) => (
          <a href={item.href} key={item.label} onClick={() => setMenuOpen(false)} style={{ transitionDelay: `${index * 45}ms` }}>
            {item.label}
          </a>
        ))}
        <a className="mobile-download-link" href="/assets/docs/gong-yueyue-portfolio.pdf" download onClick={() => setMenuOpen(false)}>
          下载作品集
        </a>
      </div>
    </header>
  )
}

function HeroAtmosphere() {
  return (
    <div className="hero-atmosphere" aria-hidden="true">
      <div className="hero-focus-light" />
      <div className="hero-orbit hero-orbit-one" />
      <div className="hero-orbit hero-orbit-two" />
      <div className="hero-orbit hero-orbit-three" />
      <div className="hero-light-sweep" />
      <div className="hero-frame-lines">
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}

function BlurWords({ text, split = 'word', delay = 0 }: { text: string; split?: 'word' | 'char'; delay?: number }) {
  const tokens = split === 'char' ? Array.from(text) : text.split(' ')

  return (
    <>
      {tokens.map((token, index) => (
        <span
          className={`blur-token ${split === 'word' ? 'is-word' : 'is-char'}`}
          style={{ animationDelay: `${delay + index * (split === 'word' ? 90 : 62)}ms` }}
          key={`${token}-${index}`}
        >
          {token}
        </span>
      ))}
    </>
  )
}

function ProfileLanyard({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <div className={`lanyard-layer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <button className="lanyard-backdrop" type="button" onClick={onClose} aria-label="关闭个人简介" tabIndex={open ? 0 : -1} />
      <button className="nav-circle lanyard-close" type="button" onClick={onClose} aria-label="关闭个人简介" tabIndex={open ? 0 : -1}>
        <X size={18} />
      </button>
      <div className="lanyard-physics-stage">
        <div className="lanyard-stage-note" aria-hidden="true">
          <span>Drag / Flip</span>
          <span>个人简介</span>
        </div>
        {open ? (
          <Lanyard
            position={[0, 0, 27]}
            gravity={[0, -40, 0]}
            fov={20.5}
            frontImage="/assets/profile-lanyard-front-v2.png"
            backImage="/assets/profile-lanyard-back-v2.png"
            imageFit="cover"
            lanyardImage="/assets/profile-lanyard-band.svg"
            lanyardWidth={0.84}
          />
        ) : null}
      </div>
    </div>
  )
}

function BackgroundVideo({ src, poster }: { src: string; poster: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let active = true
    let hls: { destroy: () => void } | undefined
    let frame = 0
    let restartTimer = 0
    let fadingOut = false
    const visibleOpacity = 0.88

    const fadeTo = (target: number, duration = 650) => {
      cancelAnimationFrame(frame)
      const start = Number.parseFloat(video.style.opacity || '0') || 0
      const startTime = performance.now()

      const tick = (now: number) => {
        const progress = Math.min(1, (now - startTime) / duration)
        const eased = 1 - Math.pow(1 - progress, 3)
        video.style.opacity = String(start + (target - start) * eased)
        if (progress < 1) frame = requestAnimationFrame(tick)
      }

      frame = requestAnimationFrame(tick)
    }

    const handleLoadedData = () => {
      if (!active) return
      video.style.opacity = '0'
      void video.play().catch(() => undefined)
      fadeTo(visibleOpacity, 850)
    }

    const handleTimeUpdate = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return
      const remaining = video.duration - video.currentTime
      if (!fadingOut && remaining > 0 && remaining <= 0.55) {
        fadingOut = true
        fadeTo(0, 500)
      }
    }

    const handleEnded = () => {
      video.style.opacity = '0'
      restartTimer = window.setTimeout(() => {
        if (!active) return
        video.currentTime = 0
        fadingOut = false
        void video.play().catch(() => undefined)
        fadeTo(visibleOpacity, 850)
      }, 100)
    }

    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)

    if (src.endsWith('.m3u8')) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src
      } else {
        void import('hls.js').then(({ default: Hls }) => {
          if (!active || !Hls.isSupported()) return
          const player = new Hls({ enableWorker: false })
          player.loadSource(src)
          player.attachMedia(video)
          hls = player
        })
      }
    } else {
      video.src = src
    }

    if (video.readyState >= 2) handleLoadedData()

    return () => {
      active = false
      clearTimeout(restartTimer)
      cancelAnimationFrame(frame)
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
      hls?.destroy()
    }
  }, [src])

  return (
    <video
      ref={videoRef}
      className="hero-video absolute inset-0 z-0 h-full w-full object-cover"
      poster={poster}
      autoPlay
      muted
      playsInline
      preload="auto"
    />
  )
}

function SectionHeader({ title, body, titleClassName }: { title: string; body: string; titleClassName?: string }) {
  return (
    <div className="reveal max-w-3xl">
      <h2 className={`section-title ${titleClassName ?? ''}`}>{title}</h2>
      <p className="mt-4 text-base leading-7 text-white/62 sm:text-lg">{body}</p>
    </div>
  )
}

function FeaturePanel({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <div
      className="spotlight-surface rounded-[24px] border border-white/10 bg-white/[0.035] p-5 sm:p-6"
      onPointerMove={handleInteractivePointerMove}
      onPointerLeave={handleInteractivePointerLeave}
    >
      <div className="flex items-center gap-3 text-white/86">
        {icon}
        <h3 className="text-xl tracking-[-0.03em]">{title}</h3>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {items.map((item) => (
          <span className="feature-token" key={item}>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function SectionMotionLayer({ image, variant }: { image: string; variant: 'film' | 'process' | 'scene' | 'character' | 'creative' }) {
  const palette: Record<typeof variant, string[]> = {
    film: ['#270304', '#e52c30', '#ff7a5c'],
    process: ['#190103', '#8c1015', '#e52c30'],
    scene: ['#220506', '#b9151d', '#f04b38'],
    character: ['#170204', '#9d151d', '#f25c52'],
    creative: ['#210305', '#d42a31', '#ff8b62'],
  }

  return (
    <div className={`section-motion-layer section-motion-${variant}`} aria-hidden="true">
      <div className="section-motion-image" style={{ backgroundImage: `url(${image})` }} />
      <LiquidEther
        className="section-liquid-ether"
        colors={palette[variant]}
        mouseForce={14}
        cursorSize={150}
        resolution={0.44}
        autoSpeed={0.32}
        autoIntensity={1.35}
        autoResumeDelay={900}
      />
    </div>
  )
}

function SourceMosaic({ label, title, body, images }: { label: string; title: string; body: string; images: string[] }) {
  return (
    <div
      className="reveal source-mosaic spotlight-surface"
      onPointerMove={handleInteractivePointerMove}
      onPointerLeave={handleInteractivePointerLeave}
    >
      <div className="source-mosaic-copy">
        <span>{label}</span>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
      <div className="source-mosaic-grid" aria-hidden="true">
        {images.slice(0, 6).map((image, index) => (
          <img src={image} alt="" loading="lazy" key={`${image}-${index}`} />
        ))}
      </div>
    </div>
  )
}

function WorkCard({ item, index, onOpen }: { item: WorkItem; index: number; onOpen?: () => void }) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!onOpen) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpen()
    }
  }

  return (
    <article
      className={`reveal work-card spotlight-surface ${onOpen ? 'is-clickable' : ''}`}
      style={{ transitionDelay: `${index * 55}ms` }}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      onPointerMove={handleInteractivePointerMove}
      onPointerLeave={handleInteractivePointerLeave}
    >
      {item.assets && (
        <div className="work-card-assets">
          {item.assets.slice(0, 4).map((asset, assetIndex) => (
            <img src={asset} alt={`${item.title} 素材 ${assetIndex + 1}`} loading="lazy" key={asset} />
          ))}
        </div>
      )}
      <div className="flex items-center justify-between gap-4">
        <Sparkles size={19} className="text-[var(--accent)]" />
        <span className="text-xs text-white/42">SOURCE MATERIALS</span>
      </div>
      <h3>{item.title}</h3>
      <p className="role">{item.role}</p>
      <p className="detail">{item.detail}</p>
      {onOpen && (
        <span className="work-card-action">
          查看项目资料 <ArrowRight size={16} />
        </span>
      )}
    </article>
  )
}

function WorkDetailModal({
  item,
  onClose,
  onPreview,
}: {
  item: WorkItem
  onClose: () => void
  onPreview: (item: Still) => void
}) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const gallery = item.assets ?? []
  const focus = item.focus ?? ['视觉资料', '项目执行', '风格控制']
  const materials = item.materials ?? ['项目图像', '作品集资料', '创作说明']
  const process = item.process ?? ['资料整理', '视觉方案', '执行落地', '成片归档']

  return (
    <div className="project-detail" role="dialog" aria-modal="true" aria-label={`${item.title} 项目详情`}>
      <button className="project-detail-backdrop" type="button" onClick={onClose} aria-label="关闭项目详情" />
      <div className="project-detail-panel">
        <button className="liquid-glass nav-circle project-detail-close" type="button" onClick={onClose} aria-label="关闭">
          <X size={20} />
        </button>

        <div className="project-detail-hero">
          <div>
            <span className="project-detail-kicker">PROJECT FILE</span>
            <h2>{item.title}</h2>
            <p className="project-detail-role">{item.role}</p>
          </div>
          <p>{item.detail}</p>
        </div>

        <div className="project-detail-layout">
          <section className="project-detail-board">
            <div className="project-board-heading">
              <span>图像资料</span>
              <span>{String(gallery.length).padStart(2, '0')} IMAGES</span>
            </div>
            <div className="project-gallery">
              {gallery.map((asset, index) => (
                <button
                  className="project-gallery-item"
                  type="button"
                  key={`${asset}-${index}`}
                  onClick={() =>
                    onPreview({
                      src: asset,
                      title: `${item.title} 图像资料 ${index + 1}`,
                      caption: item.detail,
                      group: item.role,
                    })
                  }
                >
                  <img src={asset} alt={`${item.title} 图像资料 ${index + 1}`} loading="lazy" />
                </button>
              ))}
            </div>
          </section>

          <aside className="project-detail-info">
            <div className="project-info-block project-intro-block">
              <h3>项目简介</h3>
              <p>{item.detail}</p>
            </div>

            <div className="project-info-block">
              <h3>素材下载</h3>
              <div className="project-download-list">
                {gallery.map((asset, index) => (
                  <a href={asset} download key={`${asset}-download`}>
                    <ArrowDownToLine size={14} /> 图像素材 {String(index + 1).padStart(2, '0')}
                  </a>
                ))}
              </div>
            </div>

            <div className="project-info-block">
              <h3>创作重点</h3>
              <div className="project-token-list">
                {focus.map((value) => (
                  <span key={value}>{value}</span>
                ))}
              </div>
            </div>

            <div className="project-info-block">
              <h3>项目资料</h3>
              <ul>
                {materials.map((value) => (
                  <li key={value}>{value}</li>
                ))}
              </ul>
            </div>

            <div className="project-info-block">
              <h3>制作链路</h3>
              <ol>
                {process.map((value, index) => (
                  <li key={value}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    {value}
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>

      </div>
    </div>
  )
}

function Lightbox({ item, onClose }: { item: Still; onClose: () => void }) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="lightbox" role="dialog" aria-modal="true">
      <button className="lightbox-backdrop" type="button" onClick={onClose} aria-label="关闭预览" />
      <div className="lightbox-panel">
        <button className="liquid-glass nav-circle lightbox-close" type="button" onClick={onClose} aria-label="关闭">
          <X size={20} />
        </button>
        <img src={item.src} alt={item.title} />
        <div className="lightbox-copy">
          <span>{item.group}</span>
          <h3>{item.title}</h3>
          <p>{item.caption}</p>
        </div>
      </div>
    </div>
  )
}

export default App
