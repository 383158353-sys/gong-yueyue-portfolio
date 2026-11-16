import layoutExample from '../content/layoutExample.json'
import YoutubeEmbed from './YoutubeEmbed'

export default function FunctionalTestPlayer() {
  return (
    <section className="layout-example" data-layout-example="true" aria-labelledby="layout-example-heading">
      <h2 id="layout-example-heading">{layoutExample.label}</h2>
      <p>{layoutExample.note}</p>
      <YoutubeEmbed videoId={layoutExample.videoId} title={layoutExample.label} />
    </section>
  )
}
