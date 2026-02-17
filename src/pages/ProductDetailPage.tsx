/**
 * Product Detail Page
 * Ghalinino — Tunisia E-commerce
 *
 * CHANGES IN THIS VERSION
 * ────────────────────────
 * • Removed the old inline PageHeader component; uses the shared
 *   CustomerLayout so the header is identical on every customer page
 *   (same logo, same nav, same CartBadge, same LanguageToggle).
 *
 * • stockChanged side-effect moved into a proper useEffect so it is
 *   not triggered as a render-time side-effect (which React warns about
 *   and can fire multiple times per render in StrictMode).
 *
 * • handleAddToCart timing improved:
 *   - setIsAdding(false) happens immediately after the cart drawer
 *     opens (150 ms), not after 1 500 ms, so the button is unblocked
 *     sooner and users can add another item without waiting.
 *   - quantity resets to 1 at the same 150 ms mark.
 *   - The 1 500 ms timeout is kept as the ✓ display window in
 *     ProductCard, which still needs it because those cards stay
 *     visible; on this page, closing the state quickly is better UX.
 *
 * • All imports cleaned up (removed unused formatPrice, unused LanguageToggle
 *   and CartBadge that were only needed by the old inline header).
 *
 * • Footer pulled out into its own tiny component so the render tree
 *   is easier to read.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks';
import { useProductDetail, useRelatedProducts } from '@/hooks/useProductDetail';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCartContext } from '@/contexts/CartContext';
import { useStore } from '@/store';
import { ImageGallery } from '@/components/products/ImageGallery';
import { StockBadge } from '@/components/products/StockBadge';
import { ProductCard, ProductCardSkeleton } from '@/components/products/ProductCard';
import { Button } from '@/components/common';
import { ProductPriceLarge } from '@/components/products/ProductPrice';
import { VolumeDiscounts } from '@/components/products/VolumeDiscounts';
import { CustomerLayout } from '@/components/layout/CustomerLayout';

// ============================================================================
// TRANSLATIONS
// ============================================================================

const t = {
  home:            { ar: 'الرئيسية',                      fr: 'Accueil' },
  products:        { ar: 'المنتجات',                      fr: 'Produits' },
  addToCart:       { ar: 'أضف إلى السلة',                 fr: 'Ajouter au panier' },
  added:           { ar: '✓ تمت الإضافة!',                fr: '✓ Ajouté !' },
  outOfStock:      { ar: 'نفذ المخزون',                   fr: 'Rupture de stock' },
  available:       { ar: 'قطعة متاحة',                    fr: 'disponibles' },
  sku:             { ar: 'رمز المنتج',                    fr: 'Référence' },
  brand:           { ar: 'العلامة التجارية',              fr: 'Marque' },

  // Pricing
  wholesalePending: { ar: 'أسعار الجملة متاحة بعد الموافقة على طلبك', fr: 'Prix gros disponibles après approbation' },
  minWholesale:    { ar: 'الحد الأدنى للجملة',           fr: 'Quantité min gros' },

  // Tabs
  description:     { ar: 'الوصف',                        fr: 'Description' },
  shipping:        { ar: 'الشحن',                         fr: 'Livraison' },

  // Shipping
  shippingText:    {
    ar: 'التوصيل متاح لجميع ولايات تونس. مدة التوصيل 2-5 أيام عمل.',
    fr: 'Livraison disponible dans tous les gouvernorats de Tunisie. Délai de livraison 2-5 jours ouvrables.',
  },
  grandTunis:      { ar: 'تونس الكبرى',                  fr: 'Grand Tunis' },
  otherRegions:    { ar: 'باقي الولايات',                fr: 'Autres régions' },

  // Related
  relatedProducts: { ar: 'منتجات مشابهة',               fr: 'Produits similaires' },

  // Errors
  notFound:        { ar: 'المنتج غير موجود',             fr: 'Produit non trouvé' },
  notFoundDesc:    { ar: 'عذراً، لم نتمكن من العثور على هذا المنتج.', fr: "Désolé, nous n'avons pas trouvé ce produit." },
  backToProducts:  { ar: 'العودة للمنتجات',              fr: 'Retour aux produits' },

  // Stock alerts
  stockUpdated:    { ar: 'تم تحديث المخزون',             fr: 'Stock mis à jour' },

  // Notifications
  addedTitle:      { ar: 'تمت إضافة المنتج',             fr: 'Produit ajouté' },
  errorTitle:      { ar: 'خطأ',                           fr: 'Erreur' },
  addFailed:       { ar: 'فشل في الإضافة',               fr: "Échec de l'ajout" },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductDetailPage() {
  const { slug }                     = useParams<{ slug: string }>();
  const navigate                     = useNavigate();
  const { language, isRTL }          = useLanguage();
  const { isWholesale, isPendingWholesale } = useAuthContext();
  const { addToCart, openCart }      = useCartContext();
  const addNotification              = useStore((state) => state.addNotification);

  const { product, isLoading, error, stockChanged, clearStockChanged } = useProductDetail({
    productSlug: slug,
    realtime: true,
  });

  const { products: relatedProducts, isLoading: loadingRelated } = useRelatedProducts(
    product?.category_id || null,
    product?.id        || null,
    4
  );

  const [quantity,   setQuantity]   = useState(1);
  const [activeTab,  setActiveTab]  = useState<'description' | 'shipping'>('description');
  const [isAdding,   setIsAdding]   = useState(false);

  // ── Clear stock-changed flag after 3 s (effect, not render-time call) ──────
  useEffect(() => {
    if (!stockChanged) return;
    const id = setTimeout(clearStockChanged, 3000);
    return () => clearTimeout(id);
  }, [stockChanged, clearStockChanged]);

  // Derived values
  const isOutOfStock  = !product || product.quantity <= 0;
  const maxQuantity   = product?.quantity || 0;
  const name          = product ? (language === 'ar' ? product.name_ar : product.name_fr) : '';
  const description   = product
    ? (language === 'ar' ? product.description_ar : product.description_fr)
    : '';

  // ── Quantity controls ───────────────────────────────────────────────────────
  const handleQuantityChange = useCallback((delta: number) => {
    setQuantity((prev) => {
      const next = prev + delta;
      return Math.min(Math.max(1, next), maxQuantity);
    });
  }, [maxQuantity]);

  // ── Add to cart ─────────────────────────────────────────────────────────────
  const handleAddToCart = useCallback(async () => {
    if (!product || isOutOfStock || isAdding) return;

    setIsAdding(true);

    try {
      const result = await addToCart(product.id, quantity);

      if (result.success) {
        addNotification({
          type: 'success',
          title: t.addedTitle[language],
          message: `${quantity}× ${name}`,
          duration: 3000,
        });

        // Open cart drawer after a brief pause (user sees the ✓ first).
        // Then immediately reset state so the button is usable again.
        setTimeout(() => {
          openCart();
          setIsAdding(false);
          setQuantity(1);
        }, 150);
      } else {
        addNotification({
          type: 'error',
          title: t.errorTitle[language],
          message: result.error || t.addFailed[language],
          duration: 3000,
        });
        setIsAdding(false);
      }
    } catch (err) {
      console.error('Add to cart error:', err);
      addNotification({
        type: 'error',
        title: t.errorTitle[language],
        message: t.addFailed[language],
        duration: 3000,
      });
      setIsAdding(false);
    }
  }, [product, quantity, isOutOfStock, isAdding, addToCart, openCart, addNotification, language, name]);

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <CustomerLayout>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Image skeleton */}
            <div className="aspect-square bg-slate-200 rounded-2xl animate-pulse" />
            {/* Info skeleton */}
            <div className="space-y-4 pt-2">
              <div className="h-4 bg-slate-200 rounded w-1/4 animate-pulse" />
              <div className="h-8 bg-slate-200 rounded w-3/4 animate-pulse" />
              <div className="h-6 bg-slate-200 rounded w-1/3 animate-pulse" />
              <div className="h-10 bg-slate-200 rounded w-2/5 animate-pulse" />
              <div className="h-32 bg-slate-200 rounded animate-pulse" />
              <div className="h-12 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
        </main>
      </CustomerLayout>
    );
  }

  // ============================================================================
  // ERROR / NOT FOUND STATE
  // ============================================================================

  if (error || !product) {
    return (
      <CustomerLayout>
        <main className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{t.notFound[language]}</h1>
            <p className="text-slate-600 mb-6">{t.notFoundDesc[language]}</p>
            <Button onClick={() => navigate('/products')}>{t.backToProducts[language]}</Button>
          </div>
        </main>
      </CustomerLayout>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <CustomerLayout>
      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-2 text-sm text-slate-500 mb-6"
          aria-label="breadcrumb"
        >
          <Link to="/" className="hover:text-red-600 transition-colors">
            {t.home[language]}
          </Link>
          <ChevronIcon isRTL={isRTL} />
          <Link to="/products" className="hover:text-red-600 transition-colors">
            {t.products[language]}
          </Link>
          <ChevronIcon isRTL={isRTL} />
          <span className="text-slate-900 font-medium truncate max-w-[200px]">{name}</span>
        </nav>

        {/* Real-time stock alert */}
        {stockChanged && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-amber-800 text-sm font-medium">
              {t.stockUpdated[language]}: {product.quantity} {t.available[language]}
            </p>
          </div>
        )}

        {/* ── Product content ─────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-12">

          {/* Left: Gallery */}
          <ImageGallery images={product.images} productName={name} />

          {/* Right: Details */}
          <div className="space-y-5">

            {/* Category link */}
            {product.category && (
              <Link
                to={`/products/${product.category.slug}`}
                className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-red-600 transition-colors"
              >
                {language === 'ar' ? product.category.name_ar : product.category.name_fr}
              </Link>
            )}

            {/* Name */}
            <h1 className="text-3xl font-bold text-slate-900 leading-tight">{name}</h1>

            {/* Stock badge */}
            <StockBadge
              quantity={product.quantity}
              lowStockThreshold={product.low_stock_threshold || 10}
              showQuantity
              size="md"
            />

            {/* Price */}
            <ProductPriceLarge
              price={product.price}
              wholesalePrice={product.wholesale_price ?? undefined}
              compareAtPrice={product.compare_at_price ?? undefined}
            />

            {/* Volume discounts */}
            <VolumeDiscounts
              productId={product.id}
              basePrice={product.wholesale_price ?? product.price}
            />

            {/* Wholesale notices */}
            {isPendingWholesale && product.wholesale_price && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <svg className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-amber-700">{t.wholesalePending[language]}</p>
              </div>
            )}

            {isWholesale && product.wholesale_min_quantity > 1 && (
              <p className="text-sm text-slate-600">
                <span className="font-medium">{t.minWholesale[language]}:</span>{' '}
                {product.wholesale_min_quantity}
              </p>
            )}

            {/* ── Quantity + Add-to-cart ──────────────────────────────────── */}
            <div className="flex items-center gap-3 pt-2">
              {/* Stepper */}
              <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1 || isOutOfStock}
                  aria-label="Decrease quantity"
                  className={cn(
                    'px-3 py-3 transition-colors',
                    'hover:bg-slate-100 active:bg-slate-200',
                    'disabled:opacity-40 disabled:cursor-not-allowed'
                  )}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>

                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 1;
                    setQuantity(Math.min(Math.max(1, val), maxQuantity));
                  }}
                  min={1}
                  max={maxQuantity}
                  disabled={isOutOfStock}
                  aria-label="Quantity"
                  className="w-14 text-center text-lg font-semibold bg-transparent border-0 focus:ring-0 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= maxQuantity || isOutOfStock}
                  aria-label="Increase quantity"
                  className={cn(
                    'px-3 py-3 transition-colors',
                    'hover:bg-slate-100 active:bg-slate-200',
                    'disabled:opacity-40 disabled:cursor-not-allowed'
                  )}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              {/* CTA */}
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAdding}
                size="lg"
                className="flex-1"
                leftIcon={
                  isAdding ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
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

            {/* Meta: SKU / Brand */}
            {(product.sku || product.brand) && (
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-500 pt-3 border-t border-slate-100">
                {product.sku && (
                  <p>
                    <span className="font-medium text-slate-700">{t.sku[language]}:</span>{' '}
                    {product.sku}
                  </p>
                )}
                {product.brand && (
                  <p>
                    <span className="font-medium text-slate-700">{t.brand[language]}:</span>{' '}
                    {product.brand}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Description / Shipping tabs ─────────────────────────────────── */}
        <div className="mt-14 border-t border-slate-200 pt-8">
          {/* Tab list */}
          <div className="flex border-b border-slate-200 mb-6" role="tablist">
            {(['description', 'shipping'] as const).map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                  activeTab === tab
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                )}
              >
                {t[tab][language]}
              </button>
            ))}
          </div>

          {/* Description */}
          {activeTab === 'description' && (
            <div className="prose prose-slate max-w-none">
              {description ? (
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{description}</p>
              ) : (
                <p className="text-slate-400 italic">
                  {language === 'ar' ? 'لا يوجد وصف متاح' : 'Aucune description disponible'}
                </p>
              )}
            </div>
          )}

          {/* Shipping */}
          {activeTab === 'shipping' && (
            <div className="space-y-4">
              <p className="text-slate-700">{t.shippingText[language]}</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-medium text-slate-900 mb-1">{t.grandTunis[language]}</p>
                  <p className="text-xl font-bold text-red-600">5.000 TND</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-medium text-slate-900 mb-1">{t.otherRegions[language]}</p>
                  <p className="text-xl font-bold text-red-600">7.000 – 10.000 TND</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Related products ─────────────────────────────────────────────── */}
        {(loadingRelated || relatedProducts.length > 0) && (
          <div className="mt-14">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              {t.relatedProducts[language]}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loadingRelated
                ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : relatedProducts.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <PageFooter language={language} />
    </CustomerLayout>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ChevronIcon({ isRTL }: { isRTL: boolean }) {
  return (
    <svg
      className={cn('w-4 h-4 text-slate-400 shrink-0', isRTL && 'rotate-180')}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function PageFooter({ language }: { language: 'ar' | 'fr' }) {
  return (
    <footer className="bg-white border-t border-slate-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-8 text-center text-slate-500 text-sm">
        <p>
          {language === 'ar'
            ? '© 2024 غالينينو. جميع الحقوق محفوظة.'
            : '© 2024 Ghalinino. Tous droits réservés.'}
        </p>
      </div>
    </footer>
  );
}