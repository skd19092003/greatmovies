import { useEffect, useMemo, useState } from 'react'
import { BACKDROP_BASE_URL, IMAGE_BASE_URL, getMovieDetails, getMovieVideos, getMovieProviders } from '../services/tmdb'
import { useMovies } from '../contexts/MovieContext.jsx'

export default function MovieModal() {
  const { watchlist = [], watched = [], favorites = [], toggleWatchlist, toggleWatched, toggleFavorite } = useMovies() || {}
  const [openId, setOpenId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [details, setDetails] = useState(null)
  const [videos, setVideos] = useState([])
  const [providers, setProviders] = useState({ flatrate: [], rent: [], buy: [], link: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    function handler(e) {
      const id = e?.detail?.id
      if (!id) return
      setOpenId(id)
    }
    window.addEventListener('open-movie-modal', handler)
    return () => window.removeEventListener('open-movie-modal', handler)
  }, [])

  useEffect(() => {
    let ignore = false
    async function load() {
      if (!openId) return
      setLoading(true)
      setError('')
      try {
        const [d, v, p] = await Promise.all([
          getMovieDetails(openId),
          getMovieVideos(openId),
          getMovieProviders(openId),
        ])
        if (!ignore) {
          setDetails(d)
          setVideos(v)
          // pick region preference: try IN, then US, then GB/CA/AU, else first available
          const regionOrder = ['IN', 'US', 'GB', 'CA', 'AU']
          const allRegions = Object.keys(p || {})
          const region = regionOrder.find((r) => allRegions.includes(r)) || allRegions[0]
          const regionData = (p && p[region]) || {}
          setProviders({
            flatrate: regionData.flatrate || [],
            rent: regionData.rent || [],
            buy: regionData.buy || [],
            link: regionData.link || '',
          })
          // Show Bootstrap modal
          const el = document.getElementById('movieModal')
          if (el && window.bootstrap?.Modal) {
            const modal = window.bootstrap.Modal.getOrCreateInstance(el)
            modal.show()
            // cleanup state when hidden
            el.addEventListener('hidden.bs.modal', () => {
              setDetails(null)
              setVideos([])
              setOpenId(null)
              setError('')
            }, { once: true })
          }
        }
      } catch {
        if (!ignore) {
          setDetails(null)
          setVideos([])
          setError('Failed to load movie details.')
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [openId])

  const trailer = useMemo(() => {
    return videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer')
  }, [videos])

  const inWatchlist = !!(details && watchlist.find((m) => m.id === details.id))
  const inWatched = !!(details && watched.find((m) => m.id === details.id))
  const inFavorite = !!(details && favorites.find((m) => m.id === details.id))

  return (
    <div className="modal fade" id="movieModal" tabIndex="-1" aria-labelledby="movieModalLabel" aria-hidden="true">
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header border-0">
            <div className="ms-3 ms-md-4"></div>
            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body p-0">
            <div id="modal-content">
              {loading && (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
              {!loading && error && (
                <div className="alert alert-danger m-3" role="alert">{error}</div>
              )}
              {!loading && details && (
                <div className="movie-modal-content">
                  <div className="movie-modal-backdrop" style={{
                    backgroundImage: details.backdrop_path ? `url(${BACKDROP_BASE_URL}${details.backdrop_path})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: details.backdrop_path ? 'transparent' : 'var(--bs-dark)',
                    height: 260,
                    width: '100%',
                    position: 'relative'
                  }}>
                    <div className="backdrop-overlay"></div>
                  </div>
                  <div className="p-3 p-md-4">
                    <div>
                      <div>
                        <h3 className="mb-1">{details.title}</h3>
                        <div className="movie-modal-meta mb-2">
                          {(details.release_date || '').slice(0,4)} • {Math.round((details.vote_average || 0) * 10) / 10}
                        </div>
                        {details.genres?.length > 0 && (
                          <div className="mb-2">
                            {details.genres.map(g => <span key={g.id} className="badge bg-secondary me-1">{g.name}</span>)}
                          </div>
                        )}
                        <div className="small movie-modal-stats">
                          {details.runtime ? <span className="me-3"><i className="fas fa-clock me-1"></i>{details.runtime} min</span> : null}
                          {details.spoken_languages?.length ? (
                            <span className="me-3"><i className="fas fa-language me-1"></i>{details.spoken_languages.map(l => l.english_name || l.name).join(', ')}</span>
                          ) : null}
                          {details.homepage ? (
                            <a href={details.homepage} target="_blank" rel="noreferrer" className="text-decoration-none"><i className="fas fa-external-link-alt me-1"></i>Website</a>
                          ) : null}
                        </div>
                        <div className="d-flex flex-wrap gap-2 mt-3">
                          <button
                            type="button"
                            className={`btn btn-sm ${inWatchlist ? 'btn-warning text-dark' : 'btn-outline-warning'}`}
                            title={inWatchlist ? 'Remove from Watch Later' : 'Add to Watch Later'}
                            onClick={() => { if (details) { toggleWatchlist?.(details); window.dispatchEvent(new CustomEvent('toast', { detail: { text: inWatchlist ? 'Removed from Watch Later' : 'Added to Watch Later', variant: 'warning' } })) } }}
                          >
                            <i className="fas fa-clock me-1"></i>{inWatchlist ? 'Added' : 'Watch Later'}
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm ${inWatched ? 'btn-success' : 'btn-outline-success'}`}
                            title={inWatched ? 'Remove from Watched' : 'Mark as Watched'}
                            onClick={() => { if (details) { toggleWatched?.(details); window.dispatchEvent(new CustomEvent('toast', { detail: { text: inWatched ? 'Removed from Watched' : 'Marked as Watched', variant: 'success' } })) } }}
                          >
                            <i className="fas fa-check-circle me-1"></i>{inWatched ? 'Watched' : 'Mark Watched'}
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm ${inFavorite ? 'btn-danger' : 'btn-outline-danger'}`}
                            title={inFavorite ? 'Remove Favorite' : 'Add Favorite'}
                            onClick={() => { if (details) { toggleFavorite?.(details); window.dispatchEvent(new CustomEvent('toast', { detail: { text: inFavorite ? 'Removed from Favorites' : 'Added to Favorites', variant: 'danger' } })) } }}
                          >
                            <i className="fas fa-heart me-1"></i>{inFavorite ? 'Favorited' : 'Favorite'}
                          </button>
                        </div>
                      </div>
                    </div>
                    {details.overview && (
                      <p className="mt-3 mb-0">{details.overview}</p>
                    )}
                    {(providers.flatrate.length || providers.rent.length || providers.buy.length) ? (
                      <div className="mt-3">
                        <h5 className="mb-2">Providers</h5>
                        {providers.flatrate.length ? (
                          <div className="mb-2">
                            <div className="fw-semibold mb-1">Stream</div>
                            <div className="provider-group">
                              {providers.flatrate.map(pr => (
                                <span key={`flatrate-${pr.provider_id}`} className="provider-chip" title={pr.provider_name}>{pr.provider_name}</span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {providers.rent.length ? (
                          <div className="mb-2">
                            <div className="fw-semibold mb-1">Rent</div>
                            <div className="provider-group">
                              {providers.rent.map(pr => (
                                <span key={`rent-${pr.provider_id}`} className="provider-chip" title={pr.provider_name}>{pr.provider_name}</span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {providers.buy.length ? (
                          <div className="mb-2">
                            <div className="fw-semibold mb-1">Buy</div>
                            <div className="provider-group">
                              {providers.buy.map(pr => (
                                <span key={`buy-${pr.provider_id}`} className="provider-chip" title={pr.provider_name}>{pr.provider_name}</span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {/* More options link removed as per request */}
                      </div>
                    ) : null}
                    {trailer ? (
                      <div className="ratio ratio-16x9 mt-3">
                        <iframe
                          src={`https://www.youtube.com/embed/${trailer.key}`}
                          title="Trailer"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="alert alert-info mt-3 mb-0">Trailer not available.</div>
                    )}
                  </div>
                </div>
              )}
              {!loading && !details && (
                <div className="text-center text-muted py-5">No details found.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
