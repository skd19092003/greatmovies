# CineVault - Your Ultimate Movie Discovery Platform

CineVault is a premium React-based movie discovery and management platform that combines intelligent movie recommendations with personal organization tools. Built with modern web technologies, it offers a seamless experience for discovering, tracking, and organizing your movie journey.

## Overview

CineVault is a comprehensive movie platform that integrates with The Movie Database (TMDB) to provide rich movie data, personalized lists, and intelligent discovery tools. Everything is stored locally in your browser for privacy and instant access.

## 🌟 Core Features

### 🔍 **Advanced Search & Discovery**
- **Smart Search**: Real-time search with debouncing to prevent excessive API calls
- **Intelligent Filters**: Filter by genre, release year (1950-current), language, and streaming providers
- **Multiple Sort Options**: Sort by popularity, release date, rating, or title
- **Advanced Discovery**: Comprehensive movie discovery with pagination and performance optimization

### 📱 **Movie Pages & Collections**
- **Home**: Main discovery hub with search, filters, and "Now Playing" as default
- **Trending**: Current trending movies updated daily
- **Now Playing**: Movies currently in theaters
- **All-Time Greatest**: Top-rated movies of all time (curated list of 600+ movies)
- **Lucky Wheel**: Premium intelligent movie randomizer ⭐

### 🎬 **Personal Movie Management**
- **Watchlist**: Save movies you want to watch later
- **Watched**: Track movies you've already seen
- **Favorites**: Curate your all-time favorite movies
- **Smart Counters**: Real-time badge counters in navigation showing list sizes
- **Local Storage**: All data persists locally for privacy and instant access

## 🎰 Lucky Wheel - Premium Feature

**The crown jewel of CineVault** - An intelligent movie randomizer that takes the guesswork out of choosing what to watch next! 

### How Lucky Wheel Works:
- **Smart Filtering**: Choose your preferred genre, language, time period (Old/Medium/New), and quality preference
- **Minimum Rating Control**: Set your rating threshold (0-10 scale) to ensure quality recommendations
- **Visual Experience**: Stunning prismatic background effects with smooth animations
- **Intelligent Selection**: Uses advanced TMDB algorithms to pick from popular, most voted, or highest-grossing movies
- **Instant Results**: Beautiful result display with movie details and quick access to full information

The Lucky Wheel feature solves the common problem of "analysis paralysis" when choosing movies, making decision-making fun and effortless!


### 🎨 **User Experience**
- **Dark/Light Theme**: Complete theme switching with persistent preferences
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Smooth Animations**: Elegant transitions and loading states
- **Movie Modal**: Rich detailed view with trailers, cast, recommendations, and provider information
- **Toast Notifications**: Instant feedback for all user actions
- **Scroll Management**: Smart scroll-to-top on page changes

### 🌐 **Multi-Language & Provider Support**
- **Language Support**: English, Hindi, Tamil, Telugu, Kannada, Malayalam, Korean, Japanese, Chinese, Spanish, Turkish
- **Streaming Providers**: Netflix, Amazon Prime Video, Disney+, Apple TV+, HBO Max, Hulu, and 8+ more services
- **Regional Content**: Proper regional filtering and content discovery

### 🔧 **Technical Excellence**
- **Performance Optimized**: Lazy loading, pagination limits, and efficient API usage
- **Error Handling**: Graceful error recovery with retry mechanisms  
- **Network Resilience**: Automatic fallback systems for connection issues
- **Memory Management**: Optimized state management and cleanup

## 🛡️ Cloudflare Proxy Solution - Solving ISP Restrictions

### The Problem
Some Internet Service Providers (particularly Jio) block access to TMDB's Website & API domains (api.themoviedb.org and image.tmdb.org). This prevents users on these networks from accessing movie data, making the app unusable.

### The Solution
CineVault implements a **Cloudflare Worker proxy** that acts as an intermediary between the app and TMDB's API:

#### How it Works:
1. **Client Request**: App makes requests to the Cloudflare Worker instead of TMDB directly
2. **Proxy Forward**: Worker receives the request and forwards it to TMDB with your API key
3. **Response Return**: Worker gets TMDB's response and sends it back to your app
4. **Seamless Experience**: Users on restricted networks can now access all movie data

#### Benefits:
- ✅ **ISP Bypass**: Circumvents ISP blocks on TMDB domains
- ✅ **Better Performance**: Cloudflare's global CDN provides faster response times
- ✅ **CORS Handling**: Eliminates cross-origin issues
- ✅ **Automatic Fallback**: App falls back to direct TMDB if proxy fails

## 🛠️ Technology Stack

- **Frontend**: React 19+ with modern hooks and Context API
- **Routing**: React Router DOM for SPA navigation
- **Build Tool**: Vite for fast development and optimized builds
- **HTTP Client**: Axios for API communication
- **Styling**: CSS3 with responsive design and dark/light themes
- **3D Graphics**: OGL library for prismatic effects in Lucky Wheel
- **Icons**: Hero Icons and Font Awesome
- **Deployment**: Vercel with optimized build configuration


## ⚙️ Cloudflare Worker Setup (Recommended)

To set up the ISP bypass proxy:

### 1. Create Cloudflare Worker
- Go to Cloudflare Dashboard → Workers & Pages
- Click "Create Worker"
- Replace default code with proxy logic

### 2. Add Environment Variables
- In Worker settings → Variables → Environment Variables
- Add `TMDB_API_KEY` with your TMDB API key

### 3. Deploy Worker
- Save and deploy your worker
- Note the worker URL (e.g., `https://your-worker.workers.dev`)

### 4. Configure App
Update your `.env` file:
```env
VITE_TMDB_PROXY_URL=https://your-worker.workers.dev/3
VITE_TMDB_IMAGE_PROXY=https://your-worker.workers.dev/image
```

## 📱 Application Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Home | Search, discover, and filter movies |
| `/lucky-wheel` | LuckyWheel | Intelligent movie randomizer |
| `/trending` | Trending | Daily trending movies |
| `/now-playing` | NowPlaying | Movies currently in theaters |
| `/greatest` | AllTimeGreatest | Top-rated movies of all time |
| `/watchlist` | Watchlist | Movies to watch later |
| `/watched` | Watched | Movies you've seen |
| `/favorites` | Favorites | Your favorite movies |

## 🎯 Key Components

- **MovieContext**: Global state management for user lists
- **MovieCard**: Reusable movie display component with quick actions
- **MovieModal**: Detailed movie information with trailers and recommendations
- **Header**: Navigation with theme toggle and list counters
- **Toaster**: Toast notification system
- **PrismaticBurst**: 3D visual effects for Lucky Wheel

## 🌍 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- 📱 Mobile browsers supported

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [The Movie Database (TMDB)](https://www.themoviedb.org/) for providing comprehensive movie data
- [Cloudflare Workers](https://workers.cloudflare.com/) for enabling ISP bypass solutions
- [Vercel](https://vercel.com/) for seamless deployment and hosting

---

**🎬 Experience CineVault Live: [https://greatmovies.vercel.app/](https://greatmovies.vercel.app/)**

*Happy movie discovering! 🍿*
