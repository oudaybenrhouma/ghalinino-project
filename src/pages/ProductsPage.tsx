/**
 * Products Listing Page
 * Ghalinino - Tunisia E-commerce
 *
 * CART UX FIX
 * -----------
 * Added CartBadge to the page header. The CartDrawer is already mounted at
 * the App level (above the router), so CartBadge just toggles it — no extra
 * state is needed. Users can now see their cart count and open it from any
 * page, not just the Home page.
 */

import { useParams, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks';
import { useCategories } from '@/hooks/useProducts';
import { ProductGrid } from '@/components/products/ProductGrid';
import { LanguageToggle } from '@/components/common';
import { CartBadge } from '@/components/cart';
import { ProductLayout } from '@/components/layout';

// ============================================================================
// TRANSLATIONS
// ============================================================================

const t = {
  title: { ar: 'جميع المنتجات', fr: 'Tous les produits' },
  home: { ar: 'الرئيسية', fr: 'Accueil' },
  products: { ar: 'المنتجات', fr: 'Produits' },
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

  return (
    <div
      className={cn(
        'min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50',
        isRTL ? 'font-[Cairo]' : 'font-[Inter]'
      )}
    >

<ProductLayout>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link to="/" className="hover:text-red-600 transition-colors">
            {t.home[language]}
          </Link>
          <span className="rtl:rotate-180">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </span>
          <Link to="/products" className="hover:text-red-600 transition-colors">
            {t.products[language]}
          </Link>
          {currentCategory && (
            <>
              <span className="rtl:rotate-180">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </span>
              <span className="text-slate-900 font-medium">
                {language === 'ar' ? currentCategory.name_ar : currentCategory.name_fr}
              </span>
            </>
          )}
        </nav>

        <ProductGrid
          title={pageTitle}
          categorySlug={categorySlug}
          showFilters={true}
          columns={4}
        />
      </main>
            </ProductLayout>

      {/* Footer */}
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