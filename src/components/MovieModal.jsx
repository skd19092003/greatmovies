import { useEffect, useMemo, useState } from 'react'
import { BACKDROP_BASE_URL, IMAGE_BASE_URL, getMovieDetails, getMovieVideos, getMovieProviders, getMovieRecommendations, getMovieCollection } from '../services/tmdb'
import { useMovies } from '../contexts/MovieContext.jsx'

// Helper function to format currency in a shortened format (e.g., $1.5B, $1.5M, $150K)
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'N/A';
  
  // Format in billions if >= 1 billion
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  // Format in millions if >= 1 million
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  // Format in thousands if >= 10,000
  if (amount >= 10_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  // For smaller amounts, show full amount
  return `$${amount}`;
};

export default function MovieModal() {
  const { watchlist = [], watched = [], favorites = [], toggleWatchlist, toggleWatched, toggleFavorite } = useMovies() || {}
  const [openId, setOpenId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [details, setDetails] = useState(null)
  const [videos, setVideos] = useState([])
  const [providers, setProviders] = useState({ flatrate: [], rent: [], buy: [], link: '' })
  const [collection, setCollection] = useState(null)
  const [recommendations, setRecommendations] = useState([])
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
        // First get basic movie details to check for collection
        const movieDetails = await getMovieDetails(openId)
        
        // Then fetch all data in parallel
        const [v, p, rec, col] = await Promise.all([
          getMovieVideos(openId),
          getMovieProviders(openId),
          getMovieRecommendations(openId),
          movieDetails.belongs_to_collection ? getMovieCollection(movieDetails.belongs_to_collection.id) : Promise.resolve(null)
        ])
        
        if (!ignore) {
          setDetails(movieDetails)
          setVideos(v)
          setRecommendations(rec?.results || [])
          setCollection(col)
          
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
                          {details.release_date && (
                            <span className="me-3">
                              <i className="far fa-calendar-alt me-1"></i>
                              {new Date(details.release_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          )}
                          <span>{Math.round((details.vote_average || 0) * 10) / 10} <i className="fas fa-star text-warning"></i></span>
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
                        </div>
                        
                        {/* External Links */}
                        {(details.homepage || details.imdb_id) && (
                          <div className="d-flex flex-wrap gap-3 mt-2 justify-content-center">
                            {details.homepage && (
                              <a 
                                href={details.homepage} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-decoration-none"
                              >
                                <i className="fas fa-external-link-alt me-1"></i>Visit Website
                              </a>
                            )}
                            {details.imdb_id && (
                              <a 
                                href={`https://www.imdb.com/title/${details.imdb_id}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-decoration-none"
                              >
                                <i className="fas fa-external-link-alt me-1"></i>View on IMDb
                              </a>
                            )}
                          </div>
                        )}

                        <div className="d-flex flex-wrap gap-2 mt-3 justify-content-center">
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
                              <div className="mt-3 p-3 border rounded" style={{
                                      borderColor: '#dee2e6 !important',
                                       textAlign: 'justify' }}>
                     <p className="mb-0">{details.overview}</p>
                  </div>
                 )}
                    
                    {(details.budget > 0 || details.revenue > 0 || details.vote_average) && (
                      <div className="mt-3">
                        <h6 className="mb-3 text-uppercase small fw-bold text-center">Financials & Ratings</h6>
                        <div className="d-flex flex-wrap justify-content-center gap-3">
                          {details.budget > 0 && (
                            <div className="p-3 border rounded">
                              <div className="small fw-medium">Budget</div>
                              <div className="fw-semibold">
                                {formatCurrency(details.budget)}
                              </div>
                            </div>
                          )}
                          {details.revenue > 0 && (
                            <div className="p-3 border rounded">
                              <div className="small fw-medium">Revenue</div>
                              <div className="fw-semibold">
                                {formatCurrency(details.revenue)}
                              </div>
                            </div>
                          )}
                          {details.vote_average > 0 && (
                            <div className="p-3 border rounded">
                              <div className="small fw-medium">User Rating</div>
                              <div className="fw-semibold">
                                {Math.round(details.vote_average * 10)}% 
                                <span className="text small ms-1">
                                  ({details.vote_count?.toLocaleString()} votes)
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {(providers.flatrate.length || providers.rent.length || providers.buy.length) && (
                      <div className="mt-3">
                        <h6 className="mb-3 text-uppercase small fw-bold text-center">Where to Watch</h6>
                        <div className="d-flex flex-wrap justify-content-center gap-3">
                          {providers.flatrate.length ? (
                            <div className="p-3 border rounded" style={{ minWidth: '200px' }}>
                              <div className="small fw-medium text-center mb-2">Stream</div>
                              <div className="d-flex flex-wrap justify-content-center gap-2">
                                {providers.flatrate.map(pr => (
                                  <span key={`flatrate-${pr.provider_id}`} className="badge bg-secondary bg-opacity-75 text-white" title={pr.provider_name}>
                                    {pr.provider_name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}
                          {providers.rent.length ? (
                            <div className="p-3 border rounded" style={{ minWidth: '200px' }}>
                              <div className="small fw-medium text-center mb-2">Rent</div>
                              <div className="d-flex flex-wrap justify-content-center gap-2">
                                {providers.rent.map(pr => (
                                  <span key={`rent-${pr.provider_id}`} className="badge bg-secondary bg-opacity-75 text-white" title={pr.provider_name}>
                                    {pr.provider_name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}
                          {providers.buy.length ? (
                            <div className="p-3 border rounded" style={{ minWidth: '200px' }}>
                              <div className="small fw-medium text-center mb-2">Buy</div>
                              <div className="d-flex flex-wrap justify-content-center gap-2">
                                {providers.buy.map(pr => (
                                  <span key={`buy-${pr.provider_id}`} className="badge bg-secondary bg-opacity-75 text-white" title={pr.provider_name}>
                                    {pr.provider_name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}
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

                    {/* Collection Section */}
                    {collection && collection.parts && collection.parts.length > 0 && (
                      <div className="mt-4">
                        <h5 className="mb-3 fw-bold">Part of the {collection.name}</h5>
                        <div className="position-relative">
                          <div className="d-flex overflow-auto pb-3" style={{
                            scrollbarWidth: 'thin',
                            msOverflowStyle: 'none',
                            scrollbarColor: '#888 transparent',
                            '&::-webkit-scrollbar': { height: '6px' },
                            '&::-webkit-scrollbar-track': { background: 'transparent' },
                            '&::-webkit-scrollbar-thumb': { backgroundColor: '#888', borderRadius: '3px' },
                            scrollBehavior: 'smooth'
                          }}>
                            <div className="d-flex gap-3" style={{ minWidth: 'max-content' }}>
                              {collection.parts.map(movie => (
                                <div key={movie.id} className="flex-shrink-0" style={{ width: '120px' }}>
                                  <div className="position-relative rounded-3 overflow-hidden" style={{
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    height: '100%',
                                    ':hover': {
                                      transform: 'translateY(-4px)',
                                      boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                                    }
                                  }}>
                                    <img 
                                      src={movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : 'https://via.placeholder.com/200x300?text=No+Poster'} 
                                      alt={movie.title}
                                      className="img-fluid"
                                      style={{ 
                                        width: '100%', 
                                        aspectRatio: '2/3', 
                                        objectFit: 'cover',
                                        borderTopLeftRadius: '0.5rem',
                                        borderTopRightRadius: '0.5rem'
                                      }}
                                      loading="lazy"
                                    />
                                    <div className="position-absolute top-0 end-0 m-2 bg-dark bg-opacity-75 text-white rounded-circle d-flex align-items-center justify-content-center" 
                                      style={{ 
                                        width: '28px', 
                                        height: '28px',
                                        fontSize: '10px',
                                        fontWeight: 'bold'
                                      }}>
                                      {movie.vote_average ? Math.round(movie.vote_average * 10) + '%' : 'NR'}
                                    </div>
                                    <div className="p-2 bg-white" style={{ 
                                      borderBottomLeftRadius: '0.5rem',
                                      borderBottomRightRadius: '0.5rem',
                                      minHeight: '60px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      justifyContent: 'space-between'
                                    }}>
                                      <div className="small fw-medium text-truncate" title={movie.title}>
                                        {movie.title}
                                      </div>
                                      <div className="d-flex justify-content-between align-items-center mt-1">
                                        <small className="text-muted">
                                          {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                                        </small>
                                        <button 
                                          className="btn btn-sm p-0 text-primary"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenId(movie.id);
                                            document.getElementById('movieModal').scrollTo({ top: 0, behavior: 'smooth' });
                                          }}
                                          title="View details"
                                        >
                                          <i className="fas fa-chevron-right"></i>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <button 
                            className="position-absolute start-0 top-50 translate-middle-y btn btn-sm btn-dark rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: '32px', height: '32px', zIndex: 1, left: '-16px' }}
                            onClick={(e) => {
                              e.currentTarget.nextElementSibling.scrollBy({ left: -200, behavior: 'smooth' });
                            }}
                          >
                            <i className="fas fa-chevron-left"></i>
                          </button>
                          <button 
                            className="position-absolute end-0 top-50 translate-middle-y btn btn-sm btn-dark rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: '32px', height: '32px', zIndex: 1, right: '-16px' }}
                            onClick={(e) => {
                              e.currentTarget.previousElementSibling.scrollBy({ left: 200, behavior: 'smooth' });
                            }}
                          >
                            <i className="fas fa-chevron-right"></i>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Recommendations Section */}
                    {recommendations && recommendations.length > 0 && (
                      <div className="mt-4">
                        <h5 className="mb-3 fw-bold">You May Also Enjoy</h5>
                        <div className="position-relative">
                          <div className="d-flex overflow-auto pb-3" style={{
                            scrollbarWidth: 'thin',
                            msOverflowStyle: 'none',
                            '&::-webkit-scrollbar': {
                              height: '6px'
                            },
                            '&::-webkit-scrollbar-track': {
                              background: 'transparent'
                            },
                            '&::-webkit-scrollbar-thumb': {
                              backgroundColor: '#888',
                              borderRadius: '3px'
                            },
                            scrollBehavior: 'smooth'
                          }}>
                            <div className="d-flex gap-3" style={{ minWidth: 'max-content' }}>
                              {recommendations.map(movie => (
                                <div key={movie.id} className="flex-shrink-0" style={{ width: '120px' }}>
                                  <div className="position-relative rounded-3 overflow-hidden" style={{
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    height: '100%',
                                    ':hover': {
                                      transform: 'translateY(-4px)',
                                      boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                                    }
                                  }}>
                                    <img 
                                      src={movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : 'https://via.placeholder.com/200x300?text=No+Poster'} 
                                      alt={movie.title}
                                      className="img-fluid"
                                      style={{ 
                                        width: '100%', 
                                        aspectRatio: '2/3', 
                                        objectFit: 'cover',
                                        borderTopLeftRadius: '0.5rem',
                                        borderTopRightRadius: '0.5rem'
                                      }}
                                      loading="lazy"
                                    />
                                    <div className="position-absolute top-0 end-0 m-2 bg-dark bg-opacity-75 text-white rounded-circle d-flex align-items-center justify-content-center" 
                                      style={{ 
                                        width: '28px', 
                                        height: '28px',
                                        fontSize: '10px',
                                        fontWeight: 'bold'
                                      }}>
                                      {Math.round(movie.vote_average * 10)}%
                                    </div>
                                    <div className="p-2 bg-white" style={{ 
                                      borderBottomLeftRadius: '0.5rem',
                                      borderBottomRightRadius: '0.5rem',
                                      minHeight: '60px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      justifyContent: 'space-between'
                                    }}>
                                      <div className="small fw-medium text-truncate" title={movie.title}>
                                        {movie.title}
                                      </div>
                                      <div className="d-flex justify-content-between align-items-center mt-1">
                                        <small className="text-muted">
                                          {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                                        </small>
                                        <button 
                                          className="btn btn-sm p-0 text-primary"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenId(movie.id);
                                            document.getElementById('movieModal').scrollTo({ top: 0, behavior: 'smooth' });
                                          }}
                                          title="View details"
                                        >
                                          <i className="fas fa-chevron-right"></i>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <button 
                            className="position-absolute start-0 top-50 translate-middle-y btn btn-sm btn-dark rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: '32px', height: '32px', zIndex: 1, left: '-16px' }}
                            onClick={(e) => {
                              e.currentTarget.nextElementSibling.scrollBy({ left: -200, behavior: 'smooth' });
                            }}
                          >
                            <i className="fas fa-chevron-left"></i>
                          </button>
                          <button 
                            className="position-absolute end-0 top-50 translate-middle-y btn btn-sm btn-dark rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: '32px', height: '32px', zIndex: 1, right: '-16px' }}
                            onClick={(e) => {
                              e.currentTarget.previousElementSibling.scrollBy({ left: 200, behavior: 'smooth' });
                            }}
                          >
                            <i className="fas fa-chevron-right"></i>
                          </button>
                        </div>
                      </div>
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
