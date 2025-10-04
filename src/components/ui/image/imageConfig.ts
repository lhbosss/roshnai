// Image optimization configuration

export const imageConfig = {
  // Default image dimensions
  dimensions: {
    avatar: { width: 40, height: 40 },
    thumbnail: { width: 150, height: 150 },
    card: { width: 300, height: 200 },
    hero: { width: 1200, height: 600 },
    bookCover: { width: 200, height: 300 },
    bookThumbnail: { width: 100, height: 150 }
  },

  // Quality settings for different use cases
  quality: {
    thumbnail: 60,
    normal: 75,
    high: 85,
    lossless: 100
  },

  // Responsive breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px', 
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },

  // Common sizes strings for Next.js Image
  sizes: {
    avatar: '40px',
    thumbnail: '(max-width: 768px) 100px, 150px',
    card: '(max-width: 768px) 200px, (max-width: 1200px) 300px, 400px',
    hero: '100vw',
    bookCover: '(max-width: 768px) 150px, (max-width: 1200px) 200px, 250px',
    gallery: '(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw'
  },

  // Supported image formats
  formats: {
    modern: ['avif', 'webp'],
    fallback: ['jpeg', 'png']
  },

  // Lazy loading configuration
  lazyLoading: {
    rootMargin: '50px',
    threshold: 0.1,
    placeholder: {
      blur: true,
      shimmer: true
    }
  },

  // Compression settings
  compression: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8,
    format: 'image/jpeg'
  },

  // CDN configuration (if using external CDN)
  cdn: {
    domain: process.env.NEXT_PUBLIC_IMAGE_CDN_DOMAIN || '',
    transformations: {
      format: 'auto',
      quality: 'auto:good',
      fetchFormat: 'auto'
    }
  },

  // Cache settings
  cache: {
    maxAge: 31536000, // 1 year in seconds
    staleWhileRevalidate: 86400 // 24 hours in seconds
  }
};

// Image optimization presets
export const imagePresets = {
  avatar: {
    width: imageConfig.dimensions.avatar.width,
    height: imageConfig.dimensions.avatar.height,
    quality: imageConfig.quality.normal,
    sizes: imageConfig.sizes.avatar,
    priority: false
  },

  thumbnail: {
    width: imageConfig.dimensions.thumbnail.width,
    height: imageConfig.dimensions.thumbnail.height,
    quality: imageConfig.quality.thumbnail,
    sizes: imageConfig.sizes.thumbnail,
    priority: false
  },

  bookCover: {
    width: imageConfig.dimensions.bookCover.width,
    height: imageConfig.dimensions.bookCover.height,
    quality: imageConfig.quality.high,
    sizes: imageConfig.sizes.bookCover,
    priority: false
  },

  hero: {
    width: imageConfig.dimensions.hero.width,
    height: imageConfig.dimensions.hero.height,
    quality: imageConfig.quality.high,
    sizes: imageConfig.sizes.hero,
    priority: true
  },

  card: {
    width: imageConfig.dimensions.card.width,
    height: imageConfig.dimensions.card.height,
    quality: imageConfig.quality.normal,
    sizes: imageConfig.sizes.card,
    priority: false
  }
};

// Device pixel ratio configurations
export const dprConfig = {
  1: { suffix: '', quality: imageConfig.quality.normal },
  1.5: { suffix: '@1.5x', quality: imageConfig.quality.high },
  2: { suffix: '@2x', quality: imageConfig.quality.high },
  3: { suffix: '@3x', quality: imageConfig.quality.high }
};

// Image loading priorities
export const loadingPriorities = {
  critical: ['hero', 'logo', 'above-fold'],
  high: ['avatar', 'book-cover-featured'],
  normal: ['book-cover', 'thumbnail'],
  low: ['background', 'decoration']
};

// Performance thresholds
export const performanceThresholds = {
  // Largest Contentful Paint (LCP) target
  lcp: 2500, // milliseconds
  
  // Time to First Byte (TTFB) target  
  ttfb: 800, // milliseconds
  
  // Image load time targets
  imageLoad: {
    critical: 1000, // milliseconds
    normal: 2000, // milliseconds
    lazy: 3000 // milliseconds
  },
  
  // Bundle size limits
  bundleSize: {
    critical: 50 * 1024, // 50KB
    normal: 100 * 1024, // 100KB
    lazy: 200 * 1024 // 200KB
  }
};

// Error handling configuration
export const errorConfig = {
  fallbackImage: '/images/fallback.png',
  retryAttempts: 3,
  retryDelay: 1000, // milliseconds
  timeoutDuration: 10000, // milliseconds
  
  // Error logging
  logErrors: process.env.NODE_ENV !== 'production',
  errorEndpoint: '/api/errors/images'
};

// Analytics and monitoring
export const monitoringConfig = {
  trackPerformance: true,
  trackErrors: true,
  trackUserInteraction: false,
  
  // Metrics to collect
  metrics: [
    'image-load-time',
    'image-error-rate', 
    'cache-hit-rate',
    'bandwidth-usage',
    'user-perceived-performance'
  ],
  
  // Sampling rate (0-1)
  samplingRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0
};

// Next.js specific configuration
export const nextImageConfig = {
  domains: [
    'localhost',
    'example.com',
    // Add your image domains here
  ],
  
  formats: ['image/avif', 'image/webp'],
  
  // Image sizes for responsive images
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  
  // Optimization settings
  minimumCacheTTL: 60,
  dangerouslyAllowSVG: false,
  contentDispositionType: 'attachment',
  
  // Remote patterns for Next.js 13+
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '**.example.com',
      port: '',
      pathname: '/images/**'
    }
  ]
};

// Development vs Production settings
export const environmentConfig = {
  development: {
    quality: imageConfig.quality.high,
    optimization: false,
    logging: true,
    caching: false
  },
  
  production: {
    quality: imageConfig.quality.normal,
    optimization: true,
    logging: false,
    caching: true
  }
};

// Get configuration based on environment
export function getConfig() {
  const env = process.env.NODE_ENV || 'development';
  return environmentConfig[env as keyof typeof environmentConfig] || environmentConfig.development;
}

// Image format detection
export const formatSupport = {
  avif: typeof window !== 'undefined' ? 
    (() => {
      const canvas = document.createElement('canvas');
      return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
    })() : false,
    
  webp: typeof window !== 'undefined' ?
    (() => {
      const canvas = document.createElement('canvas');
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    })() : false
};