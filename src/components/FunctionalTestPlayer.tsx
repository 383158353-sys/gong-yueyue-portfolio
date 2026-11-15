import { useState } from 'react'
import { FUNCTIONAL_TEST_VIDEO_ID } from '../lib/youtube'
import YoutubeEmbed from './YoutubeEmbed'

export default function FunctionalTestPlayer() {
  const [loaded, setLoaded] = useState(false)

  return (
    <section className="functional-test" aria-labelledby="functional-test-heading">
      <h2 id="functional-test-heading">嵌入功能测试</h2>
      <p>
        测试片是 YouTube IFrame Player API 文档里的公开示例，ID 为 {FUNCTIONAL_TEST_VIDEO_ID}。它不是龚玥月的作品。载入后只在这个区域播放，不进入上方作品，也不写入本机作品库。
      </p>
      <button type="button" onClick={() => setLoaded(true)}>
        载入测试片
      </button>
      {loaded ? (
        <div data-functional-test="loaded">
          <YoutubeEmbed videoId={FUNCTIONAL_TEST_VIDEO_ID} title="YouTube 官方嵌入示例，功能测试" />
        </div>
      ) : (
        <p className="note">测试片尚未载入。</p>
      )}
    </section>
  )
}
