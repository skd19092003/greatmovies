// Read TMDB API key injected by Vite at build time
// Source: .env variable VITE_TMDB_API_KEY (set in Vercel/locally)
const API_KEY = import.meta.env.VITE_TMDB_API_KEY
// Base URL for TMDB v3 API endpoints
// If using a proxy (recommended), set VITE_TMDB_PROXY_URL to your proxy base like:
//   https://your-worker.example.workers.dev/3
// Otherwise it falls back to the direct TMDB domain.
const BASE_URL = import.meta.env.VITE_TMDB_PROXY_URL || 'https://api.themoviedb.org/3'
// Detect whether we're calling TMDB directly (needs api_key) or via a server/edge proxy (no api_key in client)
const IS_DIRECT_TMDB = BASE_URL.includes('themoviedb.org')

// Image base URLs (host can be proxied via VITE_TMDB_IMAGE_PROXY)
// Example proxy: https://your-worker.example.workers.dev/image
const IMAGE_HOST = import.meta.env.VITE_TMDB_IMAGE_PROXY || 'https://image.tmdb.org'
export const IMAGE_BASE_URL = `${IMAGE_HOST}/t/p/w500`
export const BACKDROP_BASE_URL = `${IMAGE_HOST}/t/p/w1280`

// Append the API key as a query parameter to a URL
// Input: url string (without api_key)
// Output: url with ?api_key=... or &api_key=...
function withKey(url) {
  // If we're using a proxy, the server should attach credentials; don't expose API key in the browser
  if (!IS_DIRECT_TMDB) return url
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
  // Internal controller to enforce the timeout and bridge external aborts
  const controller = new AbortController()

  // If an external signal is provided, abort our internal controller too
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  // Schedule an abort after `timeout` milliseconds
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    // Forward all options but swap in our combined signal
    const res = await fetch(resource, { ...options, signal: controller.signal })
    return res
  } finally {
    // Always clear the timeout to avoid leaks
    clearTimeout(id)
  }
}

// Generic GET wrapper that appends API key and handles timeout/JSON parsing
// Input: path '/discover/movie', params object -> querystring, opts -> fetch options
// Output: parsed JSON or throws on non-OK response
async function get(path, params = {}, opts = {}) {
  const search = new URLSearchParams(params)
  // Build full URL with optional query string and api_key appended
  const url = withKey(`${BASE_URL}${path}${search.toString() ? `?${search.toString()}` : ''}`)
  const res = await fetchWithTimeout(url, { ...opts })
  if (!res.ok) throw new Error(`TMDB error ${res.status}`)
  return res.json()
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

// Discover movies with optional filters (genres, year) and sort
export async function discoverMovies({ page = 1, sort_by = 'popularity.desc', with_genres = '', primary_release_year = '' } = {}, opts = {}) {
  const params = { page, sort_by }
  if (with_genres) params.with_genres = with_genres
  if (primary_release_year) params.primary_release_year = primary_release_year
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
  // TMDB returns results keyed by country code. We'll return the whole map to let UI pick region.
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
export async function getTopRated(page = 1, opts = {}) {
  return get('/movie/top_rated', { page }, opts)
}

// Upcoming-related helpers removed along with Upcoming page
