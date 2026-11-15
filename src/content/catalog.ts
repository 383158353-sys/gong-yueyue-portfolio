export type Picture = {
  src: string
  alt: string
}

export type Work = {
  id: string
  title: string
  role: string
  summary: string
  images: Picture[]
  note?: string
}

const still = (file: string, alt: string): Picture => ({
  src: `/assets/stills/${file}.webp`,
  alt,
})

const canva = (group: 'film' | 'scene' | 'character' | 'creative', file: string, alt: string): Picture => ({
  src: `/assets/canva-source/${group}/${file}.webp`,
  alt,
})

export const homeSpread: Array<Picture & { title: string; caption: string }> = [
  {
    ...still('residual-altar', '《剩余维度》静帧：穹顶祭坛'),
    title: '《剩余维度》',
    caption: '穹顶祭坛。毕业设计短片静帧，来自仓库里的真实画面。',
  },
  {
    ...still('red-throne', '《剩余维度》静帧：赤色王座'),
    title: '《剩余维度》',
    caption: '赤色王座。垂直红光与骨质阶梯。',
  },
  {
    ...still('crystal-stair', '《剩余维度》静帧：水晶阶梯'),
    title: '《剩余维度》',
    caption: '水晶阶梯。透明阶梯与冷青色碎石。',
  },
]

export const films: Work[] = [
  {
    id: 'residual',
    title: '《剩余维度》',
    role: 'AI 影像短片 / 毕业设计',
    summary:
      '现有站点文案写的是：围绕未来、神秘、仪式和压迫感建立视听，完成世界观、分镜、视觉生成、后期与声音。仓库里有静帧。成片 mp4 是 Git LFS 指针，当前不能播放。公开归档没有 YouTube 链接。',
    images: [
      still('residual-altar', '《剩余维度》穹顶祭坛'),
      still('crystal-stair', '《剩余维度》水晶阶梯'),
      still('violet-jellyfish', '《剩余维度》紫色菌林'),
      still('crowd-ritual', '《剩余维度》群像仪式'),
    ],
    note: 'YouTube 链接待补。',
  },
  {
    id: 'crossing',
    title: '《相交线》',
    role: '未来感短片 / 美术指导',
    summary:
      '作品集原页标题为「未来感短片《相交线》美术指导」。这一页是剧照。没有可播放成片，也没有 YouTube 链接。',
    images: [
      canva('film', 'film-p07-03', '《相交线》剧照'),
      canva('film', 'film-p07-04', '《相交线》剧照'),
      canva('film', 'film-p07-05', '《相交线》剧照'),
    ],
    note: 'YouTube 链接待补。',
  },
  {
    id: 'jade',
    title: '《玉夬》',
    role: '超现实短片 / 服装化妆设计',
    summary:
      '作品集原页标题为「超现实短片《玉夬》（服装化妆设计）」。页面是剧照和妆面。没有 YouTube 链接。',
    images: [
      canva('film', 'film-p08-07', '《玉夬》妆造'),
      canva('film', 'film-p08-08', '《玉夬》妆造'),
      canva('film', 'film-p08-04', '《玉夬》剧照'),
    ],
    note: 'YouTube 链接待补。',
  },
  {
    id: 'numbers',
    title: '《巾帼数韵》',
    role: '数字动画短片 / 分镜绘制、美术造型、后期动画',
    summary:
      '作品集原页写明：主创负责分镜绘制、美术造型、后期动画；讲述清代女数学家王贞仪的一生；获全国大学生计算机设计大赛市一等奖、全国二等奖。没有 YouTube 链接。',
    images: [
      canva('film', 'film-p10-06', '《巾帼数韵》画面'),
      canva('film', 'film-p11-03', '《巾帼数韵》画面'),
      canva('film', 'film-p12-08', '《巾帼数韵》画面'),
    ],
    note: 'YouTube 链接待补。',
  },
  {
    id: 'remains',
    title: '《遗骸》',
    role: '独立视效短片片段 / 一人制作',
    summary:
      '作品集原页写明这是独立创作特效短片片段。灵感来自对未来世界“死亡”的思考，作者一人独立制作，并在片中出镜。成片不在可播放文件里，没有 YouTube 链接。',
    images: [
      canva('film', 'film-p14-03', '《遗骸》画面'),
      canva('film', 'film-p15-03', '《遗骸》画面'),
      canva('film', 'film-p16-07', '《遗骸》画面'),
    ],
    note: 'YouTube 链接待补。',
  },
  {
    id: 'mom',
    title: '《我妈没把我养好》',
    role: '爱奇艺 · 鲍德熹 AI 剧场电影 / 参与影片美术与导演工作',
    summary:
      '2026 年确认的项目经历：参与影片美术与导演工作。仓库里没有该片剧照、成片或 YouTube 链接，所以这里不配图，也不把其他旧片的画面套过来。',
    images: [],
    note: 'YouTube 链接待补。没有剧照。',
  },
]

export const projects: Work[] = [
  ...films.filter((film) => film.id !== 'mom'),
  films.find((film) => film.id === 'mom')!,
  {
    id: 'red-hood',
    title: '儿童剧《小红帽》',
    role: '舞台项目 / 效果图、平面图、海报',
    summary: '沿用作品集归档里的项目记录：舞台空间、效果图和视觉物料。细案没有另写。',
    images: [
      canva('scene', 'scene-p19-03', '儿童剧《小红帽》效果图'),
      canva('scene', 'scene-p19-05', '儿童剧《小红帽》资料'),
    ],
  },
  {
    id: 'motion',
    title: '动态海报与短视频特效',
    role: 'Nuke / AE 合成练习',
    summary: '作品集归档中的动态视觉、光效和合成练习。不是单独的院线成片。',
    images: [
      canva('creative', 'creative-p18-03', '动态海报练习'),
      canva('creative', 'creative-p18-04', '动态海报练习'),
    ],
  },
]

export const scenes: Work[] = [
  {
    id: 'residual-world',
    title: '《剩余维度》场景',
    role: 'AI 场景静帧',
    summary: '毕业设计短片里已经整理出的场景静帧：冷青、幽紫和血红几组空间。',
    images: [
      still('red-pyramid', '《剩余维度》红色金字塔'),
      still('dark-red-marsh', '《剩余维度》暗红沼泽'),
      still('luminous-tree', '《剩余维度》发光古树'),
      still('crowd-ritual', '《剩余维度》群像仪式'),
    ],
  },
  {
    id: 'red-hood-scene',
    title: '儿童剧《小红帽》',
    role: '效果图 / 平面图 / 海报',
    summary: '作品集场景部分的舞台项目图。',
    images: [
      canva('scene', 'scene-p19-03', '《小红帽》舞台图'),
      canva('scene', 'scene-p19-07', '《小红帽》舞台图'),
      canva('scene', 'scene-p19-08', '《小红帽》舞台图'),
    ],
  },
  {
    id: 'stage-renders',
    title: '舞台效果图',
    role: '《失明城市》《风声》《海鸥》《杨澜公》',
    summary: '作品集归档中的四组舞台效果图，按原目录名称列出。',
    images: [
      canva('scene', 'scene-p20-03', '舞台效果图'),
      canva('scene', 'scene-p20-05', '舞台效果图'),
      canva('scene', 'scene-p21-03', '舞台效果图'),
      canva('scene', 'scene-p21-04', '舞台效果图'),
    ],
  },
  {
    id: 'stage-models',
    title: '舞台模型与场景练习',
    role: '模型 / 手绘 / 板绘',
    summary: '作品集里的模型、手绘和板绘练习。',
    images: [
      canva('scene', 'scene-p22-06', '舞台模型'),
      canva('scene', 'scene-p22-09', '舞台模型'),
      canva('scene', 'scene-p24-03', '场景练习'),
    ],
  },
]

export const characters: Work[] = [
  {
    id: 'cixi',
    title: '《德龄与慈禧》',
    role: '服装化妆设计',
    summary: '作品集人物部分的服化方案。',
    images: [
      canva('character', 'character-p27-04', '《德龄与慈禧》造型'),
      canva('character', 'character-p27-05', '《德龄与慈禧》造型'),
      canva('character', 'character-p27-03', '《德龄与慈禧》造型'),
    ],
  },
  {
    id: 'shazhengjie',
    title: '《沙正街174号》',
    role: '原创话剧 / 化妆设计',
    summary: '作品集人物部分的话剧妆造。',
    images: [
      canva('character', 'character-p28-03', '《沙正街174号》造型'),
      canva('character', 'character-p28-04', '《沙正街174号》造型'),
      canva('character', 'character-p28-05', '《沙正街174号》造型'),
    ],
  },
  {
    id: 'harbin',
    title: '《哈尔滨之恋》',
    role: '服装化妆设计',
    summary:
      '作品集原页标题为「《哈尔滨之恋》服装化妆设计」。这是本科作品集里的服化项目，和爱奇艺鲍德熹 AI 剧场电影《我妈没把我养好》不是同一个项目。',
    images: [
      canva('character', 'character-p29-04', '《哈尔滨之恋》服装化妆'),
      canva('character', 'character-p29-05', '《哈尔滨之恋》服装化妆'),
      canva('character', 'character-p29-07', '《哈尔滨之恋》服装化妆'),
    ],
  },
  {
    id: 'period-makeup',
    title: '影视造型基础',
    role: '秦汉 / 民国 / 清朝 / 年龄妆 / 特效刀伤',
    summary: '作品集中的历史时期、年龄妆和特效妆练习。',
    images: [
      canva('character', 'character-p30-03', '影视造型基础'),
      canva('character', 'character-p30-06', '影视造型基础'),
      canva('character', 'character-p31-04', '影视造型基础'),
    ],
  },
  {
    id: 'styling',
    title: '人物造型与民族妆造',
    role: '《安魂曲》《无名》《彝族》等',
    summary: '作品集后部的服装、妆面和造型练习，按原目录归在人物页。',
    images: [
      canva('character', 'character-p34-03', '人物造型'),
      canva('character', 'character-p35-03', '人物造型'),
      canva('character', 'character-p38-04', '人物造型'),
    ],
  },
]

export const portrait = {
  src: '/assets/canva-source/profile/profile-p04-08.webp',
  alt: '龚玥月肖像，来自作品集归档',
}

export const filmIds = films.map((film) => film.id)
