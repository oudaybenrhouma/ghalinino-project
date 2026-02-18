/**
 * Customer Layout Component
 * Ghalinino - Tunisia E-commerce
 * 
 * PURPOSE:
 * ========
 * Provides consistent header/navigation across all customer-facing pages.
 * Ensures CartBadge is accessible everywhere, preventing the issue where
 * users couldn't access their cart from checkout or account pages.
 * 
 * USAGE:
 * ======
 * Wrap any customer page with this layout:
 * 
 * <CustomerLayout showCart={true}>
 *   <YourPageContent />
 * </CustomerLayout>
 */

import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks';
import { useAuthContext } from '@/contexts/AuthContext';
import { CartBadge } from '@/components/cart';
import { LanguageToggle, Button } from '@/components/common';

// ============================================================================
// TYPES
// ============================================================================

interface CustomerLayoutProps {
  children: ReactNode;
  /** Show cart badge in header (default: true) */
  showCart?: boolean;
  /** Show auth buttons (login/register) if not authenticated */
  showAuth?: boolean;
  /** Custom header className */
  headerClassName?: string;
  /** Custom container className */
  containerClassName?: string;
  /** Max width for content container */
  maxWidth?: '6xl' | '7xl' | 'full';
}

// ============================================================================
// TRANSLATIONS
// ============================================================================

const t = {
  home: { ar: 'الرئيسية', fr: 'Accueil' },
  products: { ar: 'المنتجات', fr: 'Produits' },
  orders: { ar: 'طلباتي', fr: 'Mes commandes' },
  login: { ar: 'دخول', fr: 'Connexion' },
  register: { ar: 'تسجيل', fr: 'Inscription' },
  logout: { ar: 'خروج', fr: 'Déconnexion' },
  welcome: { ar: 'مرحباً', fr: 'Bonjour' },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function CustomerLayout({
  children,
  showCart = true,
  showAuth = true,
  headerClassName,
  containerClassName,
  maxWidth = '7xl',
}: CustomerLayoutProps) {
  const { language, isRTL } = useLanguage();
  const location = useLocation();
  const { user, isAuthenticated, isLoading, isAdmin, signOut } = useAuthContext();

  const maxWidthClass = {
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-full',
  }[maxWidth];

  // Check if current page is active
  const isActivePage = (path: string) => location.pathname === path;

  return (
    <div
      className={cn(
        'min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50',
        isRTL ? 'font-[Cairo]' : 'font-[Inter]'
      )}
    >
      {/* Header */}
      <header
        className={cn(
          'bg-white border-b border-slate-200 sticky top-0 z-40',
          'backdrop-blur-sm bg-white/95',
          headerClassName
        )}
      >
        <div className={cn(maxWidthClass, 'mx-auto px-4 py-4')}>
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-200 group-hover:shadow-red-300 transition-shadow">
                <span className="text-white font-bold text-lg">غ</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-slate-900 text-lg group-hover:text-red-600 transition-colors">
                  {language === 'ar' ? 'غالينينو' : 'Ghalinino'}
                </h1>
                <p className="text-xs text-slate-500">
                  {language === 'ar' ? 'متجرك المفضل' : 'Votre boutique préférée'}
                </p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-4">
              {/* Products Link */}
              <Link
                to="/products"
                className={cn(
                  'text-sm font-medium transition-colors',
                  'hover:text-red-600',
                  isActivePage('/products')
                    ? 'text-red-600'
                    : 'text-slate-600'
                )}
              >
                {t.products[language]}
              </Link>

              {/* Orders Link (if authenticated) */}
              {isAuthenticated && (
                <Link
                  to="/account/orders"
                  className={cn(
                    'text-sm font-medium transition-colors',
                    'hover:text-red-600',
                    isActivePage('/account/orders')
                      ? 'text-red-600'
                      : 'text-slate-600'
                  )}
                >
                  {t.orders[language]}
                </Link>
              )}

              {/* Cart Badge */}
              {showCart && <CartBadge />}

              {/* Language Toggle */}
              <LanguageToggle />

              {/* Auth Section */}
              {showAuth && (
                <>
                  {isLoading ? (
                    <div className="w-20 h-10 bg-slate-100 rounded-lg animate-pulse" />
                  ) : isAuthenticated && user ? (
                    <div className="flex items-center gap-3">
                      {/* User Info (desktop only) */}
                      <div className="hidden md:block text-end">
                        <p className="text-sm font-medium text-slate-900">
                          {user.fullName || user.email}
                        </p>
                      </div>

                      {/* Admin Panel link */}
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Admin
                        </Link>
                      )}
                      
                      {/* Logout Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => signOut()}
                      >
                        {t.logout[language]}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Link to="/login">
                        <Button variant="ghost" size="sm">
                          {t.login[language]}
                        </Button>
                      </Link>
                      <Link to="/register">
                        <Button size="sm">
                          {t.register[language]}
                        </Button>
                      </Link>
                    </div>
                  )}
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(containerClassName)}>
        {children}
      </main>

      {/* Footer (optional - can be added later) */}
      {/* <footer className="border-t border-slate-200 bg-white mt-16">
        <div className={cn(maxWidthClass, 'mx-auto px-4 py-8')}>
          <p className="text-center text-slate-500 text-sm">
            {language === 'ar' 
              ? '© 2024 غالينينو. جميع الحقوق محفوظة.'
              : '© 2024 Ghalinino. Tous droits réservés.'}
          </p>
        </div>
      </footer> */}
    </div>
  );
}

// ============================================================================
// SPECIALIZED LAYOUTS
// ============================================================================

/**
 * Layout for checkout page - hides cart badge to avoid confusion
 */
export function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <CustomerLayout showCart={false} maxWidth="6xl">
      {children}
    </CustomerLayout>
  );
}

/**
 * Layout for account pages - includes all navigation
 */
export function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <CustomerLayout maxWidth="7xl">
      {children}
    </CustomerLayout>
  );
}

/**
 * Layout for product pages - full width for grid layouts
 */
export function ProductLayout({ children }: { children: ReactNode }) {
  return (
    <CustomerLayout maxWidth="7xl">
      {children}
    </CustomerLayout>
  );
}