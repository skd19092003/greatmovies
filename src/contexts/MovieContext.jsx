import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEYS, readJSON, writeJSON } from '../utils/storage'

const MovieContext = createContext(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useMovies() {
  return useContext(MovieContext)
}

export function MovieProvider({ children }) {
  const [watchlist, setWatchlist] = useState(() => readJSON(STORAGE_KEYS.watchlist))
  const [watched, setWatched] = useState(() => readJSON(STORAGE_KEYS.watched))
  const [favorites, setFavorites] = useState(() => readJSON(STORAGE_KEYS.favorites))

  useEffect(() => writeJSON(STORAGE_KEYS.watchlist, watchlist), [watchlist])
  useEffect(() => writeJSON(STORAGE_KEYS.watched, watched), [watched])
  useEffect(() => writeJSON(STORAGE_KEYS.favorites, favorites), [favorites])

  const preserveScroll = (fn) => {
    const y = window.scrollY
    fn()
    setTimeout(() => {
      window.scrollTo({ top: y, behavior: 'instant' })
    }, 50)
  }

  const toggleWatchlist = useCallback((movie) => preserveScroll(() => {
    setWatchlist((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]))
      if (map.has(movie.id)) map.delete(movie.id)
      else map.set(movie.id, movie)
      return Array.from(map.values())
    })
  }), [])
  const toggleWatched = useCallback((movie) => preserveScroll(() => {
    setWatched((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]))
      if (map.has(movie.id)) map.delete(movie.id)
      else map.set(movie.id, movie)
      return Array.from(map.values())
    })
  }), [])
  const toggleFavorite = useCallback((movie) => preserveScroll(() => {
    setFavorites((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]))
      if (map.has(movie.id)) map.delete(movie.id)
      else map.set(movie.id, movie)
      return Array.from(map.values())
    })
  }), [])

  const value = useMemo(() => ({
    watchlist,
    watched,
    favorites,
    counts: {
      watchlist: watchlist.length,
      watched: watched.length,
      favorites: favorites.length,
    },
    toggleWatchlist,
    toggleWatched,
    toggleFavorite,
  }), [watchlist, watched, favorites, toggleWatchlist, toggleWatched, toggleFavorite])

  return (
    <MovieContext.Provider value={value}>{children}</MovieContext.Provider>
  )
}

// no default export to keep Fast Refresh happy
 