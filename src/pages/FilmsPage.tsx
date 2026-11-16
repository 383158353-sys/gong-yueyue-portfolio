import { useEffect, useState } from 'react'
import FunctionalTestPlayer from '../components/FunctionalTestPlayer'
import LocalYoutubeForm from '../components/LocalYoutubeForm'
import WorkEntries from '../components/WorkEntries'
import { films } from '../content/catalog'
import { loadLocalEntries, saveLocalEntries, type LocalYoutubeEntry } from '../lib/youtube'

export default function FilmsPage() {
  const [entries, setEntries] = useState<LocalYoutubeEntry[]>([])

  useEffect(() => {
    setEntries(loadLocalEntries(window.localStorage))
  }, [])

  const update = (next: LocalYoutubeEntry[]) => {
    setEntries(next)
    saveLocalEntries(window.localStorage, next)
  }

  return (
    <section className="page">
      <h1>影片</h1>
      <p className="dek">
        先看播放器占多大、是不是 16:9。这个播放器不是本人的作品。下面的静帧来自作品集，这些片子还没有自己的 YouTube 地址。大视频和作品集 PDF 仍是 Git LFS 指针，不能在这里播放。
      </p>
      <FunctionalTestPlayer />
      <WorkEntries works={films} localEntries={entries} onRemoveLocal={(videoId) => update(entries.filter((entry) => entry.videoId !== videoId))} />
      <LocalYoutubeForm entries={entries} onChange={update} />
    </section>
  )
}
