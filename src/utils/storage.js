export const STORAGE_KEYS = {
  watchlist: 'cinevault_watchlist',
  watched: 'cinevault_watched',
  favorites: 'cinevault_favorites',
}

export function readJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // noop
  }
}
