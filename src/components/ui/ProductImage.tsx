/**
 * ProductImage component
 * Specialized image component for product photos with consistent aspect ratios
 */

import { OptimizedImage } from './OptimizedImage';
import { IMAGE_DIMENSIONS } from '@/lib/image-utils';

export interface ProductImageProps {
  src: string;
  alt: string;
  variant?: 'card' | 'detail' | 'thumbnail';
  priority?: boolean;
  className?: string;
}

/**
 * Product image component with preset dimensions and aspect ratios
 *
 * Variants:
 * - card: 400x500 (4:5) - for product listings and grids
 * - detail: 600x750 (4:5) - for product detail pages, higher quality
 * - thumbnail: 120x120 (1:1) - for cart, thumbnails, small previews
 *
 * Usage:
 * <ProductImage src="..." alt="..." variant="card" />
 */
export function ProductImage({
  src,
  alt,
  variant = 'card',
  priority = false,
  className,
}: ProductImageProps) {
  // Get dimensions and quality based on variant
  const dimensions = (() => {
    switch (variant) {
      case 'card':
        return IMAGE_DIMENSIONS.productCard;
      case 'detail':
        return IMAGE_DIMENSIONS.productDetail;
      case 'thumbnail':
        return IMAGE_DIMENSIONS.thumbnail;
      default:
        return IMAGE_DIMENSIONS.productCard;
    }
  })();

  // Detail variant gets higher quality for luxury presentation
  const quality = variant === 'detail' ? 95 : 90;

  // Determine size type for responsive images
  const sizeType = variant === 'thumbnail' ? 'thumbnail' : 'product';

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={dimensions.width}
      height={dimensions.height}
      sizeType={sizeType}
      quality={quality}
      priority={priority}
      className={className}
      objectFit="contain"
    />
  );
}
