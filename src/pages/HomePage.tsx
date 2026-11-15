import { homeSpread } from '../content/catalog'

export default function HomePage() {
  const [lead, ...side] = homeSpread

  return (
    <section className="page home-page">
      <p className="eyebrow">中国传媒大学 · 影视美术创作</p>
      <h1>龚玥月</h1>
      <p className="dek">
        硕士研究生一年级，2026 年 9 月入学。研究方向是 AI 影视与游戏视觉开发。这一页用毕业设计《剩余维度》的静帧看版式，画面来自仓库里的作品文件。
      </p>
      <div className="spread">
        <figure>
          <img src={lead.src} alt={lead.alt} />
          <figcaption>
            <strong>{lead.title}</strong>
            <span>{lead.caption}</span>
          </figcaption>
        </figure>
        <div className="spread-side">
          {side.map((item) => (
            <figure key={item.src}>
              <img src={item.src} alt={item.alt} />
              <figcaption>
                <strong>{item.title}</strong>
                <span>{item.caption}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
