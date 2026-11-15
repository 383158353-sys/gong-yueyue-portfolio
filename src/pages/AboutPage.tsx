import { portrait } from '../content/catalog'

export default function AboutPage() {
  return (
    <section className="page">
      <h1>关于</h1>
      <img className="portrait" src={portrait.src} alt={portrait.alt} />
      <p className="dek">龚玥月。当前是中国传媒大学影视美术创作专业硕士研究生一年级，2026 年 9 月入学。</p>
      <h2>研究方向</h2>
      <p>AI 影视与游戏视觉开发。</p>
      <h2>正在参与的影片</h2>
      <p>
        爱奇艺鲍德熹 AI 剧场电影《我妈没把我养好》。参与影片美术与导演工作。仓库里还没有该片剧照和成片，关于页不放别的项目图片来代替。
      </p>
      <h2>已经结束的本科</h2>
      <p>
        作品集个人页写的是：重庆大学美视电影学院戏剧影视美术设计，2022.09–2026.06。那是已经结束的本科学习，不是现在的学籍。
      </p>
      <p className="note">
        电话、邮箱、生日、学号、成绩和证件信息不放在这个网站上。旧作品里的职务只按该作品自己的页面来写，不挪到《我妈没把我养好》。
      </p>
    </section>
  )
}
