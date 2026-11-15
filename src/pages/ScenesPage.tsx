import WorkEntries from '../components/WorkEntries'
import { scenes } from '../content/catalog'

export default function ScenesPage() {
  return (
    <section className="page">
      <h1>场景</h1>
      <p className="dek">场景图来自《剩余维度》静帧和作品集里拆出的舞台、模型页面。</p>
      <WorkEntries works={scenes} />
    </section>
  )
}
