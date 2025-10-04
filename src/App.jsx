import { useEffect, useState, Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import MovieModal from './components/MovieModal.jsx'
import { MovieProvider } from './contexts/MovieContext.jsx'
import Toaster from './components/Toaster.jsx'
import './App.css'
import Footer from './components/Footer.jsx'

// Lazy load pages
const Home = lazy(() => import('./pages/Home.jsx'))
const Watchlist = lazy(() => import('./pages/Watchlist.jsx'))
const Watched = lazy(() => import('./pages/Watched.jsx'))
const Favorites = lazy(() => import('./pages/Favorites.jsx'))
const Trending = lazy(() => import('./pages/Trending.jsx'))
const NowPlaying = lazy(() => import('./pages/NowPlaying.jsx'))
const AllTimeGreatest = lazy(() => import('./pages/AllTimeGreatest.jsx'))
const LuckyWheel = lazy(() => import('./pages/LuckyWheel.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

export default function App() {
  const [theme, setTheme] = useState('dark')

  // Load persisted theme on mount
  useEffect(() => {
    const stored = localStorage.getItem('cinevault_theme')
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored)
    }
  }, [])

  // Sync theme to <html data-theme> and localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('cinevault_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <MovieProvider>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header theme={theme} onToggleTheme={toggleTheme} />
  <main className="container mt-4" style={{ flex: 1, paddingBottom: '6rem' }}>
          <Suspense fallback={<div className="text-center mt-5"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/watched" element={<Watched />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/trending" element={<Trending />} />
              <Route path="/now-playing" element={<NowPlaying />} />
              <Route path="/greatest" element={<AllTimeGreatest />} />
              <Route path="/lucky-wheel" element={<LuckyWheel />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        <MovieModal />
        <Toaster />
        <Footer />
      </div>
    </MovieProvider>
  )
}
