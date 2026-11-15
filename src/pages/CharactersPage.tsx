import WorkEntries from '../components/WorkEntries'
import { characters } from '../content/catalog'

export default function CharactersPage() {
  return (
    <section className="page">
      <h1>人物</h1>
      <p className="dek">人物页只放作品集里已经归档的服化与造型。《哈尔滨之恋》留在它自己的服化项目下。</p>
      <WorkEntries works={characters} />
    </section>
  )
}
