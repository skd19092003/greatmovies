import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import MovieModal from './components/MovieModal.jsx'
import { MovieProvider } from './contexts/MovieContext.jsx'
import Toaster from './components/Toaster.jsx'
import Home from './pages/Home.jsx'
import Watchlist from './pages/Watchlist.jsx'
import Watched from './pages/Watched.jsx'
import Favorites from './pages/Favorites.jsx'
import Trending from './pages/Trending.jsx'
import NowPlaying from './pages/NowPlaying.jsx'
import AllTimeGreatest from './pages/AllTimeGreatest.jsx'
import LuckyWheel from './pages/LuckyWheel.jsx'
import NotFound from './pages/NotFound.jsx'
import './App.css'
import Footer from './components/Footer.jsx'

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
      <div>
        <Header theme={theme} onToggleTheme={toggleTheme} />
        <main className="container mt-4">
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
        </main>
        <MovieModal />
        <Toaster />
        <Footer />
      </div>
    </MovieProvider>
  )
}
