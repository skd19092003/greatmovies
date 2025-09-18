import { useMovies } from '../contexts/MovieContext.jsx'
import MovieCard from '../components/MovieCard'

export default function Watchlist() {
  const { watchlist = [] } = useMovies() || {}
  return (
    <div id="watchlist-page" className="page-content">
      <div className="text-center mb-4">
        <h1 className="display-4 fw-bold text-gradient mb-3">Watch Later</h1>
        <p className="lead text-muted">Movies you want to watch</p>
      </div>
      <div id="watchlist-movies" className="movie-grid">
        {watchlist.length === 0 && (
          <div className="text-center text-muted py-5">No movies in your watch later list</div>
        )}
        {watchlist.reverse().map((m) => (
          <MovieCard key={m.id} movie={m} />
        ))}
      </div>
    </div>
  )
}
