/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Image optimization configuration
  images: {
    // Allowed image domains
    domains: [
      'localhost',
      // Add your image CDN domains here
    ],
    
    // Modern image formats
    formats: ['image/avif', 'image/webp'],
    
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    
    // Image sizes for different use cases
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Cache TTL in seconds
    minimumCacheTTL: 60,
    
    // Disable dangerous SVG support for security
    dangerouslyAllowSVG: false,
    
    // Content disposition for downloaded images
    contentDispositionType: 'attachment',
    
    // Remote patterns for external images (Next.js 13+)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.example.com',
        port: '',
        pathname: '/images/**',
      },
      // Add more patterns as needed
    ],
    
    // Image loader configuration
    loader: 'default',
    
    // Unoptimized images (use sparingly)
    unoptimized: false,
  },
  
  // Experimental features for better performance
  experimental: {
    // Enable modern bundling
    esmExternals: true,
    
    // Image optimization improvements
    optimizePackageImports: ['@/components/ui'],
  },
  
  // Compiler optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Performance optimizations
  poweredByHeader: false,
  generateEtags: false,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
