import { NavLink } from 'react-router-dom'
import { useMovies } from '../contexts/MovieContext.jsx'

export default function Header({ theme = 'dark', onToggleTheme = () => {} }) {
  const { counts } = useMovies() || { counts: { watchlist: 0, watched: 0, favorites: 0 } }
  return (
    <nav className="navbar navbar-expand-lg navbar-dark overflow-hidden">
      <div className="container-fluid px-2 px-sm-3">
        <NavLink className="navbar-brand d-flex align-items-center" to="/">
          <i className="fas fa-film me-2"></i>
          <span className="fw-bold">CineVault</span>
        </NavLink>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNavDropdown"
          aria-controls="navbarNavDropdown"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse w-100" id="navbarNavDropdown">
          <ul className="navbar-nav ms-auto align-items-lg-center flex-wrap flex-lg-nowrap gap-2">
            <li className="nav-item">
              <NavLink className={({isActive}) => `nav-link me-lg-2 ${isActive ? 'active' : ''}`} to="/">
                <i className="fas fa-compass me-1"></i>
                Discover
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({isActive}) => `nav-link me-lg-2 ${isActive ? 'active' : ''}`} to="/lucky-wheel">
                <i className="fas fa-dice me-1"></i>
                Lucky Wheel
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({isActive}) => `nav-link me-lg-2 ${isActive ? 'active' : ''}`} to="/greatest">
                <i className="fas fa-trophy me-1"></i>
                Greatest
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({isActive}) => `nav-link me-lg-2 ${isActive ? 'active' : ''}`} to="/trending">
                <i className="fas fa-fire me-1"></i>
                Trending
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({isActive}) => `nav-link me-lg-2 ${isActive ? 'active' : ''}`} to="/now-playing">
                <i className="fas fa-play-circle me-1"></i>
                Now Playing
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({isActive}) => `nav-link me-lg-2 ${isActive ? 'active' : ''}`} to="/watchlist">
                <i className="fas fa-clock me-1"></i>
                Watch Later
                <span className="badge bg-warning text-dark ms-1" id="watchlist-count">{counts.watchlist}</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({isActive}) => `nav-link me-lg-2 ${isActive ? 'active' : ''}`} to="/watched">
                <i className="fas fa-check-circle me-1"></i>
                Watched
                <span className="badge bg-success ms-1" id="watched-count">{counts.watched}</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({isActive}) => `nav-link me-lg-2 ${isActive ? 'active' : ''}`} to="/favorites">
                <i className="fas fa-heart me-1"></i>
                Favorites
                <span className="badge bg-danger ms-1" id="favorites-count">{counts.favorites}</span>
              </NavLink>
            </li>
    
            <li className="nav-item">
              <button
                className="btn btn-outline-light btn-sm text-nowrap py-1 px-2 ms-lg-2 mt-2 mt-lg-0"
                id="theme-toggle"
                title="Toggle dark/light theme"
                type="button"
                onClick={onToggleTheme}
                aria-pressed={theme === 'light'}
              >
                <i className={`fas ${theme === 'dark' ? 'fa-moon' : 'fa-sun'}`}></i>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}
