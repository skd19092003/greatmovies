import { useMovies } from '../contexts/MovieContext.jsx'
import MovieCard from '../components/MovieCard'

export default function Watched() {
  const { watched = [] } = useMovies() || {}
  return (
    <div id="watched-page" className="page-content">
      <div className="text-center mb-4">
        <h1 className="display-4 fw-bold text-gradient mb-3">Watched</h1>
        <p className="lead text-muted">Movies you've already seen</p>
      </div>
      <div id="watched-movies" className="movie-grid">
        {watched.length === 0 && (
          <div className="text-center text-muted py-5">No movies marked as watched</div>
        )}
        {watched.map((m) => (
          <MovieCard key={m.id} movie={m} />
        ))}
      </div>
    </div>
  )
}
