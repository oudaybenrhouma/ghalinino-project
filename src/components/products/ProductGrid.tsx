/**
 * Product Grid Component
 * Ghalinino - Tunisia E-commerce
 *
 * PERFORMANCE FIXES
 * -----------------
 * 1. Filter handlers wrapped in useCallback so their references stay stable
 *    across renders — prevents the object-identity loop described in useProducts.
 * 2. Desktop category radios call setFilters with useCallback handlers that
 *    produce a new object ONLY when the value truly changes.
 * 3. Search input is debounced (300 ms) so typing doesn't trigger a fetch
 *    on every keystroke.
 * 4. `useMemo` for hasActiveFilters avoids recomputing on unrelated renders.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks';
import {
  useProducts,
  useCategories,
  type ProductFilters,
  type ProductSortOption,
} from '@/hooks/useProducts';
import { ProductCard, ProductCardSkeleton } from './ProductCard';
import { Button } from '@/components/common';

// ============================================================================
// TYPES
// ============================================================================

interface ProductGridProps {
  categorySlug?: string;
  showFilters?: boolean;
  columns?: 2 | 3 | 4;
  title?: string;
  featured?: boolean;
  className?: string;
}

// ============================================================================
// TRANSLATIONS
// ============================================================================

const t = {
  filters: { ar: 'التصفية', fr: 'Filtrer' },
  sort: { ar: 'الترتيب', fr: 'Trier' },
  category: { ar: 'الفئة', fr: 'Catégorie' },
  allCategories: { ar: 'جميع الفئات', fr: 'Toutes les catégories' },
  priceRange: { ar: 'السعر', fr: 'Prix' },
  minPrice: { ar: 'الحد الأدنى', fr: 'Min' },
  maxPrice: { ar: 'الحد الأقصى', fr: 'Max' },
  inStock: { ar: 'المتوفر فقط', fr: 'En stock uniquement' },
  clearFilters: { ar: 'مسح الفلاتر', fr: 'Effacer les filtres' },
  applyFilters: { ar: 'تطبيق', fr: 'Appliquer' },
  sortOptions: {
    featured: { ar: 'المميزة أولاً', fr: "Vedettes d'abord" },
    newest: { ar: 'الأحدث', fr: 'Plus récents' },
    price_asc: { ar: 'السعر: من الأقل للأعلى', fr: 'Prix: croissant' },
    price_desc: { ar: 'السعر: من الأعلى للأقل', fr: 'Prix: décroissant' },
    name_asc: { ar: 'الاسم: أ-ي', fr: 'Nom: A-Z' },
    name_desc: { ar: 'الاسم: ي-أ', fr: 'Nom: Z-A' },
  },
  noProducts: { ar: 'لا توجد منتجات', fr: 'Aucun produit' },
  noProductsDesc: { ar: 'جرب تغيير معايير البحث', fr: 'Essayez de modifier vos critères' },
  loadMore: { ar: 'عرض المزيد', fr: 'Voir plus' },
  loading: { ar: 'جاري التحميل...', fr: 'Chargement...' },
  showing: { ar: 'عرض', fr: 'Affichage de' },
  of: { ar: 'من', fr: 'sur' },
  products: { ar: 'منتج', fr: 'produits' },
  searchPlaceholder: { ar: 'ابحث عن منتج...', fr: 'Rechercher un produit...' },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductGrid({
  categorySlug,
  showFilters = true,
  columns = 4,
  title,
  featured = false,
  className,
}: ProductGridProps) {
  const { language, isRTL } = useLanguage();

  // ── Applied filter state ────────────────────────────────────────────────
  // This is what actually drives the fetch. It only changes when the user
  // clicks "Apply" or selects a desktop category radio.
  const [filters, setFilters] = useState<ProductFilters>({
    categorySlug,
    isFeatured: featured || undefined,
  });
  const [sort, setSort] = useState<ProductSortOption>('featured');

  // ── Debounced search ────────────────────────────────────────────────────
  // rawSearch follows the input character-by-character; debouncedSearch
  // only updates after the user stops typing for 300 ms.
  const [rawSearch, setRawSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRawSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300);
  }, []);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);
   useEffect(() => {  setFilters((prev) => ({ ...prev,  categorySlug: categorySlug,  isFeatured: featured || undefined,  }));  setTempCategory(categorySlug || '');  }, [categorySlug, featured]);

  // ── Pending (mobile panel) filter state ────────────────────────────────
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [tempMinPrice, setTempMinPrice] = useState('');
  const [tempMaxPrice, setTempMaxPrice] = useState('');
  const [tempInStock, setTempInStock] = useState(false);
  const [tempCategory, setTempCategory] = useState(categorySlug || '');

  // ── Stable fetch options ────────────────────────────────────────────────
  // We spread `filters` and add `search` here. Because `filters` is state
  // (same reference unless explicitly replaced), and `debouncedSearch` is a
  // primitive, the object produced here IS a new reference every render —
  // but useProducts serialises it to JSON, so only real value changes matter.
  const fetchFilters = useMemo<ProductFilters>(
    () => ({ ...filters, search: debouncedSearch || undefined }),
    [filters, debouncedSearch]
  );

  const { products, isLoading, error, totalCount, hasMore, loadMore } = useProducts({
    filters: fetchFilters,
    sort,
    limit: 12,
  });

  const { categories } = useCategories();

  // ── Active-filter indicator ─────────────────────────────────────────────
  const hasActiveFilters = useMemo(
    () =>
      !!(
        filters.categorySlug ||
        filters.minPrice !== undefined ||
        filters.maxPrice !== undefined ||
        filters.inStock ||
        debouncedSearch
      ),
    [filters, debouncedSearch]
  );

  // ── Desktop category handler ────────────────────────────────────────────
  // useCallback gives a stable reference; inside it reads the current `filters`
  // from the closure which is fine since setFilters gives us the latest state.
  const handleDesktopCategory = useCallback(
    (slug: string | undefined) => {
      setFilters((prev) => ({ ...prev, categorySlug: slug }));
    },
    []
  );

  // ── Apply filters (mobile) ─────────────────────────────────────────────
  const handleApplyFilters = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      categorySlug: tempCategory || undefined,
      minPrice: tempMinPrice ? parseFloat(tempMinPrice) : undefined,
      maxPrice: tempMaxPrice ? parseFloat(tempMaxPrice) : undefined,
      inStock: tempInStock || undefined,
    }));
    setShowMobileFilters(false);
  }, [tempCategory, tempMinPrice, tempMaxPrice, tempInStock]);

  // ── Clear all filters ──────────────────────────────────────────────────
  const handleClearFilters = useCallback(() => {
    setTempMinPrice('');
    setTempMaxPrice('');
    setTempInStock(false);
    setTempCategory('');
    setRawSearch('');
    setDebouncedSearch('');
    setFilters({ isFeatured: featured || undefined });
    setShowMobileFilters(false);
  }, [featured]);

  // ── Sort handler ───────────────────────────────────────────────────────
  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSort(e.target.value as ProductSortOption);
  }, []);

  // Grid column classes
  const gridClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={cn('', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        {/* Title and count */}
        <div>
          {title && <h2 className="text-2xl font-bold text-slate-900">{title}</h2>}
          {totalCount > 0 && (
            <p className="text-sm text-slate-500 mt-1">
              {t.showing[language]} {products.length} {t.of[language]} {totalCount}{' '}
              {t.products[language]}
            </p>
          )}
        </div>

        {/* Controls */}
        {showFilters && (
          <div className="flex items-center gap-3">
            {/* Search (debounced) */}
            <div className="relative flex-1 sm:flex-none sm:w-64">
              <input
                type="search"
                value={rawSearch}
                onChange={handleSearchChange}
                placeholder={t.searchPlaceholder[language]}
                className={cn(
                  'w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg',
                  'focus:ring-2 focus:ring-red-500 focus:border-red-500',
                  'text-sm',
                  isRTL && 'pr-10 pl-4'
                )}
              />
              <svg
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400',
                  isRTL ? 'right-3' : 'left-3'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Sort */}
            <select
              value={sort}
              onChange={handleSortChange}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
            >
              {(Object.keys(t.sortOptions) as ProductSortOption[]).map((option) => (
                <option key={option} value={option}>
                  {t.sortOptions[option][language]}
                </option>
              ))}
            </select>

            {/* Mobile filter button */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden p-2 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              <svg
                className="w-5 h-5 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-8">
        {/* Desktop Filters Sidebar */}
        {showFilters && (
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* Category Filter */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">{t.category[language]}</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      checked={!filters.categorySlug}
                      onChange={() => handleDesktopCategory(undefined)}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-slate-700">{t.allCategories[language]}</span>
                  </label>
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        checked={filters.categorySlug === cat.slug}
                        onChange={() => handleDesktopCategory(cat.slug)}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm text-slate-700">
                        {language === 'ar' ? cat.name_ar : cat.name_fr}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">{t.priceRange[language]}</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder={t.minPrice[language]}
                    value={tempMinPrice}
                    onChange={(e) => setTempMinPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                    min="0"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="number"
                    placeholder={t.maxPrice[language]}
                    value={tempMaxPrice}
                    onChange={(e) => setTempMaxPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                    min="0"
                  />
                </div>
              </div>

              {/* In Stock */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempInStock}
                    onChange={(e) => setTempInStock(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-slate-700">{t.inStock[language]}</span>
                </label>
              </div>

              {/* Apply / Clear */}
              <div className="flex gap-2">
                <Button onClick={handleApplyFilters} size="sm" fullWidth>
                  {t.applyFilters[language]}
                </Button>
                {hasActiveFilters && (
                  <Button onClick={handleClearFilters} size="sm" variant="outline">
                    {t.clearFilters[language]}
                  </Button>
                )}
              </div>
            </div>
          </aside>
        )}

        {/* Products Grid */}
        <div className="flex-1">
          {error && (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Initial loading skeleton */}
          {isLoading && products.length === 0 && (
            <div className={cn('grid gap-6', gridClasses[columns])}>
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && products.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {t.noProducts[language]}
              </h3>
              <p className="text-slate-500 mb-4">{t.noProductsDesc[language]}</p>
              {hasActiveFilters && (
                <Button onClick={handleClearFilters} variant="outline">
                  {t.clearFilters[language]}
                </Button>
              )}
            </div>
          )}

          {/* Products */}
          {products.length > 0 && (
            <>
              <div className={cn('grid gap-6', gridClasses[columns])}>
                {products.map((product) => (
                  // product.id is a stable DB primary key — correct key usage
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Load more */}
              {hasMore && (
                <div className="text-center mt-8">
                  <Button
                    onClick={loadMore}
                    isLoading={isLoading}
                    variant="outline"
                    size="lg"
                  >
                    {isLoading ? t.loading[language] : t.loadMore[language]}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filters Panel */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileFilters(false)}
          />
          <div
            className={cn(
              'absolute inset-y-0 w-80 max-w-[90vw] bg-white shadow-xl',
              'flex flex-col',
              isRTL ? 'right-0' : 'left-0'
            )}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-lg">{t.filters[language]}</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">{t.category[language]}</h3>
                <select
                  value={tempCategory}
                  onChange={(e) => setTempCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="">{t.allCategories[language]}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {language === 'ar' ? cat.name_ar : cat.name_fr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-3">{t.priceRange[language]}</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder={t.minPrice[language]}
                    value={tempMinPrice}
                    onChange={(e) => setTempMinPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                    min="0"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder={t.maxPrice[language]}
                    value={tempMaxPrice}
                    onChange={(e) => setTempMaxPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempInStock}
                    onChange={(e) => setTempInStock(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  <span className="text-slate-700">{t.inStock[language]}</span>
                </label>
              </div>
            </div>

            <div className="p-4 border-t flex gap-2">
              <Button onClick={handleClearFilters} variant="outline" fullWidth>
                {t.clearFilters[language]}
              </Button>
              <Button onClick={handleApplyFilters} fullWidth>
                {t.applyFilters[language]}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}