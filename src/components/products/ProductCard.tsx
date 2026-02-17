/**
 * Product Card Component
 * Ghalinino - Tunisia E-commerce
 *
 * PERFORMANCE FIX
 * ---------------
 * `openCart` was listed in the useCallback dep array even though it was never
 * called (the auto-open line was commented out). This caused handleAddToCart
 * to be recreated on every render because openCart itself is a new function
 * reference from CartContext each render. Removed it from deps.
 *
 * CART UX FIX
 * -----------
 * After a successful add-to-cart, the CartDrawer is opened automatically
 * (with a 150 ms delay so the user sees the button feedback first).
 * This gives immediate visual confirmation and makes the cart globally
 * accessible regardless of which page the user is on.
 */

import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { cn, formatPrice } from '@/lib/utils';
import { useLanguage } from '@/hooks';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCartContext } from '@/contexts/CartContext';
import { StockBadge } from './StockBadge';
import { Button } from '@/components/common';
import { ProductPriceCompact } from './ProductPrice';
import { VolumeDiscountBadge } from './VolumeDiscounts';

import type { Product, Category } from '@/types/database';
import { CART_ANIMATION_CONFIG } from '@/lib/constants';

// ============================================================================
// TYPES
// ============================================================================

interface ProductCardProps {
  product: Product & { category?: Category | null };
  className?: string;
}

// ============================================================================
// PLACEHOLDER IMAGE
// ============================================================================

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjFGNUY5Ii8+CjxwYXRoIGQ9Ik0xNjAgMTYwSDE4MEwyMDAgMTgwTDI0MCAxNDBMMjgwIDE4MFYyNDBIMTIwVjE4MEwxNjAgMTYwWiIgZmlsbD0iI0UyRThGMCIvPgo8Y2lyY2xlIGN4PSIxNjAiIGN5PSIxNDAiIHI9IjIwIiBmaWxsPSIjRTJFOEYwIi8+Cjwvc3ZnPgo=';

// ============================================================================
// TRANSLATIONS
// ============================================================================

const t = {
  addToCart: { ar: 'أضف للسلة', fr: 'Ajouter' },
  added: { ar: '✓ تمت الإضافة', fr: '✓ Ajouté' },
  outOfStock: { ar: 'نفذ المخزون', fr: 'Épuisé' },
  error: { ar: 'خطأ', fr: 'Erreur' },
  addFailed: { ar: 'فشل في الإضافة', fr: "Échec de l'ajout" },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductCard({ product, className }: ProductCardProps) {
  const { language } = useLanguage();
  const { profile } = useAuthContext();

  // addToCart and openCart come from the same CartContext instance that is
  // mounted above the router in App.tsx, so they're available on every page.
  const { addToCart, openCart } = useCartContext();

  const [isAdding, setIsAdding] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isWholesale = profile?.wholesale_status === 'approved';
  const isPendingWholesale = profile?.wholesale_status === 'pending';
  const name = language === 'ar' ? product.name_ar : product.name_fr;
  const isOutOfStock = product.quantity <= 0;

const handleAddToCart = useCallback(
     async (e: React.MouseEvent) => {
       e.preventDefault();
       e.stopPropagation();
   
       if (isOutOfStock || isAdding) return;
   
       setIsAdding(true);
   
       try {
         const result = await addToCart(product.id, 1);
   
         if (result.success) {
           setTimeout(() => {
             openCart();
             setIsAdding(false); // Unblock immediately after opening
           }, CART_ANIMATION_CONFIG.DRAWER_OPEN_DELAY);
         } else {
           setTimeout(() => {
             setIsAdding(false);
           }, CART_ANIMATION_CONFIG.ERROR_STATE_DURATION);
         }
       } catch (error) {
         console.error('Add to cart error:', error);
         setTimeout(() => {
           setIsAdding(false);
         }, CART_ANIMATION_CONFIG.ERROR_STATE_DURATION);
       }
     },
     [product.id, isOutOfStock, isAdding, addToCart, openCart]
   );

  return (
    <Link
      to={`/product/${product.slug}`}
      className={cn(
        'group block bg-white rounded-2xl overflow-hidden',
        'border border-slate-200 hover:border-red-200',
        'shadow-sm hover:shadow-lg transition-all duration-300',
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        <img
          src={imageError || !product.images?.[0] ? PLACEHOLDER_IMAGE : product.images[0]}
          alt={name}
          className={cn(
            'w-full h-full object-cover transition-transform duration-500',
            'group-hover:scale-110'
          )}
          onError={() => setImageError(true)}
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.is_featured && (
            <span className="px-2 py-1 bg-red-600 text-white text-xs font-medium rounded-full">
              {language === 'ar' ? 'مميز' : 'Vedette'}
            </span>
          )}

          {product.compare_at_price &&
            product.compare_at_price > product.price &&
            !product.wholesale_price && (
              <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
                -
                {Math.round(
                  ((product.compare_at_price - product.price) / product.compare_at_price) * 100
                )}
                %
              </span>
            )}

          {product.is_wholesale_only && (
            <span className="px-2 py-1 bg-purple-600 text-white text-xs font-medium rounded-full">
              {language === 'ar' ? 'جملة فقط' : 'Gros seulement'}
            </span>
          )}
        </div>

        {/* Stock badge */}
        <div className="absolute top-3 right-3">
          <StockBadge
            quantity={product.quantity}
            lowStockThreshold={product.low_stock_threshold || 10}
            size="sm"
          />
        </div>

        {/* Quick add-to-cart (reveals on hover) */}
        <div
          className={cn(
            'absolute bottom-0 inset-x-0 p-3',
            'bg-gradient-to-t from-black/60 to-transparent',
            'translate-y-full group-hover:translate-y-0',
            'transition-transform duration-300'
          )}
        >
          <Button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            fullWidth
            size="sm"
            variant={isAdding ? 'secondary' : 'primary'}
            leftIcon={
              isAdding ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              )
            }
          >
            {isOutOfStock
              ? t.outOfStock[language]
              : isAdding
              ? t.added[language]
              : t.addToCart[language]}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {product.category && (
          <p className="text-xs text-slate-500 mb-1">
            {language === 'ar' ? product.category.name_ar : product.category.name_fr}
          </p>
        )}

        <h3 className="font-medium text-slate-900 line-clamp-2 mb-2 group-hover:text-red-600 transition-colors">
          {name}
        </h3>

        <div className="mt-4">
          <ProductPriceCompact
            price={product.price}
            wholesalePrice={product.wholesale_price ?? undefined}
            compareAtPrice={product.compare_at_price ?? undefined}
          />

          <div className="mt-2">
            <VolumeDiscountBadge
              productId={product.id}
              basePrice={product.wholesale_price ?? product.price}
            />
          </div>
        </div>

        {isPendingWholesale && product.wholesale_price && (
          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {language === 'ar'
              ? 'أسعار الجملة بعد الموافقة'
              : 'Prix gros après approbation'}
          </p>
        )}
      </div>
    </Link>
  );
}

// ============================================================================
// SKELETON LOADER
// ============================================================================

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 animate-pulse">
      <div className="aspect-square bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-slate-200 rounded w-1/3" />
        <div className="h-4 bg-slate-200 rounded w-full" />
        <div className="h-4 bg-slate-200 rounded w-2/3" />
        <div className="h-6 bg-slate-200 rounded w-1/2" />
      </div>
    </div>
  );
}