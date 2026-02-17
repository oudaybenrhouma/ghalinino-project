/**
 * Product Detail Page
 * Ghalinino - Tunisia E-commerce
 *
 * FIXES APPLIED
 * ─────────────
 * 1. CART: handleAddToCart was calling the Zustand store's addToCart directly,
 *    bypassing CartContext entirely. This meant:
 *    - No stock validation against Supabase
 *    - No Supabase cart sync for authenticated users
 *    - No guest↔auth cart migration support
 *    - No shared cart state with CartDrawer / CartBadge
 *    Fixed: now uses useCartContext().addToCart (async, validated, synced).
 *
 * 2. CART UX: After a successful add, the CartDrawer now auto-opens (150 ms
 *    delay so the user sees the ✓ button state first), matching ProductCard
 *    behaviour on the Products page.
 *
 * 3. HEADER: CartBadge added to the page header so the cart count is visible
 *    and the drawer is accessible without navigating away.
 *
 * 4. NOTIFICATION: addNotification call kept — ToastNotifications (now mounted
 *    globally in App.tsx) will render it.
 */

import { useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { cn, formatPrice } from '@/lib/utils';
import { useLanguage } from '@/hooks';
import { useProductDetail, useRelatedProducts } from '@/hooks/useProductDetail';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCartContext } from '@/contexts/CartContext';
import { useStore } from '@/store';
import { ImageGallery } from '@/components/products/ImageGallery';
import { StockBadge } from '@/components/products/StockBadge';
import { ProductCard, ProductCardSkeleton } from '@/components/products/ProductCard';
import { Button, LanguageToggle } from '@/components/common';
import { CartBadge } from '@/components/cart';
import { ProductPriceLarge } from '@/components/products/ProductPrice';
import { VolumeDiscounts } from '@/components/products/VolumeDiscounts';

// ============================================================================
// TRANSLATIONS
// ============================================================================

const t = {
  home: { ar: 'الرئيسية', fr: 'Accueil' },
  products: { ar: 'المنتجات', fr: 'Produits' },
  addToCart: { ar: 'أضف إلى السلة', fr: 'Ajouter au panier' },
  added: { ar: '✓ تمت الإضافة!', fr: '✓ Ajouté !' },
  outOfStock: { ar: 'نفذ المخزون', fr: 'Rupture de stock' },
  quantity: { ar: 'الكمية', fr: 'Quantité' },
  inStock: { ar: 'متوفر', fr: 'En stock' },
  available: { ar: 'قطعة متاحة', fr: 'disponibles' },
  sku: { ar: 'رمز المنتج', fr: 'Référence' },
  category: { ar: 'الفئة', fr: 'Catégorie' },
  brand: { ar: 'العلامة التجارية', fr: 'Marque' },

  // Pricing
  retailPrice: { ar: 'سعر التجزئة', fr: 'Prix détail' },
  wholesalePrice: { ar: 'سعر الجملة', fr: 'Prix gros' },
  youSave: { ar: 'توفير', fr: 'Économie' },
  wholesalePending: { ar: 'أسعار الجملة متاحة بعد الموافقة على طلبك', fr: 'Prix gros disponibles après approbation' },
  minWholesale: { ar: 'الحد الأدنى للجملة', fr: 'Quantité min gros' },

  // Tabs
  description: { ar: 'الوصف', fr: 'Description' },
  shipping: { ar: 'الشحن', fr: 'Livraison' },

  // Shipping info
  shippingText: { ar: 'التوصيل متاح لجميع ولايات تونس. مدة التوصيل 2-5 أيام عمل.', fr: 'Livraison disponible dans tous les gouvernorats de Tunisie. Délai de livraison 2-5 jours ouvrables.' },
  grandTunis: { ar: 'تونس الكبرى', fr: 'Grand Tunis' },
  otherRegions: { ar: 'باقي الولايات', fr: 'Autres régions' },

  // Related
  relatedProducts: { ar: 'منتجات مشابهة', fr: 'Produits similaires' },

  // Errors
  notFound: { ar: 'المنتج غير موجود', fr: 'Produit non trouvé' },
  notFoundDesc: { ar: 'عذراً، لم نتمكن من العثور على هذا المنتج.', fr: "Désolé, nous n'avons pas trouvé ce produit." },
  backToProducts: { ar: 'العودة للمنتجات', fr: 'Retour aux produits' },

  // Stock alerts
  stockUpdated: { ar: 'تم تحديث المخزون', fr: 'Stock mis à jour' },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const { isWholesale, isPendingWholesale } = useAuthContext();

  // ── FIXED: use CartContext, not Zustand store ──────────────────────────────
  // CartContext.addToCart is async, validates stock against Supabase, syncs the
  // Supabase cart for authenticated users, and handles guest localStorage.
  // The old useStore(state => state.addToCart) was a pure local state update
  // that was completely disconnected from CartDrawer / CartBadge state.
  const { addToCart, openCart } = useCartContext();
  const addNotification = useStore((state) => state.addNotification);

  const { product, isLoading, error, stockChanged, clearStockChanged } = useProductDetail({
    productSlug: slug,
    realtime: true,
  });

  const { products: relatedProducts, isLoading: loadingRelated } = useRelatedProducts(
    product?.category_id || null,
    product?.id || null,
    4
  );

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'shipping'>('description');
  const [isAdding, setIsAdding] = useState(false);

  if (stockChanged) {
    setTimeout(clearStockChanged, 3000);
  }

  const isOutOfStock = !product || product.quantity <= 0;
  const maxQuantity = product?.quantity || 0;

  const name = product ? (language === 'ar' ? product.name_ar : product.name_fr) : '';
  const description = product
    ? language === 'ar'
      ? product.description_ar
      : product.description_fr
    : '';

  const handleQuantityChange = useCallback(
    (delta: number) => {
      setQuantity((prev) => {
        const next = prev + delta;
        if (next < 1) return 1;
        if (next > maxQuantity) return maxQuantity;
        return next;
      });
    },
    [maxQuantity]
  );

  // ── FIXED: handleAddToCart ─────────────────────────────────────────────────
  const handleAddToCart = useCallback(async () => {
    if (!product || isOutOfStock || isAdding) return;

    setIsAdding(true);

    try {
      // CartContext.addToCart: validates stock, syncs Supabase / localStorage,
      // and returns { success, error? } — same as ProductCard.
      const result = await addToCart(product.id, quantity);

      if (result.success) {
        addNotification({
          type: 'success',
          title: language === 'ar' ? 'تمت إضافة المنتج' : 'Produit ajouté',
          message: `${quantity}x ${name}`,
          duration: 3000,
        });

        // Open cart drawer after a short delay (lets user see the ✓ state first)
        setTimeout(() => openCart(), 150);

        // Reset quantity back to 1 after success
        setTimeout(() => {
          setIsAdding(false);
          setQuantity(1);
        }, 1500);
      } else {
        addNotification({
          type: 'error',
          title: language === 'ar' ? 'خطأ' : 'Erreur',
          message: result.error || (language === 'ar' ? 'فشل في الإضافة' : "Échec de l'ajout"),
          duration: 3000,
        });
        setIsAdding(false);
      }
    } catch (err) {
      console.error('Add to cart error:', err);
      addNotification({
        type: 'error',
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        message: language === 'ar' ? 'فشل في الإضافة' : "Échec de l'ajout",
        duration: 3000,
      });
      setIsAdding(false);
    }
  }, [product, quantity, isOutOfStock, isAdding, addToCart, openCart, addNotification, language, name]);

  // ============================================================================
  // RENDER STATES
  // ============================================================================

  if (isLoading) {
    return (
      <div className={cn('min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50', isRTL ? 'font-[Cairo]' : 'font-[Inter]')}>
        <PageHeader language={language} isRTL={isRTL} />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="aspect-square bg-slate-200 rounded-2xl animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 bg-slate-200 rounded w-3/4 animate-pulse" />
              <div className="h-6 bg-slate-200 rounded w-1/2 animate-pulse" />
              <div className="h-10 bg-slate-200 rounded w-1/3 animate-pulse" />
              <div className="h-32 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className={cn('min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50', isRTL ? 'font-[Cairo]' : 'font-[Inter]')}>
        <PageHeader language={language} isRTL={isRTL} />
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
      </div>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className={cn('min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50', isRTL ? 'font-[Cairo]' : 'font-[Inter]')}>
      <PageHeader language={language} isRTL={isRTL} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link to="/" className="hover:text-red-600 transition-colors">{t.home[language]}</Link>
          <span className="rtl:rotate-180">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
          <Link to="/products" className="hover:text-red-600 transition-colors">{t.products[language]}</Link>
          <span className="rtl:rotate-180">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
          <span className="text-slate-900 font-medium truncate">{name}</span>
        </nav>

        {/* Stock Update Alert */}
        {stockChanged && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-amber-800">
              {t.stockUpdated[language]}: {product.quantity} {t.available[language]}
            </p>
          </div>
        )}

        {/* Product Content */}
        <div className="grid lg:grid-cols-2 gap-12">
          <ImageGallery images={product.images} productName={name} />

          <div className="space-y-6">
            {product.category && (
              <Link
                to={`/products/${product.category.slug}`}
                className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-red-600 transition-colors"
              >
                {language === 'ar' ? product.category.name_ar : product.category.name_fr}
              </Link>
            )}

            <h1 className="text-3xl font-bold text-slate-900">{name}</h1>

            <StockBadge
              quantity={product.quantity}
              lowStockThreshold={product.low_stock_threshold || 10}
              showQuantity
              size="md"
            />

            {/* Price */}
            <div className="mb-6">
              <ProductPriceLarge
                price={product.price}
                wholesalePrice={product.wholesale_price ?? undefined}
                compareAtPrice={product.compare_at_price ?? undefined}
              />
            </div>

            {/* Volume discounts */}
            <VolumeDiscounts
              productId={product.id}
              basePrice={product.wholesale_price ?? product.price}
              className="mb-6"
            />

            {/* Wholesale notices */}
            {isPendingWholesale && product.wholesale_price && (
              <p className="text-sm text-amber-600 flex items-center gap-2 mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t.wholesalePending[language]}
              </p>
            )}

            {isWholesale && product.wholesale_min_quantity > 1 && (
              <p className="text-sm text-slate-600 mb-6">
                {t.minWholesale[language]}: {product.wholesale_min_quantity}
              </p>
            )}

            {/* Quantity selector + Add to Cart */}
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-slate-300 rounded-lg">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="p-3 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setQuantity(Math.min(Math.max(1, val), maxQuantity));
                  }}
                  min={1}
                  max={maxQuantity}
                  disabled={isOutOfStock}
                  className="w-16 text-center border-0 focus:ring-0 text-lg font-medium"
                />
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= maxQuantity || isOutOfStock}
                  className="p-3 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                isLoading={isAdding}
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

            {/* Meta info */}
            <div className="flex flex-wrap gap-4 text-sm text-slate-600 pt-4 border-t">
              {product.sku && (
                <p>
                  <span className="font-medium">{t.sku[language]}:</span> {product.sku}
                </p>
              )}
              {product.brand && (
                <p>
                  <span className="font-medium">{t.brand[language]}:</span> {product.brand}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('description')}
              className={cn(
                'px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === 'description'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              {t.description[language]}
            </button>
            <button
              onClick={() => setActiveTab('shipping')}
              className={cn(
                'px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === 'shipping'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              {t.shipping[language]}
            </button>
          </div>

          <div className="py-6">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                {description ? (
                  <p className="text-slate-700 whitespace-pre-wrap">{description}</p>
                ) : (
                  <p className="text-slate-500 italic">
                    {language === 'ar' ? 'لا يوجد وصف متاح' : 'Aucune description disponible'}
                  </p>
                )}
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-4">
                <p className="text-slate-700">{t.shippingText[language]}</p>
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="font-medium text-slate-900">{t.grandTunis[language]}</p>
                    <p className="text-lg font-bold text-red-600">5.000 TND</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="font-medium text-slate-900">{t.otherRegions[language]}</p>
                    <p className="text-lg font-bold text-red-600">7.000 - 10.000 TND</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
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

      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-slate-500 text-sm">
          <p>
            {language === 'ar'
              ? '© 2024 غالينينو. جميع الحقوق محفوظة.'
              : '© 2024 Ghalinino. Tous droits réservés.'}
          </p>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// PAGE HEADER — now includes CartBadge
// ============================================================================

function PageHeader({ language, isRTL }: { language: 'ar' | 'fr'; isRTL: boolean }) {
  return (
    <header
      className={cn(
        'bg-white border-b border-slate-200 sticky top-0 z-40',
        isRTL ? 'font-[Cairo]' : 'font-[Inter]'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
            <span className="text-white font-bold text-lg">غ</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-slate-900 text-lg">
              {language === 'ar' ? 'غالينينو' : 'Ghalinino'}
            </h1>
          </div>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            to="/products"
            className="text-slate-600 hover:text-red-600 transition-colors text-sm font-medium"
          >
            {language === 'ar' ? 'المنتجات' : 'Produits'}
          </Link>

          {/* CartBadge opens the global CartDrawer mounted in App.tsx */}
          <CartBadge />

          <LanguageToggle />
        </nav>
      </div>
    </header>
  );
}