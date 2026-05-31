'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface ProductGalleryImage {
  src: string;
  alt: string;
}

export interface ProductGalleryProps {
  images: ProductGalleryImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const safeImages = useMemo<ProductGalleryImage[]>(() => {
    if (images.length > 0) return images;
    return [{ src: '/placeholder-product.svg', alt: `${productName}, fragrance detail 1` }];
  }, [images, productName]);

  const [isHovering, setIsHovering] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const visibleIndex = isHovering && safeImages[1] ? 1 : 0;
  const activeIndex = lightboxIndex ?? visibleIndex;
  const activeImage = safeImages[activeIndex] ?? safeImages[0];

  const showPrevious = useCallback(() => {
    setLightboxIndex((index) => (
      index === null ? null : (index - 1 + safeImages.length) % safeImages.length
    ));
  }, [safeImages.length]);

  const showNext = useCallback(() => {
    setLightboxIndex((index) => (
      index === null ? null : (index + 1) % safeImages.length
    ));
  }, [safeImages.length]);

  useEffect(() => {
    if (lightboxIndex === null || safeImages.length < 2) return;

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') showNext();
      if (event.key === 'ArrowLeft') showPrevious();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIndex, safeImages.length, showNext, showPrevious]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Open ${productName} gallery`}
        className="group relative mx-auto block aspect-square w-full max-w-[min(100%,52rem)] overflow-hidden border border-border-dark bg-bg-alt text-left lg:max-w-[min(100%,calc(100vh-14rem),52rem)]"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() => setLightboxIndex(visibleIndex)}
      >
        <Image
          src={safeImages[0].src}
          alt={safeImages[0].alt || `${productName}, fragrance detail 1`}
          fill
          sizes="(min-width: 1280px) min(52rem, calc(100vh - 14rem)), (min-width: 1024px) 62vw, 100vw"
          className="object-contain p-0 transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-quart)] group-hover:scale-[1.01]"
          priority
        />
        {safeImages[1] && (
          <Image
            src={safeImages[1].src}
            alt={safeImages[1].alt || `${productName}, fragrance detail 2`}
            fill
            sizes="(min-width: 1280px) min(52rem, calc(100vh - 14rem)), (min-width: 1024px) 62vw, 100vw"
            className={cn(
              'object-contain p-0 transition-opacity duration-[var(--duration-base)] ease-[var(--ease-out-quart)]',
              isHovering ? 'opacity-100' : 'opacity-0',
            )}
          />
        )}
      </button>

      <Dialog
        open={lightboxIndex !== null}
        onOpenChange={(open) => {
          if (!open) {
            setLightboxIndex(null);
            requestAnimationFrame(() => triggerRef.current?.focus());
          }
        }}
      >
        <DialogContent
          hideCloseButton
          className="max-h-[92vh] max-w-[min(92vw,72rem)] gap-6 overflow-hidden p-4 md:p-6"
        >
          <DialogTitle className="sr-only">{productName} gallery</DialogTitle>
          <div className="relative mx-auto aspect-square max-h-[72vh] w-full max-w-[72vh] bg-bg-alt">
            <Image
              src={activeImage.src}
              alt={activeImage.alt || `${productName}, fragrance detail ${activeIndex + 1}`}
              fill
              sizes="92vw"
              className="object-contain p-0"
            />

            {safeImages.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={showPrevious}
                  className="absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-bg text-fg shadow-3 transition-colors duration-[var(--duration-fast)] hover:text-accent-deep"
                >
                  <ChevronLeft aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={showNext}
                  className="absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-bg text-fg shadow-3 transition-colors duration-[var(--duration-fast)] hover:text-accent-deep"
                >
                  <ChevronRight aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </>
            )}
          </div>

          {safeImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {safeImages.map((image, index) => (
                <button
                  key={`${image.src}-${index}`}
                  type="button"
                  aria-label={`Show image ${index + 1}`}
                  aria-current={index === activeIndex}
                  onClick={() => setLightboxIndex(index)}
                  className="relative h-20 w-20 shrink-0 border border-border-dark bg-bg-alt transition-opacity duration-[var(--duration-fast)] hover:opacity-80 aria-current:border-accent"
                >
                  <Image
                    src={image.src}
                    alt={image.alt || `${productName}, fragrance detail ${index + 1}`}
                    fill
                    sizes="64px"
                    className="object-contain p-1"
                  />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ProductGallery;
