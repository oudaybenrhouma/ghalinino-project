/**
 * Cart Drawer Component
 * Ghalinino - Tunisia E-commerce
 * 
 * Slide-out cart panel from the right side with:
 * - Backdrop blur
 * - Cart items list
 * - Summary and checkout button
 * - Empty cart state
 */

import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks';
import { useCartContext } from '@/contexts/CartContext';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { Button } from '@/components/common';

// ============================================================================
// TRANSLATIONS
// ============================================================================

const t = {
  title: { ar: 'سلة التسوق', fr: 'Panier' },
  empty: { ar: 'سلتك فارغة', fr: 'Votre panier est vide' },
  emptyDesc: { ar: 'ابدأ بإضافة بعض المنتجات', fr: 'Commencez à ajouter des produits' },
  browseProducts: { ar: 'تصفح المنتجات', fr: 'Parcourir les produits' },
  clearCart: { ar: 'إفراغ السلة', fr: 'Vider le panier' },
  close: { ar: 'إغلاق', fr: 'Fermer' },
  items: { ar: 'منتجات', fr: 'articles' },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function CartDrawer() {
  const { language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const { items, isLoading, isCartOpen, closeCart, clearCart, itemCount } = useCartContext();

  // Handle escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeCart();
    }
  }, [closeCart]);

  // Add/remove event listener
  useEffect(() => {
    if (isCartOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isCartOpen, handleKeyDown]);

  // Handle checkout
  const handleCheckout = useCallback(() => {
    closeCart();
    navigate('/checkout');
  }, [closeCart, navigate]);

  // Handle browse products
  const handleBrowse = useCallback(() => {
    closeCart();
    navigate('/products');
  }, [closeCart, navigate]);

  // Handle clear cart
  const handleClearCart = useCallback(async () => {
    await clearCart();
  }, [clearCart]);

  // Don't render if closed
  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={cn(
          'absolute top-0 bottom-0 w-full max-w-md bg-white shadow-2xl',
          'flex flex-col',
          'transform transition-transform duration-300 ease-out',
          isRTL ? 'left-0' : 'right-0',
          isCartOpen 
            ? 'translate-x-0' 
            : isRTL 
              ? '-translate-x-full' 
              : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label={t.title[language]}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900">
              {t.title[language]}
            </h2>
            {itemCount > 0 && (
              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-sm font-medium rounded-full">
                {itemCount}
              </span>
            )}
          </div>
          
          <button
            onClick={closeCart}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label={t.close[language]}
          >
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <svg className="w-8 h-8 animate-spin text-red-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-24 h-24 mb-6 bg-slate-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {t.empty[language]}
              </h3>
              <p className="text-slate-500 mb-6">
                {t.emptyDesc[language]}
              </p>
              <Button onClick={handleBrowse}>
                {t.browseProducts[language]}
              </Button>
            </div>
          )}

          {/* Cart items */}
          {!isLoading && items.length > 0 && (
            <div className="p-4 space-y-3">
              {items.map((item) => (
                <CartItem key={item.id} item={item} compact />
              ))}
            </div>
          )}
        </div>

        {/* Footer with summary */}
        {!isLoading && items.length > 0 && (
          <div className="border-t border-slate-200 p-4 space-y-4">
            <CartSummary compact onCheckout={handleCheckout} />
            
            {/* Clear cart button */}
            <button
              onClick={handleClearCart}
              className="w-full text-center text-sm text-slate-500 hover:text-red-600 transition-colors"
            >
              {t.clearCart[language]}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
