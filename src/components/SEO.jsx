import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SEO = ({ 
  title, 
  description, 
  keywords, 
  canonicalUrl, 
  ogImage,
  structuredData,
  noIndex = false 
}) => {
  const location = useLocation()
  const baseUrl = 'https://findmovies.app'
  
  useEffect(() => {
    // Add preconnect hints for performance
    const preconnectOrigins = [
      'https://image.tmdb.org',
      'https://cinevault-tmdb-proxy.skd19092003.workers.dev'
    ]

    preconnectOrigins.forEach(origin => {
      let link = document.querySelector(`link[rel="preconnect"][href="${origin}"]`)
      if (!link) {
        link = document.createElement('link')
        link.rel = 'preconnect'
        link.href = origin
        document.head.appendChild(link)
      }
    })

    // Update page title
    if (title) {
      document.title = `${title} | FindMovies - Discover Movies`
    }

    // Update or create meta tags
    const updateMetaTag = (name, content, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`
      let meta = document.querySelector(selector)
      
      if (!meta) {
        meta = document.createElement('meta')
        if (property) {
          meta.setAttribute('property', name)
        } else {
          meta.setAttribute('name', name)
        }
        document.head.appendChild(meta)
      }
      
      if (content) {
        meta.setAttribute('content', content)
      } else {
        meta.remove()
      }
    }

    // Basic SEO meta tags
    updateMetaTag('description', description)
    updateMetaTag('keywords', keywords)
    
    // Canonical URL
    const canonical = canonicalUrl || `${baseUrl}${location.pathname}`
    let canonicalLink = document.querySelector('link[rel="canonical"]')
    if (!canonicalLink) {
      canonicalLink = document.createElement('link')
      canonicalLink.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalLink)
    }
    canonicalLink.setAttribute('href', canonical)

    // Robots meta
    if (noIndex) {
      updateMetaTag('robots', 'noindex, nofollow')
    } else {
      updateMetaTag('robots', 'index, follow, max-image-preview:large')
    }

    // Open Graph tags
    updateMetaTag('og:type', 'website', true)
    updateMetaTag('og:title', title || 'FindMovies - Discover Movies', true)
    updateMetaTag('og:description', description, true)
    updateMetaTag('og:url', canonical, true)
    updateMetaTag('og:image', ogImage || `${baseUrl}/favicon.ico`, true)
    updateMetaTag('og:image:width', '1200', true)
    updateMetaTag('og:image:height', '630', true)
    updateMetaTag('og:site_name', 'FindMovies', true)

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image')
    updateMetaTag('twitter:title', title || 'FindMovies - Discover Movies')
    updateMetaTag('twitter:description', description)
    updateMetaTag('twitter:image', ogImage || `${baseUrl}/favicon.ico`)

    // Additional SEO meta tags
    updateMetaTag('author', 'FindMovies')
    updateMetaTag('language', 'en')
    updateMetaTag('geo.region', 'US')
    updateMetaTag('geo.placename', 'United States')
    updateMetaTag('ICBM', '39.8283; -98.5795')

    // Structured data
    const existingScript = document.querySelector('script[type="application/ld+json"]')
    if (existingScript) {
      existingScript.remove()
    }

    if (structuredData) {
      // Process structured data and fix ratings
      const processRating = (rating) => {
        if (!rating || !rating.ratingValue) return rating;
        
        // Normalize rating to 1-5 scale if it's on a 1-10 scale
        let ratingValue = parseFloat(rating.ratingValue);
        if (ratingValue > 5 && (!rating.bestRating || rating.bestRating > 5)) {
          ratingValue = (ratingValue / 2).toFixed(1);
        }
        
        return {
          ...rating,
          '@type': 'AggregateRating',
          ratingValue: ratingValue.toString(),
          bestRating: '5',
          worstRating: '1',
          ratingCount: rating.ratingCount?.toString() || '0'
        };
      };
      
      const processedData = JSON.parse(JSON.stringify(structuredData));
      
      // Process main entity if it exists
      if (processedData.mainEntity?.itemListElement) {
        processedData.mainEntity.itemListElement = processedData.mainEntity.itemListElement.map(item => {
          if (item.aggregateRating) {
            item.aggregateRating = processRating(item.aggregateRating);
          }
          return item;
        });
      }
      
      // Process top-level aggregateRating if it exists
      if (processedData.aggregateRating) {
        processedData.aggregateRating = processRating(processedData.aggregateRating);
      }
      
      // Ensure @type is set for the main entity
      if (processedData['@type'] === 'ItemList' && !processedData.mainEntity?.@type) {
        processedData.mainEntity = {
          '@type': 'ItemList',
          ...processedData.mainEntity
        };
      }
      
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.textContent = JSON.stringify(processedData)
      document.head.appendChild(script)
    }

    // Cleanup on unmount
    return () => {
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [title, description, keywords, canonicalUrl, ogImage, structuredData, noIndex, location.pathname, baseUrl])

  return null
}

export default SEO
