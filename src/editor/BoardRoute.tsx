import { Link } from 'react-router-dom'
import './editor.css'

export default function BoardRoute() {
  return (
    <main className="pv-app">
      <div className="pv-bar">
        <h1>发布出口在原来的栏目</h1>
        <Link to="/">首页</Link>
        <Link to="/projects">项目</Link>
        <Link to="/scenes">场景</Link>
        <Link to="/editor">编辑作品集</Link>
      </div>
      <div className="pv-board">
        <p className="pv-empty">作品集的发布稿显示在首页、关于、项目、影片、场景、人物和文章。这里不是另一套内容，也不是唯一出口。</p>
      </div>
    </main>
  )
}
