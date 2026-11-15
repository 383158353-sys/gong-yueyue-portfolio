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
        公开作品都还没有 YouTube 地址，页面上标成待补。仓库中的大视频和作品集 PDF 是 Git LFS 指针，不能在这里播放。下面的添加只作用于当前浏览器。
      </p>
      <WorkEntries works={films} localEntries={entries} onRemoveLocal={(videoId) => update(entries.filter((entry) => entry.videoId !== videoId))} />
      <LocalYoutubeForm entries={entries} onChange={update} />
      <FunctionalTestPlayer />
    </section>
  )
}
