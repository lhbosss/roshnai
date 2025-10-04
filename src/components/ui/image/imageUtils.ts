// Image optimization utilities

/**
 * Generate responsive image sizes string for Next.js Image component
 */
export function generateSizes(breakpoints: { [key: string]: string }): string {
  return Object.entries(breakpoints)
    .map(([breakpoint, size]) => `(max-width: ${breakpoint}) ${size}`)
    .join(', ');
}

/**
 * Create blur data URL for image placeholders
 */
export function createBlurDataURL(width: number = 10, height: number = 10): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  }
  
  // Create a simple gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f3f4f6');
  gradient.addColorStop(1, '#e5e7eb');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL();
}

/**
 * Get optimized image URL based on device pixel ratio
 */
export function getOptimizedImageSrc(
  baseSrc: string, 
  width: number, 
  height: number, 
  quality: number = 75
): string {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const optimizedWidth = Math.round(width * dpr);
  const optimizedHeight = Math.round(height * dpr);
  
  // For external URLs, you might want to use a service like Cloudinary or ImageKit
  if (baseSrc.startsWith('http')) {
    return baseSrc;
  }
  
  // For local images, Next.js will handle optimization
  return `${baseSrc}?w=${optimizedWidth}&h=${optimizedHeight}&q=${quality}`;
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(
  baseSrc: string, 
  widths: number[], 
  quality: number = 75
): string {
  return widths
    .map(width => `${getOptimizedImageSrc(baseSrc, width, 0, quality)} ${width}w`)
    .join(', ');
}

/**
 * Check if image format is supported
 */
export function isFormatSupported(format: 'webp' | 'avif'): boolean {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  try {
    const mimeType = format === 'webp' ? 'image/webp' : 'image/avif';
    return canvas.toDataURL(mimeType).indexOf(`data:${mimeType}`) === 0;
  } catch {
    return false;
  }
}

/**
 * Get optimal image format based on browser support
 */
export function getOptimalFormat(originalFormat: string): string {
  if (isFormatSupported('avif')) return 'avif';
  if (isFormatSupported('webp')) return 'webp';
  return originalFormat;
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, priority: boolean = false): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => resolve();
    img.onerror = reject;
    
    if (priority && 'fetchPriority' in img) {
      (img as any).fetchPriority = 'high';
    }
    
    img.src = src;
  });
}

/**
 * Batch preload images with concurrency control
 */
export async function batchPreloadImages(
  srcs: string[], 
  concurrency: number = 3
): Promise<void> {
  const chunks = [];
  for (let i = 0; i < srcs.length; i += concurrency) {
    chunks.push(srcs.slice(i, i + concurrency));
  }
  
  for (const chunk of chunks) {
    await Promise.all(chunk.map(src => preloadImage(src)));
  }
}

/**
 * Calculate image dimensions while maintaining aspect ratio
 */
export function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight?: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;
  
  let width = Math.min(originalWidth, maxWidth);
  let height = width / aspectRatio;
  
  if (maxHeight && height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  
  return {
    width: Math.round(width),
    height: Math.round(height)
  };
}

/**
 * Generate placeholder image with text
 */
export function generatePlaceholder(
  width: number, 
  height: number, 
  text: string = '',
  bgColor: string = '#f3f4f6',
  textColor: string = '#6b7280'
): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bgColor}"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
            font-family="system-ui, sans-serif" font-size="14" fill="${textColor}">
        ${text}
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Image loading state manager
 */
export class ImageLoadingManager {
  private loadingImages = new Set<string>();
  private loadedImages = new Set<string>();
  private failedImages = new Set<string>();
  
  isLoading(src: string): boolean {
    return this.loadingImages.has(src);
  }
  
  isLoaded(src: string): boolean {
    return this.loadedImages.has(src);
  }
  
  hasFailed(src: string): boolean {
    return this.failedImages.has(src);
  }
  
  startLoading(src: string): void {
    this.loadingImages.add(src);
    this.loadedImages.delete(src);
    this.failedImages.delete(src);
  }
  
  markLoaded(src: string): void {
    this.loadingImages.delete(src);
    this.loadedImages.add(src);
    this.failedImages.delete(src);
  }
  
  markFailed(src: string): void {
    this.loadingImages.delete(src);
    this.loadedImages.delete(src);
    this.failedImages.add(src);
  }
  
  reset(src: string): void {
    this.loadingImages.delete(src);
    this.loadedImages.delete(src);
    this.failedImages.delete(src);
  }
  
  getStats(): { loading: number; loaded: number; failed: number } {
    return {
      loading: this.loadingImages.size,
      loaded: this.loadedImages.size,
      failed: this.failedImages.size
    };
  }
}

// Global image loading manager instance
export const globalImageManager = new ImageLoadingManager();

/**
 * Lazy loading with intersection observer
 */
export function createLazyLoadObserver(
  callback: (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };
  
  return new IntersectionObserver(callback, defaultOptions);
}

/**
 * Image compression utilities (for client-side upload)
 */
export function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    img.onload = () => {
      const { width, height } = calculateDimensions(
        img.naturalWidth,
        img.naturalHeight,
        maxWidth,
        maxHeight
      );
      
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}