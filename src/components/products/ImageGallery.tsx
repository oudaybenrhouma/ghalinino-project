/**
 * Image Gallery Component
 * Ghalinino - Tunisia E-commerce
 * 
 * Product image gallery with:
 * - Main image display
 * - Thumbnail navigation
 * - Lightbox modal for zoomed view
 */

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks';

// ============================================================================
// TYPES
// ============================================================================

interface ImageGalleryProps {
  images: string[];
  productName: string;
  className?: string;
}

// ============================================================================
// PLACEHOLDER IMAGE
// ============================================================================

const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjFGNUY5Ii8+CjxwYXRoIGQ9Ik0xNjAgMTYwSDE4MEwyMDAgMTgwTDI0MCAxNDBMMjgwIDE4MFYyNDBIMTIwVjE4MEwxNjAgMTYwWiIgZmlsbD0iI0UyRThGMCIvPgo8Y2lyY2xlIGN4PSIxNjAiIGN5PSIxNDAiIHI9IjIwIiBmaWxsPSIjRTJFOEYwIi8+Cjwvc3ZnPgo=';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ImageGallery({ images, productName, className }: ImageGalleryProps) {
  const { language } = useLanguage();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageError, setImageError] = useState<Set<number>>(new Set());

  // Use placeholder if no images
  const displayImages = images.length > 0 ? images : [PLACEHOLDER_IMAGE];

  // Handle image error
  const handleImageError = useCallback((index: number) => {
    setImageError(prev => new Set(prev).add(index));
  }, []);

  // Get image src with fallback
  const getImageSrc = useCallback((index: number) => {
    if (imageError.has(index) || !displayImages[index]) {
      return PLACEHOLDER_IMAGE;
    }
    return displayImages[index];
  }, [displayImages, imageError]);

  // Navigation
  const goToPrevious = useCallback(() => {
    setSelectedIndex(prev => 
      prev === 0 ? displayImages.length - 1 : prev - 1
    );
  }, [displayImages.length]);

  const goToNext = useCallback(() => {
    setSelectedIndex(prev => 
      prev === displayImages.length - 1 ? 0 : prev + 1
    );
  }, [displayImages.length]);

  // Keyboard navigation in lightbox
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setLightboxOpen(false);
    } else if (e.key === 'ArrowLeft') {
      goToPrevious();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    }
  }, [goToPrevious, goToNext]);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Main Image */}
      <div className="relative aspect-square bg-white rounded-2xl overflow-hidden border border-slate-200 group">
        <img
          src={getImageSrc(selectedIndex)}
          alt={`${productName} - ${selectedIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => handleImageError(selectedIndex)}
        />
        
        {/* Zoom button */}
        <button
          onClick={() => setLightboxOpen(true)}
          className={cn(
            'absolute top-4 right-4 p-2 bg-white/90 rounded-lg shadow-lg',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'hover:bg-white focus:outline-none focus:ring-2 focus:ring-red-500'
          )}
          aria-label={language === 'ar' ? 'تكبير الصورة' : 'Agrandir l\'image'}
        >
          <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </button>

        {/* Navigation arrows (if multiple images) */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className={cn(
                'absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg',
                'opacity-0 group-hover:opacity-100 transition-opacity',
                'hover:bg-white focus:outline-none focus:ring-2 focus:ring-red-500'
              )}
              aria-label={language === 'ar' ? 'الصورة السابقة' : 'Image précédente'}
            >
              <svg className="w-5 h-5 text-slate-700 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className={cn(
                'absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg',
                'opacity-0 group-hover:opacity-100 transition-opacity',
                'hover:bg-white focus:outline-none focus:ring-2 focus:ring-red-500'
              )}
              aria-label={language === 'ar' ? 'الصورة التالية' : 'Image suivante'}
            >
              <svg className="w-5 h-5 text-slate-700 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Image counter */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 text-white text-sm rounded-full">
            {selectedIndex + 1} / {displayImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all',
                selectedIndex === index
                  ? 'border-red-600 ring-2 ring-red-200'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <img
                src={imageError.has(index) ? PLACEHOLDER_IMAGE : image}
                alt={`${productName} - ${language === 'ar' ? 'صورة مصغرة' : 'miniature'} ${index + 1}`}
                className="w-full h-full object-cover"
                onError={() => handleImageError(index)}
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-label={language === 'ar' ? 'عرض الصورة' : 'Vue de l\'image'}
          tabIndex={0}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
            aria-label={language === 'ar' ? 'إغلاق' : 'Fermer'}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Main lightbox image */}
          <img
            src={getImageSrc(selectedIndex)}
            alt={`${productName} - ${selectedIndex + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Navigation in lightbox */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                aria-label={language === 'ar' ? 'الصورة السابقة' : 'Image précédente'}
              >
                <svg className="w-8 h-8 text-white rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                aria-label={language === 'ar' ? 'الصورة التالية' : 'Image suivante'}
              >
                <svg className="w-8 h-8 text-white rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Lightbox thumbnails */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {displayImages.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setSelectedIndex(index); }}
                  className={cn(
                    'w-3 h-3 rounded-full transition-all',
                    selectedIndex === index
                      ? 'bg-white scale-125'
                      : 'bg-white/50 hover:bg-white/80'
                  )}
                  aria-label={`${language === 'ar' ? 'صورة' : 'Image'} ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
