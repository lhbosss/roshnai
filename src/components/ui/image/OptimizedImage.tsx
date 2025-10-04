import Image from 'next/image';
import { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  fill?: boolean;
  sizes?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

// Default book cover placeholder
const DEFAULT_BOOK_COVER = '/images/default-book-cover.png';
const BLUR_DATA_URL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 75,
  fill = false,
  sizes,
  placeholder = 'blur',
  blurDataURL = BLUR_DATA_URL,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    setImgSrc(DEFAULT_BOOK_COVER);
    onError?.();
  };

  const imageProps = {
    src: imgSrc,
    alt,
    className: `${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`,
    priority,
    quality,
    onLoad: handleLoad,
    onError: handleError,
    placeholder,
    blurDataURL,
    ...(fill ? { fill: true } : { width, height }),
    ...(sizes && { sizes }),
  };

  return (
    <div className={`relative ${fill ? 'w-full h-full' : ''}`}>
      <Image {...imageProps} />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
    </div>
  );
}

// Book cover specific component
export function BookCoverImage({
  src,
  alt,
  width = 200,
  height = 300,
  className = '',
  priority = false,
}: Omit<OptimizedImageProps, 'fill'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`rounded-lg shadow-md ${className}`}
      priority={priority}
      quality={85}
      sizes="(max-width: 768px) 150px, (max-width: 1200px) 200px, 250px"
    />
  );
}

// Lazy loading image component with intersection observer
export function LazyImage({
  src,
  alt,
  width,
  height,
  className = '',
  threshold = 0.1,
}: OptimizedImageProps & { threshold?: number }) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [imgRef, setImgRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!imgRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(imgRef);

    return () => observer.disconnect();
  }, [imgRef, threshold]);

  return (
    <div 
      ref={setImgRef}
      className={`${width && height ? `w-[${width}px] h-[${height}px]` : ''} bg-gray-200`}
    >
      {shouldLoad ? (
        <OptimizedImage
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={className}
        />
      ) : (
        <div className="w-full h-full bg-gray-200 animate-pulse rounded" />
      )}
    </div>
  );
}

// Progressive image component that loads low quality first
export function ProgressiveImage({
  src,
  lowQualitySrc,
  alt,
  width,
  height,
  className = '',
}: OptimizedImageProps & { lowQualitySrc?: string }) {
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);

  return (
    <div className="relative">
      {lowQualitySrc && !isHighQualityLoaded && (
        <OptimizedImage
          src={lowQualitySrc}
          alt={alt}
          width={width}
          height={height}
          className={`${className} filter blur-sm`}
          quality={20}
        />
      )}
      <OptimizedImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${!isHighQualityLoaded ? 'absolute inset-0' : ''}`}
        onLoad={() => setIsHighQualityLoaded(true)}
      />
    </div>
  );
}

// Image gallery component with optimized loading
export function ImageGallery({ 
  images,
  itemWidth = 200,
  itemHeight = 300 
}: { 
  images: Array<{ src: string; alt: string; id: string }>;
  itemWidth?: number;
  itemHeight?: number;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((image, index) => (
        <LazyImage
          key={image.id}
          src={image.src}
          alt={image.alt}
          width={itemWidth}
          height={itemHeight}
          className="rounded-lg shadow-md hover:shadow-lg transition-shadow"
          priority={index < 4} // Prioritize first 4 images
        />
      ))}
    </div>
  );
}

// Avatar component with fallback
export function AvatarImage({
  src,
  alt,
  size = 40,
  className = '',
}: {
  src?: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div 
        className={`rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold ${className}`}
        style={{ width: size, height: size }}
      >
        {alt.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      onError={() => setHasError(true)}
    />
  );
}

// Responsive image component
export function ResponsiveImage({
  src,
  alt,
  aspectRatio = '16/9',
  className = '',
  priority = false,
}: {
  src: string;
  alt: string;
  aspectRatio?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={`relative w-full ${className}`} style={{ aspectRatio }}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill={true}
        className="object-cover"
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
}