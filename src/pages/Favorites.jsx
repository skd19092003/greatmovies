import { useMovies } from '../contexts/MovieContext.jsx'
import MovieCard from '../components/MovieCard'
import { useState, useEffect } from 'react'

export default function Favorites() {
  const { favorites = [] } = useMovies() || {}
  const [page, setPage] = useState(1)
  const [paginatedMovies, setPaginatedMovies] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 12

  // Paginate favorites
  useEffect(() => {
    const start = (page - 1) * itemsPerPage
    const end = start + itemsPerPage
    setPaginatedMovies([...favorites].reverse().slice(start, end))
    setTotalPages(Math.max(1, Math.ceil(favorites.length / itemsPerPage)))
  }, [favorites, page])

  // Reset to first page when favorites change
  useEffect(() => {
    setPage(1)
  }, [favorites])

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <div id="favorites-page" className="page-content">
      <div className="text-center mb-4">
        <h1 className="display-4 fw-bold text-gradient mb-3">Favorites</h1>
        <p className="lead ">Your all-time favorite Movies</p>
      </div>
      <div id="favorite-movies" className="movie-grid">
        {favorites.length === 0 ? (
          <div className="text-center py-5">No favorite movies yet</div>
        ) : (
          paginatedMovies.map((m, index) => (
            <MovieCard key={m.id} movie={m} index={index} />
          ))
        )}
      </div>

      {favorites.length > itemsPerPage && (
        <div className="d-flex flex-column align-items-center mt-4">
          <nav aria-label="Favorites pagination">
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
  )
}
