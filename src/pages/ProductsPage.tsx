/**
 * Products Listing Page - MODERNIZED & FIXED
 * Ghalinino - Tunisia E-commerce
 *
 * IMPROVEMENTS:
 * - Enhanced visual hierarchy with better spacing
 * - Better breadcrumb navigation
 * - Removed redundant category pills (already in ProductGrid sidebar)
 * - Improved loading states
 * - Better responsive design
 */

import { useParams, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks';
import { useCategories } from '@/hooks/useProducts';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductLayout } from '@/components/layout';

// ============================================================================
// TRANSLATIONS
// ============================================================================

const t = {
  title: { ar: 'جميع المنتجات', fr: 'Tous les produits' },
  home: { ar: 'الرئيسية', fr: 'Accueil' },
  products: { ar: 'المنتجات', fr: 'Produits' },
  description: { 
    ar: 'تصفح مجموعتنا الواسعة من المنتجات عالية الجودة', 
    fr: 'Parcourez notre large gamme de produits de haute qualité' 
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductsPage() {
  const { language, isRTL } = useLanguage();
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const { categories } = useCategories();

  const currentCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : null;

  const pageTitle = currentCategory
    ? language === 'ar'
      ? currentCategory.name_ar
      : currentCategory.name_fr
    : t.title[language];

  const pageDescription = currentCategory
    ? (language === 'ar' ? currentCategory.description_ar : currentCategory.description_fr) || t.description[language]
    : t.description[language];

  return (
    <div
      className={cn(
        'min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50',
        isRTL ? 'font-[Cairo]' : 'font-[Instrument_Sans]'
      )}
    >
      <ProductLayout>
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-8">
            <Link 
              to="/" 
              className="text-slate-500 hover:text-red-600 transition-colors font-medium"
            >
              {t.home[language]}
            </Link>
            <svg 
              className={cn("w-4 h-4 text-slate-400", isRTL && "rotate-180")} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <Link 
              to="/products" 
              className={cn(
                "transition-colors font-medium",
                currentCategory 
                  ? "text-slate-500 hover:text-red-600" 
                  : "text-slate-900"
              )}
            >
              {t.products[language]}
            </Link>
            {currentCategory && (
              <>
                <svg 
                  className={cn("w-4 h-4 text-slate-400", isRTL && "rotate-180")} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <span className="text-slate-900 font-semibold">
                  {language === 'ar' ? currentCategory.name_ar : currentCategory.name_fr}
                </span>
              </>
            )}
          </nav>

          {/* Page Header with modern styling */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              {pageTitle}
            </h1>
            <div className="h-1 w-20 bg-gradient-to-r from-red-600 to-red-400 rounded-full mb-4" />
            {pageDescription && (
              <p className="text-slate-600 text-lg max-w-3xl">
                {pageDescription}
              </p>
            )}
          </div>

          {/* Product Grid - Includes category filters in sidebar */}
          <ProductGrid
            categorySlug={categorySlug}
            showFilters={true}
            columns={4}
          />
        </main>
      </ProductLayout>

      {/* Modern Footer */}
      <footer className="bg-white border-t border-slate-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
                <span className="text-white font-bold text-lg">غ</span>
              </div>
              <span className="text-xl font-bold text-slate-900">
                {language === 'ar' ? 'غالينينو' : 'Ghalinino'}
              </span>
            </div>
            <p className="text-slate-500 text-sm">
              {language === 'ar'
                ? '© 2024 غالينينو. جميع الحقوق محفوظة.'
                : '© 2024 Ghalinino. Tous droits réservés.'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}