import { useEffect, useState } from 'react'
import { discoverMovies, getGenres } from '../services/tmdb'
import MovieModal from '../components/MovieModal'

export default function LuckyWheel() {
  const [genres, setGenres] = useState([])
  const [selectedGenre, setSelectedGenre] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [minRating, setMinRating] = useState(0)
  const [selectedYearRange, setSelectedYearRange] = useState('')
  const [selectedQuality, setSelectedQuality] = useState('popular')
  const [loading, setLoading] = useState(false)
  const [randomMovie, setRandomMovie] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [spinning, setSpinning] = useState(false)


  // Load genres on component mount
  useEffect(() => {
    // Load genres
    getGenres().then(setGenres)
  }, [])

 

 

  const spinWheel = async () => {
    if (spinning) return

    setSpinning(true)
    setLoading(true)
    setShowResult(false)

    try {
      // Build parameters for discoverMovies
      const params = {
        page: 1,
        include_adult: false,
        include_video: false,
        vote_average_gte: minRating,
        watch_region: 'US'
      }

      // Set sorting based on quality preference
      switch (selectedQuality) {
        case 'popular':
          params.sort_by = 'popularity.desc'
          break
        case 'voted':
          params.sort_by = 'vote_count.desc'
          break
        case 'grossing':
          params.sort_by = 'revenue.desc'
          break
        default:
          params.sort_by = 'popularity.desc'
      }

      // Add optional filters
      if (selectedGenre) {
        params.with_genres = selectedGenre
      }

      if (selectedLanguage) {
        params.with_original_language = selectedLanguage
      }

      // Handle year range filtering
      if (selectedYearRange) {
        const currentYear = new Date().getFullYear()
        switch (selectedYearRange) {
          case 'very_old':
            // Before 1980
            params.primary_release_year_gte = 1950
            params.primary_release_year_lte = 1980
            break
          case 'old':
            // Before 1990
            params.primary_release_year_gte = 1980
            params.primary_release_year_lte = 1990
            break
          case 'medium-old':
            // 1990-2010
            params.primary_release_year_gte = 1990
            params.primary_release_year_lte = 2000
            break
          case 'medium':
            // 1990-2010
            params.primary_release_year_gte = 2000
            params.primary_release_year_lte = 2010
            break
          case 'medium-new':
            // 2010-current
            params.primary_release_year_gte = 2010
            params.primary_release_year_lte = 2020
            break
          case 'new':
            // 2020-current
            params.primary_release_year_gte = 2020
            params.primary_release_year_lte = currentYear
            break
        }
      }

      // Fetch movies based on criteria
      const response = await discoverMovies(params)

      // Select a random movie from results
      if (response.results && response.results.length > 0) {
        const validMovies = response.results.filter(movie =>
          movie && 
          movie.id && 
          movie.title && 
          movie.poster_path &&
          movie.overview && 
          movie.overview.length > 10 &&
          movie.vote_count >= 10 &&
          movie.release_date
        )

        if (validMovies.length > 0) {
          const randomIndex = Math.floor(Math.random() * validMovies.length)
          setRandomMovie(validMovies[randomIndex])

          // Simulate spinning animation
          setTimeout(() => {
            setShowResult(true)
            setSpinning(false)
          }, 2000)
        } else {
          // No valid movies found with current filters
          setRandomMovie(null)
          setShowResult(true)
          setSpinning(false)
        }
      } else {
        // No movies found
        setRandomMovie(null)
        setShowResult(true)
        setSpinning(false)
      }
    } catch (error) {
      console.error('Error fetching random movie:', error)
      setRandomMovie(null)
      setShowResult(true)
      setSpinning(false)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedGenre('')
    setSelectedLanguage('')
    setMinRating(0)
    setSelectedYearRange('')
    setSelectedQuality('popular')
    setShowResult(false)
    setRandomMovie(null)
  }

  return (
    <>
     

      <div id="lucky-wheel-page" className="page-content" style={{
        minHeight: '100vh',
        position: 'relative',
        paddingTop: '1rem',
        paddingBottom: '1rem',
        
      }}>

      {/* Content Layer */}
      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="container-fluid px-2 px-sm-3 relative" style={{ 
          zIndex: 2, 
          flex: 1,
          opacity: 1,
          transition: 'opacity 1s ease-in-out'
        }}>
          <div className="text-center mb-0">
            <h1 className="display-4 fw-bold text-gradient mb-2" style={{
              background: 'linear-gradient(45deg, #FFD700, #FFA500, #FF6347, #FF1493)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              animation: 'shimmer 3s ease-in-out infinite'
            }}>
              🎰 Lucky Movie Wheel
            </h1>
            <p className="lead text-white mb-0">
              Answer a few questions and let fate choose your next movie!
            </p>
            
          </div>

          {/* Corner Questions and Center Controls */}
          {!showResult && (
            <div className="lucky-wheel-layout">
              {/* Left Preferences */}
              <div className="preferences-left">
                {/* Top Left Corner - Genre */}
                <div className="corner-question top-left">
                  <div className="question-card">
                    <label className="form-label fw-semibold mb-2" style={{ color: '#fff' }} htmlFor="genre-select">
                      <i className="fas fa-film me-2"></i>Preferred Genre:
                    </label>
                    <select
                      id="genre-select"
                      className="form-select"
                      value={selectedGenre}
                      onChange={(e) => setSelectedGenre(e.target.value)}
                    >
                      <option value="">Any Genre</option>
                      {genres.map(genre => (
                        <option key={genre.id} value={genre.id}>{genre.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bottom Left Corner - Time Period */}
                <div className="corner-question bottom-left">
                  <div className="question-card">
                    <label className="form-label fw-semibold mb-2" style={{ color: '#fff' }} htmlFor="year-select">
                      <i className="fas fa-calendar me-2"></i>Time Period:
                    </label>
                    <select
                      id="year-select"
                      className="form-select"
                      value={selectedYearRange}
                      onChange={(e) => setSelectedYearRange(e.target.value)}
                    >
                      <option value="">Any Time Period</option>
                      <option value="very-old">Very Old (Before 1980)</option>
                      <option value="old">Old (1980-1990)</option>
                      <option value="medium-old">Medium Old (1990-2010)</option>
                      <option value="medium">Medium (2000-2010)</option>
                      <option value="medium-new">Medium New (2010-2020)</option>
                      <option value="new">New (2020-Current)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Center Controls */}
              <div className="center-controls">
                <div className="center-content">
                  {/* Rating Slider */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold mb-2 text-center d-block" style={{ color: '#fff' }} htmlFor="rating-slider">
                      <i className="fas fa-star me-2"></i>Minimum Rating: {minRating.toFixed(1)}
                    </label>
                    <input
                      id="rating-slider"
                      type="range"
                      className="form-range"
                      min="0"
                      max="10"
                      step="0.1"
                      value={minRating}
                      onChange={(e) => setMinRating(parseFloat(e.target.value))}
                    />
                    <div className="d-flex justify-content-between small text-white">
                      <span>0</span>
                      <span>5</span>
                      <span>10</span>
                    </div>
                  </div>
                  

                  {/* Action Buttons */}
                  <div className="d-grid gap-3">
                    <button
                      onClick={spinWheel}
                      disabled={spinning || loading}
                      className={`btn btn-primary btn-lg wheel-button ${spinning ? 'spinning' : ''}`}
                    >
                      {spinning ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Spinning...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-dice me-2"></i>🎰 Spin the Wheel!
                        </>
                      )}
                    </button>
                    <button
                      onClick={resetForm}
                      className="btn btn-outline-light reset-button"
                    >
                      <i className="fas fa-redo me-2"></i>Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Preferences */}
              <div className="preferences-right">
                {/* Top Right Corner - Language */}
                <div className="corner-question top-right">
                  <div className="question-card">
                    <label className="form-label fw-semibold mb-2" style={{ color: '#fff' }} htmlFor="language-select">
                      <i className="fas fa-language me-2"></i>Language:
                    </label>
                    <select
                      id="language-select"
                      className="form-select"
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                    >
                      <option value="">Any Language</option>
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="ta">Tamil</option>
                      <option value="te">Telugu</option>
                      <option value="kn">Kannada</option>
                      <option value="ml">Malayalam</option>
                      <option value="ko">Korean</option>
                      <option value="ja">Japanese</option>
                      <option value="zh">Chinese</option>
                    </select>
                  </div>
                </div>

                {/* Bottom Right Corner - Quality */}
                <div className="corner-question bottom-right">
                  <div className="question-card">
                    <label className="form-label fw-semibold mb-2" style={{ color: '#fff' }} htmlFor="quality-select">
                      <i className="fas fa-award me-2"></i>Quality Preference:
                    </label>
                    <select
                      id="quality-select"
                      className="form-select"
                      value={selectedQuality}
                      onChange={(e) => setSelectedQuality(e.target.value)}
                    >
                      <option value="popular">Most Popular</option>
                      <option value="voted">Most Voted</option>
                      <option value="grossing">Highest Grossing</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Result Display */}
          {showResult && (
            <div className="row justify-content-center">
              <div className="col-md-4 col-lg-4">
                <div className="card shadow-lg" style={{
                  background: 'transparent',
                  border: 'none'
                }}>
                  <div className="card-body p-3 text-center">
                    {randomMovie ? (
                      <>
                        <h2 className="card-title mb-2" style={{ color: '#fff', fontSize: '1.5rem' }}>
                          🎉 Your Lucky Movie!
                        </h2>
                        <div className="movie-result mb-2">
                          <img
                            src={`https://image.tmdb.org/t/p/w300${randomMovie.poster_path}`}
                            alt={randomMovie.title}
                            className="img-fluid rounded shadow mb-2"
                            style={{ maxHeight: '250px', objectFit: 'cover' }}
                          />
                          <h3 className="h5 mb-2" style={{ color: '#fff' }}>{randomMovie.title}</h3>
                          <p className="text-white mb-2">
                            {randomMovie.release_date && (
                              <span>{new Date(randomMovie.release_date).getFullYear()}</span>
                            )}
                            {randomMovie.vote_average && (
                              <span className="ms-3">
                                <i className="fas fa-star text-white me-2"></i>
                                {randomMovie.vote_average.toFixed(1)}
                              </span>
                            )}
                          </p>
                          <div className="d-flex gap-2 justify-content-center">
                            <button
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent('open-movie-modal', {
                                  detail: { id: randomMovie.id }
                                }))
                              }}
                              className="btn btn-primary btn-responsive"
                              disabled={loading}
                            >
                              <i className="fas fa-info-circle me-2"></i>View Details
                            </button>
                            <button
                              onClick={() => setShowResult(false)}
                              className="btn btn-outline-secondary"
                            >
                              <i className="fas fa-redo me-2"></i>Spin Again
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <h2 className="card-title mb-2" style={{ color: '#fff', fontSize: '1.5rem' }}>
                          😅 No Movies Found
                        </h2>
                        <p className="mb-2" style={{ color: '#fff' }}>
                          We couldn't find any movies that match your criteria.
                          Try adjusting your preferences and spin again!
                        </p>
                        <button
                          onClick={resetForm}
                          className="btn btn-primary"
                        >
                          <i className="fas fa-redo me-2"></i>Try Again
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        


        </div>

  {/* Custom CSS for animations and responsive design */}
  <style>{`
  /* Lucky Wheel Layout */
        .lucky-wheel-layout {
          position: relative;
          width: 100%;
          height: calc(100vh - 150px);
          min-height: 500px;
        }
        
        /* Corner Question Positioning */
        .corner-question {
          position: absolute;
          width: 280px;
          max-width: 25vw;
        }
        
        .corner-question.top-left {
          top: 20px;
          left: 20px;
        }
        
        .corner-question.top-right {
          top: 20px;
          right: 20px;
        }
        
        .corner-question.bottom-left {
          bottom: 20px;
          left: 20px;
        }
        
        .corner-question.bottom-right {
          bottom: 20px;
          right: 20px;
        }
        
        /* Question Card Styling */
        .question-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 15px;
          padding: 1.5rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .question-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
        }
        
        /* Center Controls */
        .center-controls {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 350px;
          max-width: 90vw;
        }
        
        .center-content {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(15px);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 25px;
          padding: 2rem;
          text-align: center;
          box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
        }
        
        /* Enhanced Button Styling */
        .wheel-button {
          font-size: 1.2rem;
          padding: 1rem 2rem;
          border-radius: 50px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
          background: linear-gradient(45deg, #FFD700, #FFA500);
          border: none;
          color: #000;
          box-shadow: 0 8px 25px rgba(255, 215, 0, 0.4);
          transition: all 0.3s ease;
        }
        
        .wheel-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 35px rgba(255, 215, 0, 0.6);
          background: linear-gradient(45deg, #FFA500, #FFD700);
        }
        
        .wheel-button:active {
          transform: translateY(-1px);
        }
        
        .reset-button {
          border-radius: 25px;
          border: 2px solid rgba(255, 255, 255, 0.5);
          background: rgba(255, 255, 255, 0.1);
          color: white;
          padding: 0.75rem 1.5rem;
          transition: all 0.3s ease;
        }
        
        .reset-button:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.8);
          color: white;
          transform: translateY(-2px);
        }
        
        /* Form Controls */
        .form-select {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 10px;
          color: #000;
          font-weight: 500;
        }
        
        .form-select:focus {
          border-color: #FFD700;
          box-shadow: 0 0 0 0.25rem rgba(255, 215, 0, 0.25);
          background: rgba(255, 255, 255, 0.95);
          color: #000;
        }
        
        .form-select option {
          background: #fff;
          color: #000;
          font-weight: 500;
        }
        
        .form-select option:hover,
        .form-select option:focus,
        .form-select option:selected {
          background: #f8f9fa;
          color: #000;
        }
        
        .form-range::-webkit-slider-thumb {
          background: #FFD700;
          border: 2px solid white;
          box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
        }
        
        .form-range::-moz-range-thumb {
          background: #FFD700;
          border: 2px solid white;
          box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
        }
        
        /* Animations */
        .spinning {
          animation: spin 2s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .loading-spinner {
          width: 3rem;
          height: 3rem;
        }
        
        .movie-result img {
          transition: transform 0.3s ease;
        }
        
        .movie-result img:hover {
          transform: scale(1.05);
        }
        
        .btn-responsive {
          transition: all 0.15s ease-in-out;
          transform: translateZ(0);
        }
        
        .btn-responsive:hover {
          transform: translateY(-1px) scale(1.02);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        
        .btn-responsive:active {
          transform: translateY(0) scale(0.98);
          transition: all 0.05s ease-in-out;
        }
        
        /* Responsive Design */
        @media (min-width: 765px) {
          .lucky-wheel-layout {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            gap: 2rem;
            height: auto;
            min-height: 500px;
            position: relative;
          }
          
          .preferences-left,
          .preferences-right {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            flex: 1;
          }
          
          .center-controls {
            position: static;
            transform: none;
            width: 350px;
            max-width: 90vw;
            flex: 0 0 auto;
          }
          
          .corner-question {
            position: static;
            width: 100%;
            max-width: none;
          }
        }
        
        @media (max-width: 1200px) {
          .corner-question {
            width: 240px;
            max-width: 22vw;
          }
          
          .question-card {
            padding: 1.2rem;
          }
          
          .center-controls {
            width: 320px;
          }
        }
        
        @media (max-width: 992px) {
          .corner-question {
            width: 220px;
            max-width: 28vw;
          }
          
          .question-card {
            padding: 1rem;
          }
          
          .center-controls {
            width: 300px;
          }
          
          .center-content {
            padding: 1.5rem;
          }
        }
        
        @media (max-width: 768px) {
          .lucky-wheel-layout {
            height: 80vh;
            min-height: auto;
            padding: 0.5rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .preferences-left,
          .preferences-right {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            width: 100%;
          }
          
          .corner-question {
            position: relative;
            width: 100%;
            max-width: none;
            margin-bottom: 0;
          }
          
          .corner-question.top-left,
          .corner-question.top-right,
          .corner-question.bottom-left,
          .corner-question.bottom-right {
            position: relative;
            top: auto;
            left: auto;
            right: auto;
            bottom: auto;
          }
          
          .center-controls {
            position: relative;
            top: auto;
            left: auto;
            transform: none;
            width: 100%;
            max-width: none;
            margin-top: 0;
          }
          
          .center-content {
            padding: 1rem 0.5rem;
          }
          
          .display-4 {
            font-size: 1.5rem;
          }
          
          .container-fluid {
            padding-left: 0.5rem;
            padding-right: 0.5rem;
          }
          
          .question-card {
            padding: 0.5rem;
          }
          
          #lucky-wheel-page {
            paddingTop: 0.5rem;
          }
        }
        
        @media (max-width: 576px) {
          .lucky-wheel-layout {
            padding: 0.25rem;
            gap: 0.5rem;
          }
          
          .display-4 {
            font-size: 1.25rem;
          }
          
          .wheel-button {
            font-size: 0.9rem;
            padding: 0.6rem 1rem;
          }
          
          .question-card {
            padding: 0.4rem;
          }
          
          .center-content {
            padding: 0.5rem;
          }
          
          .form-select {
            font-size: 0.8rem;
          }
          
          .form-label {
            font-size: 0.8rem;
          }
        }
        
        /* Light theme support */
        [data-theme="light"] #lucky-wheel-page {
          background: transparent;
        }
        
        /* Ensure full height between header and footer */
        #lucky-wheel-page {
          min-height: calc(100vh - 120px);
          display: flex;
          flex-direction: column;
        }
        
        [data-theme="light"] .card {
          background: transparent !important;
          border: none !important;
        }
        
        [data-theme="light"] h1, [data-theme="light"] h5, [data-theme="light"] h3, [data-theme="light"] label {
          color: #fff !important;
        }
        
        [data-theme="light"] .text-muted {
          color: #6c757d !important;
        }

        /* Background overlay for better readability */
        #lucky-wheel-page::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.1);
          z-index: 5;
          pointer-events: none;
        }
        
        [data-theme="light"] #lucky-wheel-page::before {
          background: rgba(0, 0, 0, 0.05);
        }
        
        /* Ensure content is above background */
        .container-fluid {
          position: relative;
          z-index: 10;
        }
      `}</style>
        </div>
      </div>
    </>
  )
}
