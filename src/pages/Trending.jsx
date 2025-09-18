import { useEffect, useState } from 'react'
import { getTrending } from '../services/tmdb'
import MovieCard from '../components/MovieCard'

export default function Trending() {
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reloadTick, setReloadTick] = useState(0)
  const [windowSize] = useState('day') // keeping UI minimal; default to daily trending

  useEffect(() => {
    let ignore = false
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await getTrending({ page, window: windowSize }, { signal: controller.signal, timeout: 10000 })
        if (ignore) return
        
        const apiResults = Array.isArray(data.results) ? data.results : []
        const apiTotal = typeof data.total_pages === 'number' ? data.total_pages : 1
        const cappedTotalPages = Math.min(apiTotal, 20)
        
        let results = apiResults
        if (results.length === 20 && page < cappedTotalPages) {
          try {
            const nextData = await getTrending({ page: page + 1, window: windowSize }, { signal: controller.signal, timeout: 8000 })
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
        setError('Failed to load trending movies. Please try again.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true; controller.abort() }
  }, [page, reloadTick, windowSize])

  // Scroll to grid top on page change (parity with Home)
  useEffect(() => {
    const el = document.getElementById('movie-box')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [page])

  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <div id="trending-page" className="page-content">
      <div className="container-fluid px-2 px-sm-3">
        <div className="text-center mb-4">
          <h1 className="display-5 fw-bold text-gradient mb-2">Trending Movies</h1>
          <p className="text-muted">Currently trending across platforms</p>
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
          <div className="text-center text-muted py-5">No trending movies found</div>
        )}
        {movies.map((m) => (
          <MovieCard key={m.id} movie={m} />
        ))}
      </div>

      <div id="pagination-container" className="d-flex justify-content-center mt-4">
        <nav aria-label="Trending pagination">
          <ul className="pagination">
            <li className={`page-item ${!canPrev ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => canPrev && setPage(p => p - 1)} aria-label="Previous">&laquo;</button>
            </li>
            <li className="page-item disabled">
              <span className="page-link">Page {page} of {totalPages}</span>
            </li>
            {/* Jump to middle page (10) when available */}
            <li
              className={`page-item ${totalPages < 10 ? 'd-none' : page === 10 ? 'active' : ''}`}
              title="Jump to page 10"
            >
              <button
                className="page-link"
                onClick={() => totalPages >= 10 && setPage(10)}
                aria-label="Jump to page 10"
              >
                10
              </button>
            </li>
            <li className={`page-item ${!canNext ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => canNext && setPage(p => p + 1)} aria-label="Next">&raquo;</button>
            </li>
          </ul>
        </nav>
      </div>

      <div id="loading" className={`text-center py-5 ${loading ? '' : 'hidden'}`}>
        <div className="spinner-border text-primary loading-spinner" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading movies...</p>
      </div>
    </div>
  )
}
