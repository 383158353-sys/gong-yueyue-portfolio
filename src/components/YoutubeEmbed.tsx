import { useEffect, useRef, useState } from 'react'
import { createEmbedUrl, describeEmbedError } from '../lib/youtube'

type PlaybackClaim = 'none' | 'playing' | 'blocked' | 'unverified'

type YoutubePlayer = {
  destroy?: () => void
}

type YoutubeEvent = {
  data?: number
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement,
        options: {
          events?: {
            onReady?: () => void
            onStateChange?: (event: YoutubeEvent) => void
            onError?: (event: YoutubeEvent) => void
          }
        },
      ) => YoutubePlayer
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiPromise: Promise<void> | null = null

function loadYouTubeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (window.YT?.Player) return Promise.resolve()
  if (apiPromise) return apiPromise
  apiPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      resolve()
    }
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    script.onerror = () => reject(new Error('youtube api blocked'))
    document.head.appendChild(script)
  })
  return apiPromise
}

export default function YoutubeEmbed({ videoId, title }: { videoId: string; title: string }) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [claim, setClaim] = useState<PlaybackClaim>('none')
  const [message, setMessage] = useState('播放器已挂载。远程是否真的在播，要等 YouTube 返回状态。')
  const embedUrl = createEmbedUrl(videoId)
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`

  useEffect(() => {
    const host = hostRef.current
    if (!host || !embedUrl) return undefined
    let cancelled = false
    let player: YoutubePlayer | null = null
    const claimRef = { current: 'none' as PlaybackClaim }
    const src = new URL(embedUrl)
    src.searchParams.set('enablejsapi', '1')
    src.searchParams.set('origin', window.location.origin)

    const update = (next: PlaybackClaim, text: string) => {
      if (cancelled) return
      if (claimRef.current === 'playing' || claimRef.current === 'blocked') return
      claimRef.current = next
      setClaim(next)
      setMessage(text)
    }

    setClaim('none')
    setMessage('播放器已挂载。远程是否真的在播，要等 YouTube 返回状态。')
    host.replaceChildren()

    const iframe = document.createElement('iframe')
    iframe.src = src.toString()
    iframe.title = title
    iframe.allow = 'autoplay; fullscreen; encrypted-media; picture-in-picture'
    iframe.referrerPolicy = 'strict-origin-when-cross-origin'
    iframe.setAttribute('allowfullscreen', '')
    host.appendChild(iframe)

    const unverifiedTimer = window.setTimeout(() => {
      update('unverified', '尚未确认远程播放。如果画面是黑的、要求登录，或提示不能嵌入，请打开原视频。不要把未确认的状态当成播放成功。')
    }, 8000)

    loadYouTubeApi()
      .then(() => {
        if (cancelled || !host.querySelector('iframe') || !window.YT?.Player) return
        const frame = host.querySelector('iframe')
        if (!frame) return
        player = new window.YT.Player(frame, {
          events: {
            onStateChange: (event) => {
              if (cancelled || event.data !== 1) return
              claimRef.current = 'playing'
              setClaim('playing')
              setMessage('YouTube 已返回正在播放。')
            },
            onError: (event) => {
              if (cancelled) return
              const code = typeof event.data === 'number' ? event.data : null
              claimRef.current = 'blocked'
              setClaim('blocked')
              setMessage(describeEmbedError(code))
            },
          },
        })
      })
      .catch(() => {
        update('unverified', 'YouTube 播放器脚本没有加载成功。内嵌画面无法在此确认。请打开原视频。')
      })

    return () => {
      cancelled = true
      window.clearTimeout(unverifiedTimer)
      try {
        player?.destroy?.()
      } catch {
        /* ignore */
      }
      host.replaceChildren()
    }
  }, [embedUrl, title, videoId])

  if (!embedUrl) return null

  return (
    <div className="embed-block" data-playback-claim={claim} data-video-id={videoId}>
      <div className="embed-frame">
        <div ref={hostRef} className="embed-host" />
      </div>
      <p className="note" role="status">
        {message}{' '}
        <a href={watchUrl} target="_blank" rel="noreferrer">
          打开原视频
        </a>
      </p>
    </div>
  )
}
