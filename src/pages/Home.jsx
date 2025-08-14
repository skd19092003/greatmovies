import { useEffect, useState } from 'react'
import { discoverMovies, getGenres, searchMovies } from '../services/tmdb'
import MovieCard from '../components/MovieCard'

export default function Home() {
  const [genres, setGenres] = useState([])
  const [years, setYears] = useState([])

  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('')
  const [year, setYear] = useState('')
  const [sort, setSort] = useState('popularity.desc')

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reloadTick, setReloadTick] = useState(0)

  // Use a strict 25-page cap for Discover
  const computePageCap = () => 25

  // Build years from current year back to 1950 (similar to original app)
  useEffect(() => {
    const current = new Date().getFullYear()
    const ys = []
    for (let y = current; y >= 1950; y--) ys.push(y)
    setYears(ys)
  }, [])

  // Hydrate discover state from localStorage (legacy parity)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('cinevault_discover')
      if (!raw) return
      const saved = JSON.parse(raw)
      if (typeof saved.query === 'string') setQuery(saved.query)
      if (typeof saved.genre === 'string') setGenre(saved.genre)
      if (typeof saved.year === 'string') setYear(saved.year)
      if (typeof saved.sort === 'string') setSort(saved.sort)
      if (typeof saved.page === 'number') setPage(saved.page)
    } catch { /* noop */ }
  }, [])

  // Load genres once
  useEffect(() => {
    let mounted = true
    getGenres().then((gs) => {
      if (mounted) setGenres(gs)
    }).catch(() => { /* noop */ })
    return () => { mounted = false }
  }, [])

  // Debounced search trigger
  const [debouncedQuery, setDebouncedQuery] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 400)
    return () => clearTimeout(t)
  }, [query])

  // Fetch movies when filters change
  useEffect(() => {
    let ignore = false
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setError('')
      try {
        let data
        const effectiveCap = computePageCap()
        const baseTimeout = effectiveCap < 50 ? 8000 : 10000
        const opts = { signal: controller.signal, timeout: baseTimeout }
        if (debouncedQuery) {
          data = await searchMovies({ query: debouncedQuery, page }, opts)
        } else {
          data = await discoverMovies({ page, sort_by: sort, with_genres: genre, primary_release_year: year }, opts)
        }

        if (ignore) return

        let results = data.results || []
        // De-duplicate immediate results by id
        if (results.length > 1) {
          const map = new Map()
          for (const m of results) if (m && typeof m.id !== 'undefined') map.set(m.id, m)
          results = Array.from(map.values())
        }

        // Stitch to 21 items per page by fetching first item from next page when possible
        const totalFromApi = data.total_pages || 1
        const cappedTotalPages = Math.min(totalFromApi, effectiveCap)

        if (results.length < 21 && results.length === 20 && page < cappedTotalPages) {
          try {
            const nextTimeout = Math.max(5000, (effectiveCap < 50 ? 6000 : 8000))
            const nextOpts = { signal: controller.signal, timeout: nextTimeout }
            let nextData
            if (debouncedQuery) {
              nextData = await searchMovies({ query: debouncedQuery, page: page + 1 }, nextOpts)
            } else {
              nextData = await discoverMovies({ page: page + 1, sort_by: sort, with_genres: genre, primary_release_year: year }, nextOpts)
            }
            if (!ignore && nextData && Array.isArray(nextData.results) && nextData.results.length > 0) {
              const existingIds = new Set(results.map(r => r && r.id))
              const candidate = nextData.results.find(n => n && !existingIds.has(n.id))
              if (candidate) {
                results = [...results, candidate]
              }
            }
          } catch {
            // If next fetch aborted/timed out, keep original 20 without failing the page
          }
        }

        // Final safety de-dupe
        if (results.length > 1) {
          const map = new Map()
          for (const m of results) if (m && typeof m.id !== 'undefined') map.set(m.id, m)
          results = Array.from(map.values())
        }

        // If filters are applied (genre/year) and not searching, show best performing at top
        if (!debouncedQuery && (genre || year) && results.length > 1) {
          const perf = (m) => {
            const vc = typeof m?.vote_count === 'number' ? m.vote_count : 0
            const va = typeof m?.vote_average === 'number' ? m.vote_average : 0
            return vc * va
          }
          results = [...results].sort((a, b) => perf(b) - perf(a))
        }

        if (!ignore) {
          setMovies(results)
          setTotalPages(cappedTotalPages)
        }
      } catch (e) {
        if (ignore) return
        // Swallow abort errors to avoid flashing error on quick filter/page changes
        if (e && (e.name === 'AbortError' || /abort/i.test(String(e.message)))) {
          return
        }
        setMovies([])
        setTotalPages(1)
        setError('Failed to load movies. Please try again.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true; controller.abort() }
  }, [debouncedQuery, genre, year, sort, page, reloadTick])

  // Clamp page to totalPages when cap applies
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [totalPages, page])

  // Reset page when criteria change
  useEffect(() => { setPage(1) }, [debouncedQuery, genre, year, sort])

  // Scroll to grid top on page change for parity with legacy UX
  useEffect(() => {
    const el = document.getElementById('movie-box')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [page])

  // Persist discover state to localStorage (legacy parity)
  useEffect(() => {
    try {
      localStorage.setItem('cinevault_discover', JSON.stringify({ query, genre, year, sort, page }))
    } catch { /* noop */ }
  }, [query, genre, year, sort, page])

  const canPrev = page > 1
  const canNext = page < totalPages

  const onReset = () => {
    setQuery('')
    setGenre('')
    setYear('')
    setSort('popularity.desc')
    setPage(1)
  }

  const onRetry = () => setReloadTick((t) => t + 1)

  return (
    <div id="discover-page" className="page-content">
      <div className="container-fluid px-2 px-sm-3">
        <div className="text-center mb-4">
          <h1 className="display-4 fw-bold text-gradient mb-3">Discover Movies</h1>
          <p className="lead text-muted">Find your next favorite Movies from any language</p>
        </div>

        {/* Search and Filters */}
        <div className="search-container mb-4">
          <div className="row align-items-end w-100 g-2">
            <div className="col-md-6">
              <div className="search-input-wrapper">
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-search"></i>
                  </span>
                  <input
                    type="text"
                    id="search"
                    className="form-control search-input"
                    placeholder="Search for movies..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        // trigger immediate search
                        setPage(1)
                        // set debounced immediately by syncing state
                        // (effect will pick up new debouncedQuery on next tick)
                        // optional: force reload tick if same query
                      }
                    }}
                  />
                </div>
            </div>
          </div>
          <div className="col-md-2">
            <select
              id="genre-filter"
              className="form-select"
              aria-label="Filter by genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            >
              <option value="">All Genres</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <select
              id="year-filter"
              className="form-select"
              aria-label="Filter by year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="">All Years</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <select
              id="sort-filter"
              className="form-select mb-2 mb-md-0"
              aria-label="Sort movies"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="popularity.desc">Most Popular</option>
              <option value="release_date.desc">Newest First</option>
              <option value="vote_average.desc">Highest Rated</option>
              <option value="title.asc">A-Z</option>
            </select>
          </div>
          <div className="col-12 col-md-2 d-grid gap-8 d-md-block mt-2 mt-md-0">
            <button id="reset-filters" className="btn btn-outline-secondary w-100" onClick={onReset}>
              <i className="fas fa-sync-alt me-1"></i> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Movies Grid */}
      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
          <span>{error}</span>
          <button type="button" className="btn btn-sm btn-light" onClick={onRetry}>
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
        {movies.map((m) => (
          <MovieCard key={m.id} movie={m} />
        ))}
      </div>

      {/* Pagination */}
      <div id="pagination-container" className="d-flex justify-content-center mt-4">
        <nav aria-label="Movie pagination">
          <ul className="pagination">
            <li className={`page-item ${!canPrev ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => canPrev && setPage((p) => p - 1)} aria-label="Previous">&laquo;</button>
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
              <button className="page-link" onClick={() => canNext && setPage((p) => p + 1)} aria-label="Next">&raquo;</button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Loading Spinner */}
      <div id="loading" className={`text-center py-5 ${loading ? '' : 'hidden'}`}>
        <div className="spinner-border text-primary loading-spinner" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading movies...</p>
      </div>
      </div>
    </div>
  )
}
