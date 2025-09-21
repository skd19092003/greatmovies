// Read TMDB API key injected by Vite at build time
// Source: .env variable VITE_TMDB_API_KEY (set in Vercel/locally)
const API_KEY = import.meta.env.VITE_TMDB_API_KEY
// Base URL for TMDB v3 API endpoints
// If using a proxy (recommended), set VITE_TMDB_PROXY_URL to your proxy base like:
//   https://your-worker.example.workers.dev/3
// Otherwise it falls back to the direct TMDB domain.
const PROXY_URL = import.meta.env.VITE_TMDB_PROXY_URL || ''
const DIRECT_URL = 'https://api.themoviedb.org/3'
 
// SIMPLE, RELIABLE BEHAVIOR:
// - Prefer the proxy to avoid ISP issues (e.g., Jio blocking).
// - If the proxy fails once (network/timeout/5xx like 525), disable it for this session
//   and use the direct TMDB API so the app keeps working and the modal opens.
const PREFER_PROXY = true
let proxyDisabled = false
function getBases() {
  // If proxy is configured and not disabled, try it first, then direct
  if (PREFER_PROXY && PROXY_URL && !proxyDisabled) return [PROXY_URL, DIRECT_URL]
  // Otherwise, go direct only
  return [DIRECT_URL]
}

// Image base URLs (host can be proxied via VITE_TMDB_IMAGE_PROXY)
// Example proxy: https://your-worker.example.workers.dev/image
const IMAGE_HOST = import.meta.env.VITE_TMDB_IMAGE_PROXY || 'https://image.tmdb.org'
export const IMAGE_BASE_URL = `${IMAGE_HOST}/t/p/w500`
export const BACKDROP_BASE_URL = `${IMAGE_HOST}/t/p/w1280`

// Append the API key as a query parameter to a URL for a specific base
function withKeyFor(base, url) {
  const direct = base.includes('themoviedb.org')
  if (!direct) return url
  if (!API_KEY) {
    console.warn('VITE_TMDB_API_KEY is missing. Set it in your .env file for direct TMDB access.')
  }
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}api_key=${API_KEY}`
}

// Helper to add a timeout to fetch (prevents infinite loading on flaky networks)
// Params:
// - resource: RequestInfo
// - options: { timeout?: number, signal?: AbortSignal, ...fetchOptions }
// Returns: Response (or throws on abort/network error)
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 10000, signal } = options
  const controller = new AbortController()

  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(resource, { ...options, signal: controller.signal })
    return res
  } finally {
    clearTimeout(id)
  }
}

// Generic GET wrapper that appends API key and handles timeout/JSON parsing
// Adds a very simple fallback: try proxy first, on first failure disable it and retry direct.
async function get(path, params = {}, opts = {}) {
  const search = new URLSearchParams(params)
  const query = search.toString()

  let lastError
  const bases = getBases()
  for (let i = 0; i < bases.length; i++) {
    const base = bases[i]
    const rawUrl = `${base}${path}${query ? `?${query}` : ''}`
    const url = withKeyFor(base, rawUrl)
    try {
      const res = await fetchWithTimeout(url, { ...opts })
      if (!res.ok) {
        // If proxy returns 5xx (e.g., 525), disable proxy and try direct
        if (res.status >= 500 && base === PROXY_URL) {
          proxyDisabled = true
          // If there is a next base (direct), continue to it
          if (i < bases.length - 1) { lastError = new Error(`Proxy error ${res.status}`); continue }
        }
        throw new Error(`TMDB error ${res.status}`)
      }
      return await res.json()
    } catch (err) {
      // Network/timeout/CORS errors: if this was the proxy, disable and try direct
      if (base === PROXY_URL) {
        proxyDisabled = true
        if (i < bases.length - 1) { lastError = err; continue }
      }
      lastError = err
      if (i < bases.length - 1) continue
      throw lastError
    }
  }
  throw lastError || new Error('Unknown TMDB error')
}

// Fetch all movie genres
export async function getGenres(opts = {}) {
  const data = await get('/genre/movie/list', {}, opts)
  return data.genres || []
}

// Fetch popular movies (paged)
export async function getPopular(page = 1, opts = {}) {
  return get('/movie/popular', { page }, opts)
}

// Discover movies with optional filters (genres, year, language, providers, keywords) and sort
export async function discoverMovies({ 
  page = 1, 
  sort_by = 'popularity.desc', 
  with_genres = '', 
  primary_release_year = '',
  primary_release_year_gte = '',
  primary_release_year_lte = '',
  with_original_language = '',
  with_watch_providers = '',
  with_keywords = '',
  watch_region = 'IN',
  vote_average_gte = '',
  
  // eslint-disable-next-line no-unused-vars
  include_adult = false,
  // eslint-disable-next-line no-unused-vars
  include_video = false
} = {}, opts = {}) {
  const params = {
    sort_by,
    page,
    ...(with_genres && { with_genres }),
    ...(primary_release_year && { primary_release_year }),
    ...(primary_release_year_gte && { 'primary_release_date.gte': `${primary_release_year_gte}-01-01` }),
    ...(primary_release_year_lte && { 'primary_release_date.lte': `${primary_release_year_lte}-12-31` }),
    ...(with_original_language && { with_original_language }),
    ...(with_watch_providers && { with_watch_providers }),
    ...(with_keywords && { with_keywords }),
    ...(vote_average_gte && { 'vote_average.gte': vote_average_gte }),
    watch_region,
    include_adult: false,
    include_video: false
  }
  return get('/discover/movie', params, opts)
}

// Search movies by text query (adult content excluded)
export async function searchMovies({ query, page = 1 } = {}, opts = {}) {
  return get('/search/movie', { query, page, include_adult: false }, opts)
}

// Fetch detailed info for a specific movie
export async function getMovieDetails(id, opts = {}) {
  return get(`/movie/${id}`, {}, opts)
}

// Fetch associated videos for a movie (trailers, teasers, etc.)
export async function getMovieVideos(id, opts = {}) {
  const data = await get(`/movie/${id}/videos`, {}, opts)
  return data.results || []
}

// Fetch where-to-watch providers for a movie (keyed by region code)
export async function getMovieProviders(id, opts = {}) {
  const data = await get(`/movie/${id}/watch/providers`, {}, opts)
  return data.results || {}
}

// Fetch trending movies for a time window ('day' or 'week') (paged)
export async function getTrending({ page = 1, window = 'day' } = {}, opts = {}) {
  return get(`/trending/movie/${window}`, { page }, opts)
}

// Fetch movies that are now playing in theaters (paged)
export async function getNowPlaying(page = 1, opts = {}) {
  return get('/movie/now_playing', { page }, opts)
}

// Fetch top-rated movies (paged)
export const getTopRated = (page = 1, opts = {}) => 
  get(`/movie/top_rated?page=${page}`, {}, opts)

// Get movie recommendations
// https://developer.themoviedb.org/reference/movie-recommendations
export const getMovieRecommendations = (movieId, { page = 1 } = {}, opts = {}) =>
  get(`/movie/${movieId}/recommendations?page=${page}`, {}, opts)

// Get collection details
// https://developer.themoviedb.org/reference/collection-details
export const getMovieCollection = (collectionId, opts = {}) =>
  get(`/collection/${collectionId}`, {}, opts)

// Get movie credits (cast and crew)
// https://developer.themoviedb.org/reference/movie-credits
export function getMovieCredits(movieId, opts = {}) {
  return get(`/movie/${movieId}/credits`, {}, opts)
}

// Get similar movies
// https://developer.themoviedb.org/reference/movie-similar
function getSimilarMovies(movieId, { page = 1 } = {}, opts = {}) {
  return get(`/movie/${movieId}/similar`, { page }, opts)
}

// Get movie reviews
// https://developer.themoviedb.org/reference/movie-reviews
export const getMovieReviews = (movieId, { page = 1 } = {}, opts = {}) =>
  get(`/movie/${movieId}/reviews`, { page }, opts)

// Fetch available watch providers for a specific region
async function getWatchProviders(region = 'US', opts = {}) {
  try {
    const data = await get(`/watch/providers/movie`, { watch_region: region }, opts);
    return data.results || [];
  } catch (error) {
    console.error('Error fetching watch providers:', error);
    return [];
  }
}

export {
  getSimilarMovies,
  getWatchProviders,
}
