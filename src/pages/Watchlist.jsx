import { useMovies } from '../contexts/MovieContext.jsx'
import MovieCard from '../components/MovieCard'
import { useState, useEffect } from 'react'
import SEO from '../components/SEO'

export default function Watchlist() {
  const { watchlist = [] } = useMovies() || {}
  const [page, setPage] = useState(1)
  const [paginatedMovies, setPaginatedMovies] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 12

  // Paginate watchlist
  useEffect(() => {
    const start = (page - 1) * itemsPerPage
    const end = start + itemsPerPage
    setPaginatedMovies([...watchlist].reverse().slice(start, end))
    setTotalPages(Math.max(1, Math.ceil(watchlist.length / itemsPerPage)))
  }, [watchlist, page])

  // Reset to first page when watchlist changes
  useEffect(() => {
    setPage(1)
  }, [watchlist])

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  const canPrev = page > 1
  const canNext = page < totalPages

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "FindMovies - My Watchlist",
    "description": "Personal movie watchlist with films you want to watch later.",
    "url": "https://findmovies.app/watchlist"
  }

  return (
    <>
      <SEO
        title="My Watchlist"
        description="Manage your personal movie watchlist. Save films to watch later and never miss a great movie."
        keywords="watchlist, movies to watch, save movies, personal movie list, film queue"
        structuredData={structuredData}
      />
    <div id="watchlist-page" className="page-content">
      <div className="text-center mb-4">
        <h1 className="display-4 fw-bold text-gradient mb-3">Watch Later</h1>
        <p className="lead ">Movies you want to watch</p>
      </div>
      <div id="watchlist-movies" className="movie-grid">
        {watchlist.length === 0 ? (
          <div className="text-center  py-5">No movies in your watch later list</div>
        ) : (
          paginatedMovies.map((m, index) => (
            <MovieCard key={m.id} movie={m} index={index} />
          ))
        )}
      </div>

      {watchlist.length > itemsPerPage && (
        <div className="d-flex flex-column align-items-center mt-4">
          <nav aria-label="Watchlist pagination">
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
          <div className=" small">
            Page {page} of {totalPages}
          </div>
        </div>
      )}
    </div>
    </>
  )
}
