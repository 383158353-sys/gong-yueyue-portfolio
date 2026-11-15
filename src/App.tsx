import { Route, Routes } from 'react-router-dom'
import SiteHeader from './components/SiteHeader'
import AboutPage from './pages/AboutPage'
import ArticlesPage from './pages/ArticlesPage'
import CharactersPage from './pages/CharactersPage'
import FilmsPage from './pages/FilmsPage'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import ProjectsPage from './pages/ProjectsPage'
import ScenesPage from './pages/ScenesPage'

export default function App() {
  return (
    <>
      <SiteHeader />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/films" element={<FilmsPage />} />
          <Route path="/scenes" element={<ScenesPage />} />
          <Route path="/characters" element={<CharactersPage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <footer className="colophon">
        <p>龚玥月 · 影视美术创作</p>
      </footer>
    </>
  )
}
