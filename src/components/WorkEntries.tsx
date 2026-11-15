import type { LocalYoutubeEntry } from '../lib/youtube'
import type { Work } from '../content/catalog'
import YoutubeEmbed from './YoutubeEmbed'

export default function WorkEntries({
  works,
  localEntries = [],
  onRemoveLocal,
}: {
  works: Work[]
  localEntries?: LocalYoutubeEntry[]
  onRemoveLocal?: (videoId: string) => void
}) {
  return (
    <div className="entry-list">
      {works.map((work) => {
        const attached = localEntries.filter((entry) => entry.filmId === work.id)
        return (
          <article className="entry" id={work.id} key={work.id} data-film-scope="public" data-work-id={work.id}>
            {work.images[0] ? (
              <img className="lead" src={work.images[0].src} alt={work.images[0].alt} />
            ) : (
              <p className="missing-media">没有可展示的图片。缺少剧照时不使用占位图。</p>
            )}
            <h2>{work.title}</h2>
            <p className="role">{work.role}</p>
            <p>{work.summary}</p>
            {work.note ? <p className="note">{work.note}</p> : null}
            {work.images.length > 1 ? (
              <div className="still-row">
                {work.images.slice(1).map((image) => (
                  <figure key={image.src}>
                    <img src={image.src} alt={image.alt} />
                    <figcaption>{image.alt}</figcaption>
                  </figure>
                ))}
              </div>
            ) : null}
            {attached.map((entry) => (
              <div className="local-playback" key={entry.videoId} data-local-video={entry.videoId}>
                <p className="note">仅本机 · {entry.title}。这条链接只存在于当前浏览器，没有公开发布。</p>
                <YoutubeEmbed videoId={entry.videoId} title={entry.title} />
                <p>
                  <a href={entry.watchUrl} target="_blank" rel="noreferrer">
                    打开原视频
                  </a>
                  {onRemoveLocal ? (
                    <button type="button" onClick={() => onRemoveLocal(entry.videoId)}>
                      从本机移除
                    </button>
                  ) : null}
                </p>
              </div>
            ))}
          </article>
        )
      })}
    </div>
  )
}
