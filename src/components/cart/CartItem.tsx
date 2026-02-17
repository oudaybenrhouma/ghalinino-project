/**
 * Cart Item Component
 * Ghalinino - Tunisia E-commerce
 * 
 * Individual cart item with:
 * - Product thumbnail
 * - Name (localized)
 * - Price (retail or wholesale)
 * - Quantity adjuster
 * - Remove button
 * - Subtotal
 */

import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { cn, formatPrice } from '@/lib/utils';
import { useLanguage } from '@/hooks';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCartContext, type CartItem as CartItemType } from '@/contexts/CartContext';

// ============================================================================
// PLACEHOLDER IMAGE
// ============================================================================

const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjFGNUY5Ii8+CjxwYXRoIGQ9Ik00MCA0MEg0NUw1MCA0NUw2MCAzNUw3MCA0NVY2MEgzMFY0NUw0MCA0MFoiIGZpbGw9IiNFMkU4RjAiLz4KPGNpcmNsZSBjeD0iNDAiIGN5PSIzNSIgcj0iNSIgZmlsbD0iI0UyRThGMCIvPgo8L3N2Zz4K';

// ============================================================================
// TYPES
// ============================================================================

interface CartItemProps {
  item: CartItemType;
  /** Compact mode for smaller displays */
  compact?: boolean;
}

// ============================================================================
// TRANSLATIONS
// ============================================================================

const t = {
  remove: { ar: 'إزالة', fr: 'Retirer' },
  outOfStock: { ar: 'نفذ المخزون', fr: 'Épuisé' },
  onlyLeft: { ar: 'متبقي فقط', fr: 'restants seulement' },
  wholesale: { ar: 'سعر الجملة', fr: 'Prix gros' },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function CartItem({ item, compact = false }: CartItemProps) {
  const { language } = useLanguage();
  const { isWholesale } = useAuthContext();
  const { updateQuantity, removeFromCart } = useCartContext();
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get localized name
  const name = language === 'ar' ? item.product.nameAr : item.product.nameFr;

  // Determine price
  const showWholesalePrice = isWholesale && item.product.wholesalePrice !== null;
  const unitPrice = showWholesalePrice ? item.product.wholesalePrice! : item.product.price;
  const lineTotal = unitPrice * item.quantity;

  // Stock status
  const isOutOfStock = item.product.quantity === 0;
  const isLowStock = item.product.quantity > 0 && item.product.quantity <= 10;

  // Get image
  const imageSrc = imageError || !item.product.images[0] 
    ? PLACEHOLDER_IMAGE 
    : item.product.images[0];

  // Handle quantity change
  const handleQuantityChange = useCallback(async (delta: number) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity < 1 || newQuantity > item.product.quantity) return;
    
    setIsUpdating(true);
    await updateQuantity(item.productId, newQuantity);
    setIsUpdating(false);
  }, [item.quantity, item.product.quantity, item.productId, updateQuantity]);

  // Handle direct input
  const handleInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    const newQuantity = Math.min(Math.max(1, value), item.product.quantity);
    
    if (newQuantity !== item.quantity) {
      setIsUpdating(true);
      await updateQuantity(item.productId, newQuantity);
      setIsUpdating(false);
    }
  }, [item.quantity, item.product.quantity, item.productId, updateQuantity]);

  // Handle remove
  const handleRemove = useCallback(async () => {
    setIsRemoving(true);
    await removeFromCart(item.productId);
    // Don't reset isRemoving since item will be removed from list
  }, [item.productId, removeFromCart]);

  return (
    <div className={cn(
      'flex gap-4 p-4 bg-white rounded-xl border border-slate-200',
      isRemoving && 'opacity-50 pointer-events-none',
      compact ? 'p-3' : 'p-4'
    )}>
      {/* Product Image */}
      <Link 
        to={`/product/${item.product.slug}`}
        className={cn(
          'shrink-0 rounded-lg overflow-hidden bg-slate-100',
          compact ? 'w-16 h-16' : 'w-20 h-20'
        )}
      >
        <img
          src={imageSrc}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name and Remove */}
        <div className="flex justify-between gap-2">
          <Link 
            to={`/product/${item.product.slug}`}
            className={cn(
              'font-medium text-slate-900 hover:text-red-600 transition-colors line-clamp-2',
              compact ? 'text-sm' : 'text-base'
            )}
          >
            {name}
          </Link>
          
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="shrink-0 p-1 text-slate-400 hover:text-red-600 transition-colors"
            aria-label={t.remove[language]}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Price */}
        <div className="mt-1 flex items-center gap-2">
          <span className={cn(
            'font-semibold',
            showWholesalePrice ? 'text-green-600' : 'text-slate-700',
            compact ? 'text-sm' : 'text-base'
          )}>
            {formatPrice(unitPrice * 1000, language)}
          </span>
          
          {showWholesalePrice && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              {t.wholesale[language]}
            </span>
          )}
        </div>

        {/* Stock warning */}
        {isLowStock && !isOutOfStock && (
          <p className="mt-1 text-xs text-amber-600">
            {item.product.quantity} {t.onlyLeft[language]}
          </p>
        )}

        {isOutOfStock && (
          <p className="mt-1 text-xs text-red-600 font-medium">
            {t.outOfStock[language]}
          </p>
        )}

        {/* Quantity and Total */}
        <div className="mt-3 flex items-center justify-between">
          {/* Quantity adjuster */}
          <div className={cn(
            'flex items-center border border-slate-300 rounded-lg',
            isUpdating && 'opacity-50'
          )}>
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={item.quantity <= 1 || isUpdating}
              className="p-2 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            
            <input
              type="number"
              value={item.quantity}
              onChange={handleInputChange}
              min={1}
              max={item.product.quantity}
              disabled={isUpdating}
              className="w-12 text-center border-0 focus:ring-0 text-sm font-medium bg-transparent"
            />
            
            <button
              onClick={() => handleQuantityChange(1)}
              disabled={item.quantity >= item.product.quantity || isUpdating}
              className="p-2 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Line total */}
          <span className={cn(
            'font-bold',
            compact ? 'text-sm' : 'text-base',
            showWholesalePrice ? 'text-green-600' : 'text-slate-900'
          )}>
            {formatPrice(lineTotal * 1000, language)}
          </span>
        </div>
      </div>
    </div>
  );
}
