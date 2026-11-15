import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="page">
      <h1>没有这一页</h1>
      <p>
        <Link to="/">回到首页</Link>
      </p>
    </section>
  )
}
