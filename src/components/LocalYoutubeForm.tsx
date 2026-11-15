import { useState } from 'react'
import { films } from '../content/catalog'
import { addLocalEntry, type LocalYoutubeEntry } from '../lib/youtube'
import YoutubeEmbed from './YoutubeEmbed'

export default function LocalYoutubeForm({
  entries,
  onChange,
}: {
  entries: LocalYoutubeEntry[]
  onChange: (entries: LocalYoutubeEntry[]) => void
}) {
  const [rawUrl, setRawUrl] = useState('')
  const [title, setTitle] = useState('')
  const [filmId, setFilmId] = useState('')
  const [error, setError] = useState('')

  const unassigned = entries.filter((entry) => !entry.filmId)

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const result = addLocalEntry(entries, {
      rawUrl,
      title,
      filmId: filmId || null,
      allowedFilmIds: films.map((film) => film.id),
    })
    if (result.error) {
      setError(result.error)
      return
    }
    setError('')
    setRawUrl('')
    setTitle('')
    setFilmId('')
    onChange(result.entries)
  }

  return (
    <section className="local-tool" aria-labelledby="local-youtube-heading">
      <h2 id="local-youtube-heading">本机 YouTube 链接</h2>
      <p>
        只写在这台浏览器的 localStorage，键名 gong-yueyue-local-youtube-v1。刷新后还在；换设备、换浏览器或清除站点数据后就没有。不会上传，也不会让其他访客看到。
      </p>
      <form onSubmit={onSubmit}>
        <label>
          YouTube 链接
          <input
            name="youtube-url"
            value={rawUrl}
            onChange={(event) => setRawUrl(event.target.value)}
            placeholder="https://www.youtube.com/watch?v= 或 https://youtu.be/"
            inputMode="url"
            autoComplete="off"
          />
        </label>
        <label>
          本机标题
          <input
            name="youtube-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="只保存在本机的标题"
            maxLength={80}
          />
        </label>
        <label>
          关联到已有作品
          <select name="youtube-film" value={filmId} onChange={(event) => setFilmId(event.target.value)}>
            <option value="">不关联，只放在下面的本机列表</option>
            {films.map((film) => (
              <option key={film.id} value={film.id}>
                {film.title}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">保存在这台浏览器</button>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>
      {unassigned.length ? (
        <div className="unassigned-list">
          <h3>未关联的本机视频</h3>
          {unassigned.map((entry) => (
            <article key={entry.videoId} data-local-video={entry.videoId}>
              <h3>{entry.title}</h3>
              <p className="note">仅本机暂存，不是公开作品。</p>
              <YoutubeEmbed videoId={entry.videoId} title={entry.title} />
              <button
                type="button"
                onClick={() => onChange(entries.filter((item) => item.videoId !== entry.videoId))}
              >
                从本机移除
              </button>
            </article>
          ))}
        </div>
      ) : (
        <p className="note">本机还没有未关联的视频。</p>
      )}
    </section>
  )
}
