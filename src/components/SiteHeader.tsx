import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/', label: '首页', end: true },
  { to: '/about', label: '关于', end: false },
  { to: '/projects', label: '项目', end: false },
  { to: '/films', label: '影片', end: false },
  { to: '/scenes', label: '场景', end: false },
  { to: '/characters', label: '人物', end: false },
  { to: '/articles', label: '文章', end: false },
]

export default function SiteHeader() {
  return (
    <header className="site-header">
      <NavLink className="brand" to="/" end>
        GONG YUEYUE
      </NavLink>
      <nav className="nav-row" aria-label="页面">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
