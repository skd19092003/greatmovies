import { useMovies } from '../contexts/MovieContext.jsx'
import MovieCard from '../components/MovieCard'

export default function Favorites() {
  const { favorites = [] } = useMovies() || {}
  return (
    <div id="favorites-page" className="page-content">
      <div className="text-center mb-4">
        <h1 className="display-4 fw-bold text-gradient mb-3">Favorites</h1>
        <p className="lead text-muted">Your all-time favorite Movies</p>
      </div>
      <div id="favorite-movies" className="movie-grid">
        {favorites.length === 0 && (
          <div className="text-center text-muted py-5">No favorite movies yet</div>
        )}
        {favorites.reverse().map((m) => (
          <MovieCard key={m.id} movie={m} />
        ))}
      </div>
    </div>
  )
}
