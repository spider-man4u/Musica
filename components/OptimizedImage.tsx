'use client';

import Image from 'next/image';
import { useState } from 'react';
import { optimizeImageUrl } from '@/lib/performance';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  objectPosition?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Optimized Image Component with lazy loading and responsive sizes
 */
export function OptimizedImage({
  src,
  alt,
  width = 300,
  height = 300,
  quality = 85,
  priority = false,
  className = '',
  style,
  objectFit = 'cover',
  objectPosition = 'center',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(!priority);
  const [hasError, setHasError] = useState(false);

  const optimizedSrc = optimizeImageUrl(src, width, quality);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = (error: any) => {
    setHasError(true);
    onError?.(error);
  };

  if (hasError) {
    return (
      <div
        className={`bg-muted flex items-center justify-center ${className}`}
        style={{
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : '100%',
          ...style,
        }}
      >
        <span className="text-xs text-muted-foreground">Image failed to load</span>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-muted ${isLoading ? 'animate-pulse' : ''} ${className}`}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : '100%',
        ...style,
      }}
    >
      <Image
        src={optimizedSrc}
        alt={alt}
        fill
        quality={quality}
        priority={priority}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          objectFit,
          objectPosition,
        }}
        className="transition-opacity duration-300"
        sizes={`(max-width: 768px) ${Math.round(width * 0.9)}px, ${width}px`}
      />
    </div>
  );
}

/**
 * Album Art Image Component
 */
export function AlbumArt({
  src: initialSrc,
  alt,
  size = 200,
  quality = 80,
  className = '',
}: {
  src: string;
  alt: string;
  size?: number;
  quality?: number;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={initialSrc}
      alt={alt}
      width={size}
      height={size}
      quality={quality}
      objectFit="cover"
      className={`rounded-lg shadow-lg ${className}`}
      priority={false}
    />
  );
}

/**
 * Avatar Image Component
 */
export function AvatarImage({
  src,
  alt,
  size = 40,
  className = '',
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      quality={85}
      objectFit="cover"
      className={`rounded-full ${className}`}
      priority={false}
    />
  );
}

export default OptimizedImage;
