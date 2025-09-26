import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { discoverMovies, getGenres, searchMovies, getNowPlaying } from '../services/tmdb'
import MovieCard from '../components/MovieCard'
 
export default function Home() {
  const [genres, setGenres] = useState([])
  const [years, setYears] = useState([])
  const [languages, _setLanguages] = useState([
    { iso_639_1: 'en', english_name: 'English' },
    { iso_639_1: 'hi', english_name: 'Hindi' },
    { iso_639_1: 'ta', english_name: 'Tamil' },
    { iso_639_1: 'te', english_name: 'Telugu' },
    { iso_639_1: 'kn', english_name: 'Kannada' },
    { iso_639_1: 'ml', english_name: 'Malayalam' },
    { iso_639_1: 'ko', english_name: 'Korean' },
    { iso_639_1: 'ja', english_name: 'Japanese' },
    { iso_639_1: 'zh', english_name: 'Chinese' },
    { iso_639_1: 'es', english_name: 'Spanish' },
    { iso_639_1: 'tr', english_name: 'Turkish' },
  ])

  const [watchProviders, _setWatchProviders] = useState([
    { provider_id: 8, provider_name: 'Netflix' },
    { provider_id: 119, provider_name: 'Amazon Prime Video' },
    { provider_id: 337, provider_name: 'Disney+' },
    { provider_id: 350, provider_name: 'Apple TV+' },
    { provider_id: 1899, provider_name: 'Max' },
    { provider_id: 9, provider_name: 'Amazon Video' },
    { provider_id: 15, provider_name: 'Hulu' },
    { provider_id: 531, provider_name: 'Paramount+' },
    { provider_id: 386, provider_name: 'Peacock' },
    { provider_id: 29, provider_name: 'HBO Max' },
    { provider_id: 43, provider_name: 'Starz' },
    { provider_id: 257, provider_name: 'fuboTV' },
    { provider_id: 358, provider_name: 'DIRECTV' },
  ])

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [genre, setGenre] = useState('')
  const [year, setYear] = useState('')
  const [language, setLanguage] = useState('')
  const [selectedProvider, setSelectedProvider] = useState('')
  const [sort, setSort] = useState('') // Empty by default to show Now Playing
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

  // Update debounced query after user stops typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim())
      // Reset to first page when search query changes
      setPage(1)
    }, 900)
    
    return () => clearTimeout(handler)
  }, [query])

  // Handle search input change
  const handleSearchChange = (e) => {
    setQuery(e.target.value)
  }

  // Handle search submission (when pressing Enter)
  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      setDebouncedQuery(query.trim())
      setPage(1)
    }
  }

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
          // When searching, use the search endpoint
          data = await searchMovies({ 
            query: debouncedQuery, 
            page,
            include_adult: false
          }, opts)
        } else if (sort === '') {
          // Default view - Show Now Playing when no sort is selected
          data = await getNowPlaying(page, opts);
        } else {
          // Handle other sort cases with discover
          const params = {
            page,
            sort_by: 'popularity.desc',
            with_genres: genre,
            primary_release_year: year,
            with_original_language: language,
            with_watch_providers: selectedProvider,
            watch_region: 'US',
            include_adult: false,
            include_video: false
          };

          // Handle sort cases
          switch(sort) {
            case 'highest_grossing':
              params.sort_by = 'revenue.desc';
              break;
            case 'most_popular':
              params.sort_by = 'popularity.desc';
              break;
            case 'oldest':
              params.sort_by = 'primary_release_date.asc';
              break;
            case 'newest':
              params.sort_by = 'primary_release_date.desc';
              break;
            case 'most_voted':
              params.sort_by = 'vote_count.desc';
              break;
            default:
              params.sort_by = 'popularity.desc';
          }

          data = await discoverMovies(params, opts);
        }

        if (ignore) return

        let results = data.results || []
        // De-duplicate immediate results by id
        if (results.length > 1) {
          const map = new Map()
          for (const m of results) if (m && typeof m.id !== 'undefined') map.set(m.id, m)
          results = Array.from(map.values())
        }

        
        const totalFromApi = data.total_pages || 1
        const cappedTotalPages = Math.min(totalFromApi, effectiveCap)


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
  }, [debouncedQuery, genre, year, sort, page, reloadTick, language, selectedProvider])

  // Clamp page to totalPages when cap applies
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [totalPages, page])

  // Reset page when criteria change
  useEffect(() => { setPage(1) }, [debouncedQuery, genre, year, sort, language, selectedProvider])

  // Scroll to window top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  // Persist discover state to localStorage (legacy parity)
  useEffect(() => {
    try {
      localStorage.setItem('cinevault_discover', JSON.stringify({ query, genre, year, sort, page, language, selectedProvider }))
    } catch { /* noop */ }
  }, [query, genre, year, sort, page, language, selectedProvider])

  const canPrev = page > 1
  const canNext = page < totalPages

  const handleGenreChange = (e) => {
    setGenre(e.target.value);
    setSort('most_popular');
  };

  const handleYearChange = (e) => {
    setYear(e.target.value);
    setSort('most_popular');
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    setSort('most_popular');
  };

  const handleProviderChange = (e) => {
    setSelectedProvider(e.target.value);
    setSort('most_popular');
  };

  const resetFilters = () => {
    setQuery('');
    setGenre('');
    setYear('');
    setLanguage('');
    setSelectedProvider('');
    setSort(''); // Reset to empty to show Now Playing
    setPage(1);
  };

  const onRetry = () => setReloadTick((t) => t + 1)

  return (
    <div id="discover-page" className="page-content">
      <div className="container-fluid px-2 px-sm-3">
        <div className="text-center mb-4">
          <h1 className="display-4 fw-bold text-gradient mb-3">Discover Movies</h1>
          <Link to="/lucky-wheel" className="btn btn-primary btn-lg mb-3 lucky-wheel-btn">
            <i className="fas fa-dice me-2"></i>Click for Lucky Wheel
          </Link>
          <p className="lead text-muted">Find your next favorite Movies from any language</p>
        </div>

        {/* Search Bar - Full width */}
        <div className="row mb-3">
          <div className="col-12">
            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search movies..."
                value={query}
                onChange={handleSearchChange}
                onKeyDown={handleSearchSubmit}
              />
            </div>
          </div>
        </div>

        {/* Filters - 2 columns on mobile, single row on desktop */}
        <div className="row g-2 mb-3">
          {/* Genre */}
          <div className="col-6 col-md-2">
            <select className="form-select" value={genre} onChange={handleGenreChange} aria-label="Select Genre">
              <option value="">All Genres</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div className="col-6 col-md-2">
            <select className="form-select" value={year} onChange={handleYearChange} aria-label="Select Year">
              <option value="">All Years</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div className="col-6 col-md-2">
            <select className="form-select" value={language} onChange={handleLanguageChange} aria-label="Select Language">
              <option value="">All Languages</option>
              {languages.map((lang) => (
                <option key={lang.iso_639_1} value={lang.iso_639_1}>{lang.english_name}</option>
              ))}
            </select>
          </div>

          {/* Streaming */}
          <div className="col-6 col-md-2">
            <select className="form-select" value={selectedProvider} onChange={handleProviderChange} aria-label="Select Streaming Service">
              <option value="">All Services</option>
              {watchProviders.map((provider) => (
                <option key={provider.provider_id} value={provider.provider_id}>
                  {provider.provider_name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="col-6 col-md-2">
            <select 
              className="form-select" 
              value={sort} 
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort Movies"
            >
              <option value="">Sort By</option>
              <option value="highest_grossing">Highest Grossing</option>
              <option value="most_popular">Most Popular</option>
              <option value="oldest">Oldest</option>
              <option value="newest">Newest</option>
              <option value="most_voted">Most Voted</option>
            </select>
          </div>

          {/* Reset */}
          <div className="col-6 col-md-2">
            <button className="btn btn-outline-secondary w-100" onClick={resetFilters}>
              <i className="fas fa-sync-alt me-1"></i> Reset
            </button>
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
        <div id="movie-box" className="movie-grid" style={{ minHeight: '1200px' }}>
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
          <div className="text-muted small" style={{ minWidth: '80px', textAlign: 'center' }}>
            Page {page} of {totalPages}
          </div>
        </div>

        {/* Loading Spinner */}
        <div id="loading" className={`text-center py-5 ${loading ? '' : 'hidden'}`}>
          <div className="spinner-border text-primary loading-spinner" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading movies...</p>
        </div>
      </div>

      <style jsx>{`
        .lucky-wheel-btn {
          background: linear-gradient(45deg, #FFD700, #FFA500, #FF6347, #FF1493) !important;
          background-size: 200% 200% !important;
          border: none !important;
          color: #000 !important;
          font-weight: bold !important;
          text-transform: uppercase !important;
          letter-spacing: 1px !important;
          box-shadow: 0 8px 25px rgba(255, 215, 0, 0.4) !important;
          transition: all 0.3s ease !important;
          animation: shimmer 3s ease-in-out infinite !important;
          font-size: 1.2rem !important;
          padding: 1rem 2rem !important;
        }
        
        .lucky-wheel-btn:hover {
          opacity: 0.7 !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 12px 35px rgba(255, 215, 0, 0.6) !important;
        }
        
        @media (max-width: 768px) {
          .lucky-wheel-btn {
            font-size: 0.9rem !important;
            padding: 0.6rem 1rem !important;
          }
        }
        
        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  )
}
