import { useEffect, useState } from 'react'
import { getNowPlaying } from '../services/tmdb'
import MovieCard from '../components/MovieCard'
import SEO from '../components/SEO'

export default function NowPlaying() {
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reloadTick, setReloadTick] = useState(0)

  useEffect(() => {
    let ignore = false
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await getNowPlaying(page, { signal: controller.signal, timeout: 10000 })
        if (ignore) return

        const apiResults = Array.isArray(data.results) ? data.results : []
        const apiTotal = typeof data.total_pages === 'number' ? data.total_pages : 1
        const cappedTotalPages = Math.min(apiTotal, 20)

        let results = apiResults
        if (results.length === 20 && page < cappedTotalPages) {
          try {
            const nextData = await getNowPlaying(page + 1, { signal: controller.signal, timeout: 8000 })
            if (nextData && Array.isArray(nextData.results) && nextData.results.length > 0) {
              const existing = new Set(results.map(r => r && r.id))
              const candidate = nextData.results.find(n => n && !existing.has(n.id))
              if (candidate) results = [...results, candidate]
            }
          } catch { /* ignore */ }
        }
        results = results.slice(0, 20)

        setMovies(results)
        setTotalPages(cappedTotalPages)
      } catch (e) {
        if (ignore) return
        if (e && (e.name === 'AbortError' || /abort/i.test(String(e.message)))) return
        setMovies([])
        setTotalPages(1)
        setError('Failed to load now playing movies. Please try again.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true; controller.abort() }
  }, [page, reloadTick])

  // Scroll to window top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  const canPrev = page > 1
  const canNext = page < totalPages

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "FindMovies - Now Playing Movies",
    "description": "Movies currently playing in theaters and available on streaming platforms.",
    "url": "https://findmovies.app/now-playing",
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": movies.length,
      "itemListElement": movies.slice(0, 10).map((movie, index) => ({
        "@type": "Movie",
        "position": index + 1,
        "name": movie.title,
        "url": `https://www.themoviedb.org/movie/${movie.id}`,
        "image": movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
        "dateCreated": movie.release_date
      }))
    }
  }

  return (
    <>
      <SEO
        title="Now Playing Movies"
        description="Watch movies currently playing in theaters and streaming. Find the latest releases and current cinema hits."
        keywords="now playing, current movies, movies in theaters, new releases, streaming now, latest films"
        structuredData={structuredData}
      />
    <div id="now-playing-page" className="page-content">
      <div className="container-fluid px-2 px-sm-3">
        <div className="text-center mb-4">
          <h1 className="display-5 fw-bold text-gradient mb-2">Now Playing</h1>
          <p className="text-muted">Movies currently in theaters or streaming</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
          <span>{error}</span>
          <button type="button" className="btn btn-sm btn-light" onClick={() => setReloadTick(t => t + 1)}>
            <i className="fas fa-redo me-1"></i>Retry
          </button>
        </div>
      )}

      <div id="movie-box" className="movie-grid">
        {loading && movies.length === 0 && (
          Array.from({ length: 12 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="movie-card placeholder-wave">
              <div className="movie-poster-wrapper bg-secondary placeholder" style={{ aspectRatio: '2/3' }} />
              <div className="movie-info p-2">
                <div className="d-flex justify-content-between align-items-start">
                  <span className="placeholder col-8"></span>
                  <span className="badge bg-primary placeholder col-2">&nbsp;</span>
                </div>
                <small className="text-muted"><span className="placeholder col-3"></span></small>
              </div>
            </div>
          ))
        )}
        {movies.length === 0 && !loading && (
          <div className="text-center text-muted py-5">No movies found</div>
        )}
        {movies.map((m, index) => (
          <MovieCard key={m.id} movie={m} index={index} />
        ))}
      </div>

     {/* Pagination */}
      <div className="d-flex flex-column align-items-center mt-4">
        <nav aria-label="Movie pagination">
          <ul className="pagination mb-2">
            <li className={`page-item ${!canPrev ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => canPrev && setPage(p => p - 1)}>&laquo;</button>
            </li>
            
            <li className={`page-item ${page === 1 ? 'active' : ''}`}>
              <button className="page-link" onClick={() => setPage(1)}>1</button>
            </li>
            
            {totalPages >= 10 && (
              <li className={`page-item ${page === 10 ? 'active' : ''}`}>
                <button className="page-link" onClick={() => setPage(10)}>10</button>
              </li>
            )}
            
            {totalPages >= 20 && (
              <li className={`page-item ${page === 20 ? 'active' : ''}`}>
                <button className="page-link" onClick={() => setPage(20)}>20</button>
              </li>
            )}
            
            <li className={`page-item ${!canNext ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => canNext && setPage(p => p + 1)}>&raquo;</button>
            </li>
          </ul>
        </nav>
        <div className="text-muted small">
          Page {page} of {totalPages}
        </div>
      </div>

      <div id="loading" className={`text-center py-5 ${loading ? '' : 'hidden'}`}>
        <div className="spinner-border text-primary loading-spinner" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading movies...</p>
      </div>
    </div>
    </>
  )
}
