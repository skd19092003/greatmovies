# GREATMOVIES

Discover movies, organize what to watch, track what you’ve watched, and save favorites — all in a clean React experience.

## Overview

GreatMovies is a React-based movie browser with personal lists and theming. It integrates with a movie API to search and discover titles and lets you manage three collections: Watchlist, Watched, and Favorites. Everything persists locally so your selections remain as long as your browser history is intact.

## Key Features


- **Search & Discover**
  - Type-to-search with debouncing to avoid flicker and excess calls.
  - Discover feed with pagination and a capped total pages for performance.

- **Filters & Sort** (on `Home.jsx`)
  - Genre filter (`getGenres()` from `src/services/tmdb.js`).
  - Year filter (auto-built list from current year back to 1950).
  - Sort by Popularity, Release Date, Rating, and Title.
  - **Reset** button restores defaults (clears query/filters, resets page and sort to `popularity.desc`).

- **Personal Lists** (via `MovieContext.jsx`)
  - **Watchlist**: movies you plan to watch.
  - **Watched**: movies you’ve completed.
  - **Favorites**: movies you love.

- **Theming**
  - Light/Dark theme toggle in `App.jsx` and `Header.jsx`.

- **Pages & Routing** (React Router)
  - `/` Discover & Search (`Home.jsx`).
  - `/trending` Trending movies (`Trending.jsx`).
  - `/now-playing` Now Playing in theaters (`NowPlaying.jsx`).
  - `/greatest` All-Time Greatest picks (`AllTimeGreatest.jsx`).
  - `/watchlist` Your Watchlist (`Watchlist.jsx`).
  - `/watched` Your Watched list (`Watched.jsx`).
  - `/favorites` Your Favorites (`Favorites.jsx`).
  - `*` Not Found (`NotFound.jsx`).

- **Movie Details & Actions**
  - Cards with quick actions for lists (`MovieCard.jsx`).
  - A movie modal with rich details (`MovieModal.jsx`).
  - Inline notifications/toasts (`Toaster.jsx`).

- **Cloudflare Worker Proxy**
  - some network internet service provider like Jio blocked tmdb.com and its api, any user using jio network isp will not be able to use this app. so used cloudfare proxy method to solve this issue.
  - Routes API calls and images through a Cloudflare Worker to keep your TMDB key off the client.
  - Configure `VITE_TMDB_PROXY_URL` for TMDB v3 and `VITE_TMDB_IMAGE_PROXY` for images. See “Cloudflare Worker Setup” below.

- **Resilience & UX touches**
  - Graceful loading and skeletons on the grid.
  - Retry button on errors.
  - Smooth scroll-to-top on page change.
  - De-duplication of results and small stitching to keep the grid pleasantly filled.

## Technology

- React with hooks and Context API for state (`MovieContext.jsx`).
- React Router for pages.
- Vite tooling.
- Axios for requests.

## Data Source

- Uses a movie API wrapper in `src/services/tmdb.js` to fetch genres, discover lists, and search results.
- The app expects a TMDB API key to be configured (commonly via `.env`). No server is required for persistence (localStorage-based).

## Behavior Details

- Changing query/filters resets the page to 1.
- Pagination is limited by a dynamic cap to protect slower connections/devices.
- Filters are applied to discover mode; search mode prioritizes query results.
- Toggling any list item is instant and persists locally.
- The Reset control clears query, genre, year and restores default sort.


Enjoy exploring and organizing your movies with BestMovies.

## Cloudflare Worker Setup (most important)

Use a Worker to proxy TMDB API and images so the API key never reaches the browser.

1) Create a Worker (Dashboard or Wrangler)
   - In Cloudflare Dashboard: Workers & Pages → Create Worker.

2) Minimal Worker logic (proxy + attach API key for `/3`)

3) Bind secret
   - In Worker → Settings → Variables → Add secret `TMDB_API_KEY` 

4) Deploy and note the Worker URL
   - Example: `https://your-worker.username.workers.dev`

5) Configure app envs to use the Worker
   - `VITE_TMDB_PROXY_URL=https://your-worker.username.workers.dev/3`
   - `VITE_TMDB_IMAGE_PROXY=https://your-worker.username.workers.dev/image`

This makes the client call the Worker; the Worker attaches the key and proxies images, improving privacy, performance, and CORS handling.

## Thanks for reading , enjoy using it - (https://greatmovies.vercel.app/)
