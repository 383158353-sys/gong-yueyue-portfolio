import WorkEntries from '../components/WorkEntries'
import { projects } from '../content/catalog'

export default function ProjectsPage() {
  return (
    <section className="page">
      <h1>项目</h1>
      <p className="dek">每条都是图片、标题和一段说明。图片来自仓库里的静帧或作品集拆图。没有图片的项目就空着。</p>
      <WorkEntries works={projects} />
    </section>
  )
}
