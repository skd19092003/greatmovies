import { useState } from 'react'
import { IMAGE_BASE_URL, getMovieVideos } from '../services/tmdb'
import { useMovies } from '../contexts/MovieContext.jsx'

export default function MovieCard({ movie, showReleaseDate = false, index = 0 }) {
  const { watchlist = [], watched = [], favorites = [], toggleWatchlist, toggleWatched, toggleFavorite } = useMovies() || {}
  const inWatchlist = !!watchlist.find((m) => m.id === movie.id)
  const inWatched = !!watched.find((m) => m.id === movie.id)
  const inFavorite = !!favorites.find((m) => m.id === movie.id)

  const [imageSrc, setImageSrc] = useState(`${IMAGE_BASE_URL}${movie.poster_path}`)
  const [imageError, setImageError] = useState(false)

  const handleImageError = () => {
    if (!imageError && import.meta.env.VITE_TMDB_IMAGE_PROXY) {
      // Try proxy if direct failed and proxy is configured
      setImageSrc(`${import.meta.env.VITE_TMDB_IMAGE_PROXY}/t/p/w342${movie.poster_path}`)
      setImageError(true)
    }
  }

  const onOpen = () => {
    window.dispatchEvent(new CustomEvent('open-movie-modal', { detail: { id: movie.id } }))
  }

  const onTrailer = async (e) => {
    e?.stopPropagation?.()
    try {
      const vids = await getMovieVideos(movie.id)
      const trailer = vids.find((v) => v.site === 'YouTube' && v.type === 'Trailer') || vids.find((v) => v.site === 'YouTube')
      if (trailer?.key) {
        window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank', 'noopener,noreferrer')
      } else {
        window.dispatchEvent(new CustomEvent('toast', { detail: { text: 'Trailer not available.', variant: 'info' } }))
      }
    } catch {
      window.dispatchEvent(new CustomEvent('toast', { detail: { text: 'Failed to open trailer.', variant: 'danger' } }))
    }
  }

  const rating = movie?.vote_average ? Math.round(movie.vote_average * 10) / 10 : 'N/A'
  const releaseYear = (movie?.release_date || '').slice(0, 4) || 'N/A'
  const fullReleaseDate = movie?.release_date || ''

  return (
    <div className="movie-card" title={movie.title}>
      <div className="movie-poster-container">
        {movie.poster_path ? (
          <img className="movie-poster" src={imageSrc} alt={movie.title} loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"} sizes="280px" onError={handleImageError} />
        ) : (
          <div className="movie-poster d-flex align-items-center justify-content-center" style={{ background: 'var(--background-color-offset)' }}>No Image</div>
        )}
      </div>
      <div className="movie-info">
        <h2 className="movie-title">{movie.title}</h2>
        <div className="movie-meta">
          <div className="rating">
            <i className="fas fa-star"></i>
            <span>{rating}/10</span>
          </div>
          <span className="movie-year">{releaseYear}</span>
        </div> 
        {showReleaseDate && fullReleaseDate && (
          <small className="text-muted d-block mb-1">Release: {fullReleaseDate}</small>
        )}
        <p className="movie-overview">{movie.overview || 'No description available.'}</p>
        <div className="movie-actions">
          <button
            type="button"
            className="action-btn details"
            title="More Details"
            onClick={(e) => { e.stopPropagation(); onOpen() }}
            data-bs-toggle="modal"
            data-bs-target="#movieModal"
          >
            <i className="fas fa-info-circle"></i>
            Details
          </button>
          <button
            type="button"
            className="action-btn trailer"
            title="Watch Trailer"
            onClick={onTrailer}
          >
            <i className="fas fa-play"></i>
            Watch Trailer
          </button>
          <button
            type="button"
            className="action-btn watchlist"
            title={inWatchlist ? 'Remove from Watch Later' : 'Add to Watch Later'}
            onClick={(e) => { e.stopPropagation(); toggleWatchlist?.(movie); window.dispatchEvent(new CustomEvent('toast', { detail: { text: inWatchlist ? 'Removed from Watch Later' : 'Added to Watch Later', variant: 'warning' } })) }}
          >
            <i className="fas fa-clock"></i>
            {inWatchlist ? 'Remove from Watch Later' : 'Add to Watch Later'}
          </button>
          <button
            type="button"
            className="action-btn watched"
            title={inWatched ? 'Remove from Watched' : 'Mark as Watched'}
            onClick={(e) => { e.stopPropagation(); toggleWatched?.(movie); window.dispatchEvent(new CustomEvent('toast', { detail: { text: inWatched ? 'Removed from Watched' : 'Marked as Watched', variant: 'success' } })) }}
          >
            <i className="fas fa-check-circle"></i>
            {inWatched ? 'Remove from Watched' : 'Add to Watched'}
          </button>
          <button
            type="button"
            className="action-btn favorite"
            title={inFavorite ? 'Remove Favorite' : 'Add Favorite'}
            onClick={(e) => { e.stopPropagation(); toggleFavorite?.(movie); window.dispatchEvent(new CustomEvent('toast', { detail: { text: inFavorite ? 'Removed from Favorites' : 'Added to Favorites', variant: 'danger' } })) }}
          >
            <i className="fas fa-heart"></i>
            {inFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
          </button>
        </div>
      </div>
    </div>
  )
}
