export { 
  OptimizedImage,
  BookCoverImage,
  LazyImage,
  ProgressiveImage,
  ImageGallery,
  AvatarImage,
  ResponsiveImage
} from './OptimizedImage';

// Image optimization utilities
// Re-export utility functions
export { generateSizes } from './imageUtils'
export { imageConfig } from './imageConfig'

// For now, export a subset to avoid compilation issues
// Full exports can be added as needed