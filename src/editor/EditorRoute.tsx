import { Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useSite } from '../content/siteContext'
import './editor.css'

const pages = [
  ['首页', '/editor'],
  ['关于', '/editor/about'],
  ['项目', '/editor/projects'],
  ['影片', '/editor/films'],
  ['场景', '/editor/scenes'],
  ['人物', '/editor/characters'],
  ['文章', '/editor/articles'],
]

export default function EditorToolbar() {
  const site = useSite()
  const { pathname } = useLocation()
  const selectedId = site.selected[0]
  const block = site.override(selectedId || '')

  useEffect(() => {
    if (!site.unlocked) return
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing = Boolean(target?.closest('input, textarea, select, [contenteditable="true"]'))
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !typing) {
        event.preventDefault()
        if (event.shiftKey) site.redo()
        else site.undo()
        return
      }
      if (typing) return
      if ((event.key === 'Delete' || event.key === 'Backspace') && site.selected.length) {
        event.preventDefault()
        site.deleteSelected()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [site])

  return (
    <div className="editor-toolbar">
      <p className="pv-banner">
        这是当前作品集的编辑页，不是另一张空白画布。导航、首页视频、WebGL 和场景轮播的播放不能拖动。卡片和文字可以选中、改字、调整顺序和图片缩放。未保存的草稿不会出现在公开栏目。发布后，变化出现在原来的首页、项目、场景等路由。
      </p>
      <div className="pv-bar">
        {pages.map(([label, to]) => (
          <Link key={to} to={to} className={pathname === to ? 'is-current' : ''}>{label}</Link>
        ))}
        <Link to="/">看公开站</Link>
        <span className="pv-status" role="status">{site.status}</span>
      </div>
      {site.configured === false && <p className="pv-banner">保存还没有接通。你可以看现有页面，但不能写入。</p>}
      {site.configured !== false && !site.unlocked && (
        <form
          className="pv-bar"
          onSubmit={(event) => {
            event.preventDefault()
            void site.unlock()
          }}
        >
          <label>
            编辑凭证
            <input type="password" value={site.token} autoComplete="current-password" onChange={(event) => site.setToken(event.target.value)} />
          </label>
          <button type="submit">进入编辑</button>
        </form>
      )}
      {site.unlocked && (
        <div className="pv-bar">
          <button type="button" onClick={site.undo}>撤销</button>
          <button type="button" onClick={site.redo}>重做</button>
          <button type="button" className="pv-danger" onClick={site.deleteSelected} disabled={!site.selected.length}>删除所选</button>
          <button type="button" onClick={site.moveSelectedToStart}>左对齐画布</button>
          <button type="button" onClick={site.alignSelectedTogether} disabled={site.selected.length < 2}>彼此左对齐</button>
          <button type="button" onClick={() => site.alignText('left')}>文字左对齐</button>
          <button type="button" onClick={() => site.alignText('center')}>文字居中</button>
          <button type="button" onClick={() => site.scaleSelected(0.1)}>放大图片</button>
          <button type="button" onClick={() => site.scaleSelected(-0.1)}>缩小图片</button>
          <button type="button" onClick={() => void site.save()}>保存草稿</button>
          <button type="button" onClick={() => void site.publish()}>发布到公开栏目</button>
          <button type="button" onClick={() => void site.rollback()}>公开站回到原版</button>
        </div>
      )}
      {site.unlocked && selectedId && (
        <div className="pv-bar">
          <label>
            文字
            <textarea
              rows={2}
              placeholder="输入后替换这一处原文"
              value={block?.text ?? ''}
              onChange={(event) => site.patch(selectedId, { text: event.target.value })}
            />
          </label>
          <label>
            字号
            <input aria-label="字号" type="number" min={12} max={96} value={block?.fontSize || 32} onChange={(event) => site.patch(selectedId, { fontSize: Number(event.target.value) })} />
          </label>
          {[32, 48, 72].map((size) => (
            <button key={size} type="button" onClick={() => site.patch(selectedId, { fontSize: size })}>{size}</button>
          ))}
        </div>
      )}
    </div>
  )
}
