/**
 * Main App Component
 * Ghalinino — Tunisia E-commerce SPA
 *
 * CHANGES IN THIS VERSION
 * ────────────────────────
 * LAZY LOADING
 *   Every page except the two that must be available instantly on first paint
 *   (HomePage, AuthCallbackPage) is now code-split with React.lazy + Suspense.
 *   This moves them out of the initial bundle so the app loads significantly
 *   faster, especially on mobile.
 *
 *   Split strategy:
 *     • Critical / always-visible routes (HomePage, AuthCallbackPage) — eager
 *     • High-traffic customer routes (Products, ProductDetail, Checkout,
 *       Login, Register, Order pages) — lazy, shared "customer" chunk group
 *     • Admin routes — lazy, separate "admin" chunk group so their code is
 *       never downloaded unless the user navigates to /admin
 *
 * PAGE LOADER
 *   A lightweight full-screen spinner (PageLoader) is shown by every Suspense
 *   boundary while a chunk is being fetched. It respects RTL/font settings via
 *   the Zustand language store so there is no layout flash.
 *
 * IMPORT CLEAN-UP
 *   • Removed barrel import from @/pages — every page is now imported
 *     individually through lazy() so tree-shaking and chunk-splitting work
 *     correctly. Barrel re-exports prevent Vite from creating separate chunks.
 *   • Removed unused named imports from react-router-dom (no change to runtime).
 *
 * HOMEPAGE
 *   Unchanged in content. The component is kept in this file because it is the
 *   root route and is rendered on the very first paint — there is no benefit
 *   to splitting it.
 *
 * APP WRAPPER
 *   • Single top-level Suspense wraps AppRoutes so the spinner is shown during
 *     any lazy-chunk fetch regardless of which route triggered it.
 *   • CartDrawer and ToastNotifications remain outside Suspense so they are
 *     always mounted and never replaced by the fallback.
 */

import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { ProtectedRoute } from '@/components/auth';
import { CartDrawer, CartBadge } from '@/components/cart';
import { LanguageToggle, Button } from '@/components/common';
import { ToastNotifications } from '@/components/common/ToastNotifications';
import { useLanguage } from '@/hooks';
import { useStore } from '@/store';
import { cn, formatPrice, GOVERNORATES, getShippingPrice } from '@/lib/utils';

// ============================================================================
// PAGE LOADER — shown by every Suspense boundary
// ============================================================================

function PageLoader() {
  const { isRTL } = useLanguage();

  return (
    <div
      className={cn(
        'min-h-screen flex flex-col items-center justify-center',
        'bg-gradient-to-br from-slate-50 via-white to-red-50',
        isRTL ? 'font-[Cairo]' : 'font-[Inter]'
      )}
      aria-label="Loading page…"
      role="status"
    >
      {/* Brand mark so the loader feels on-brand, not blank */}
      <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200 mb-6">
        <span className="text-white font-bold text-2xl">غ</span>
      </div>

      {/* Spinner */}
      <svg
        className="w-8 h-8 animate-spin text-red-500"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-20"
          cx="12" cy="12" r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-80"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    </div>
  );
}

// ============================================================================
// LAZY PAGE IMPORTS
// ============================================================================
// Rule: one lazy() per file so Vite creates a separate chunk per page.
// Named exports must be re-mapped to a default via the .then() transform
// because React.lazy requires a module whose default export is a component.
// ============================================================================

// ── Customer pages ────────────────────────────────────────────────────────────

const LoginPage = lazy(() =>
  import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('@/pages/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);
const WholesaleRegisterPage = lazy(() =>
  import('@/pages/WholesaleRegisterPage').then((m) => ({ default: m.WholesaleRegisterPage }))
);
// AuthCallbackPage is kept eager — it handles the OAuth redirect and must be
// available immediately, before any async chunk can load.
import { AuthCallbackPage } from '@/pages/AuthCallbackPage';

const ProductsPage = lazy(() =>
  import('@/pages/ProductsPage').then((m) => ({ default: m.ProductsPage }))
);
const ProductDetailPage = lazy(() =>
  import('@/pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage }))
);
const CheckoutPage = lazy(() =>
  import('@/pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage }))
);
const OrderSuccessPage = lazy(() =>
  import('@/pages/OrderSuccessPage').then((m) => ({ default: m.OrderSuccessPage }))
);
const OrderFailedPage = lazy(() =>
  import('@/pages/OrderFailed').then((m) => ({ default: m.OrderFailedPage }))
);
const BankTransferInstructionsPage = lazy(() =>
  import('@/pages/BankTransferInstructions').then((m) => ({ default: m.BankTransferInstructionsPage }))
);
const OrderHistoryPage = lazy(() =>
  import('@/pages/account/OrderHistory').then((m) => ({ default: m.OrderHistoryPage }))
);
const OrderDetailPage = lazy(() =>
  import('@/pages/account/OrderDetail').then((m) => ({ default: m.OrderDetailPage }))
);

// ── Admin pages ───────────────────────────────────────────────────────────────
// All admin code lives in a separate chunk group. None of it ships to regular
// users unless they visit /admin.

const AdminLogin = lazy(() =>
  import('@/pages/admin/Login').then((m) => ({ default: m.AdminLogin }))
);
const AdminLayout = lazy(() =>
  import('@/components/admin/AdminLayout').then((m) => ({ default: m.AdminLayout }))
);
const AdminDashboard = lazy(() =>
  import('@/pages/admin/Dashboard').then((m) => ({ default: m.AdminDashboard }))
);
const AdminOrders = lazy(() =>
  import('@/pages/admin/Orders').then((m) => ({ default: m.AdminOrders }))
);
const AdminOrderDetail = lazy(() =>
  import('@/pages/admin/OrderDetail').then((m) => ({ default: m.AdminOrderDetail }))
);
const AdminProducts = lazy(() =>
  import('@/pages/admin/Products').then((m) => ({ default: m.AdminProducts }))
);
const AdminProductForm = lazy(() =>
  import('@/pages/admin/ProductForm').then((m) => ({ default: m.AdminProductForm }))
);
const AdminCustomers = lazy(() =>
  import('@/pages/admin/Customers').then((m) => ({ default: m.AdminCustomers }))
);
const AdminCustomerDetail = lazy(() =>
  import('@/pages/admin/CustomerDetail').then((m) => ({ default: m.AdminCustomerDetail }))
);

// ============================================================================
// HOMEPAGE  (eager — first paint)
// ============================================================================

function HomePage() {
  const { language, isRTL } = useLanguage();
  const { user, isAuthenticated, isLoading, signOut, isPendingWholesale, isWholesale } =
    useAuthContext();
  const navigate = useNavigate();

  // Sync document direction whenever language changes
  useEffect(() => {
    document.documentElement.dir  = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  const t = (ar: string, fr: string) => (language === 'ar' ? ar : fr);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div
      className={cn(
        'min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50',
        'font-sans',
        isRTL ? 'font-[Cairo]' : 'font-[Inter]'
      )}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
              <span className="text-white font-bold text-lg">غ</span>
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-lg">
                {t('غالينينو', 'Ghalinino')}
              </h1>
              <p className="text-xs text-slate-500">
                {t('متجرك المفضل', 'Votre boutique préférée')}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <CartBadge />
            <LanguageToggle />

            {isLoading ? (
              <div className="w-20 h-10 bg-slate-100 rounded-lg animate-pulse" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="text-end hidden sm:block">
                  <p className="text-sm font-medium text-slate-900">
                    {user?.fullName || user?.email}
                  </p>
                  <p className="text-xs text-slate-500">
                    {isPendingWholesale && (
                      <span className="text-amber-600">
                        {t('طلب قيد المراجعة', 'Demande en cours')}
                      </span>
                    )}
                    {isWholesale && (
                      <span className="text-green-600">
                        {t('تاجر جملة', 'Grossiste')}
                      </span>
                    )}
                    {!isPendingWholesale && !isWholesale && (
                      <span>{t('عميل', 'Client')}</span>
                    )}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  {t('خروج', 'Déconnexion')}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    {t('دخول', 'Connexion')}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">
                    {t('تسجيل', 'Inscription')}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            {t("نظام المصادقة جاهز!", "Système d'authentification prêt !")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            {t('مرحباً بك في غالينينو', 'Bienvenue sur Ghalinino')}
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            {t(
              'منصة التجارة الإلكترونية المتكاملة للسوق التونسي مع دعم حسابات التجزئة والجملة',
              'Plateforme e-commerce complète pour le marché tunisien avec support comptes détail et gros'
            )}
          </p>
        </div>

        {/* Auth status card */}
        {isAuthenticated && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-12">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                {user?.fullName?.charAt(0) || user?.email?.charAt(0) || '?'}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 text-lg">
                  {t('مرحباً', 'Bonjour')}, {user?.fullName || user?.email}!
                </h3>
                <p className="text-slate-600">
                  {t('أنت مسجل الدخول بنجاح', 'Vous êtes connecté avec succès')}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {user?.email}
                  </span>
                  {user?.phone && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {user.phone}
                    </span>
                  )}
                  {isPendingWholesale && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                      {t('طلب جملة قيد المراجعة', 'Demande grossiste en cours')}
                    </span>
                  )}
                  {isWholesale && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {t('تاجر جملة معتمد', 'Grossiste approuvé')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: '🛍️',
              titleAr: 'تصفح المنتجات',
              titleFr: 'Parcourir les produits',
              descAr: 'اكتشف منتجاتنا مع الفلاتر والترتيب',
              descFr: 'Découvrez nos produits avec filtres et tri',
              link: '/products',
            },
            {
              icon: '🔐',
              titleAr: 'تسجيل دخول/تسجيل',
              titleFr: 'Connexion/Inscription',
              descAr: 'بريد إلكتروني + كلمة مرور أو رابط سحري',
              descFr: 'Email + mot de passe ou lien magique',
              link: '/login',
            },
            {
              icon: '🏢',
              titleAr: 'حساب تاجر جملة',
              titleFr: 'Compte Grossiste',
              descAr: 'تسجيل مع رفع رخصة التجارة',
              descFr: 'Inscription avec upload de patente',
              link: '/register/wholesale',
            },
          ].map((feature, i) => (
            <Link
              key={i}
              to={feature.link}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-red-200 transition-all group"
            >
              <span className="text-4xl mb-4 block">{feature.icon}</span>
              <h4 className="font-bold text-slate-900 mb-2 group-hover:text-red-600 transition-colors">
                {language === 'ar' ? feature.titleAr : feature.titleFr}
              </h4>
              <p className="text-slate-600 text-sm">
                {language === 'ar' ? feature.descAr : feature.descFr}
              </p>
            </Link>
          ))}
        </div>

        {/* Price demo */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-12">
          <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('أسعار التجزئة vs الجملة', 'Prix Détail vs Gros')}
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500 mb-1">{t('سعر التجزئة', 'Prix détail')}</p>
              <p className="text-2xl font-bold text-slate-900">{formatPrice(89.900, language)}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <p className="text-sm text-green-600 mb-1">{t('سعر الجملة', 'Prix gros')}</p>
              <p className="text-2xl font-bold text-green-700">{formatPrice(65.000, language)}</p>
              <p className="text-xs text-green-600 mt-1">-28% {t('توفير', 'économie')}</p>
            </div>
          </div>
        </div>

        {/* Shipping zones */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-12">
          <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {t('أسعار التوصيل', 'Tarifs de livraison')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {GOVERNORATES.slice(0, 8).map((gov) => (
              <div key={gov.id} className="p-3 bg-slate-50 rounded-lg">
                <p className="font-medium text-slate-900 text-sm">
                  {language === 'ar' ? gov.name.ar : gov.name.fr}
                </p>
                <p className="text-red-600 font-semibold">
                  {formatPrice(getShippingPrice(gov.id), language)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-8 border-t border-slate-200 text-center text-slate-500 text-sm">
          <p>
            {t('© 2024 غالينينو. جميع الحقوق محفوظة.', '© 2024 Ghalinino. Tous droits réservés.')}
          </p>
          <p className="mt-2">
            {t(
              'مبني بـ React + TypeScript + Tailwind CSS + Supabase',
              'Construit avec React + TypeScript + Tailwind CSS + Supabase'
            )}
          </p>
        </footer>
      </main>
    </div>
  );
}

// ============================================================================
// APP ROUTES
// ============================================================================

function AppRoutes() {
  return (
    // Single Suspense around all routes.
    // PageLoader renders while any lazy chunk is being fetched.
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* ── Public ─────────────────────────────────────────────────────── */}
        <Route path="/"                    element={<HomePage />} />
        <Route path="/login"               element={<LoginPage />} />
        <Route path="/register"            element={<RegisterPage />} />
        <Route path="/register/wholesale"  element={<WholesaleRegisterPage />} />
        {/* AuthCallbackPage is eager-imported above — no lazy wrapper needed */}
        <Route path="/auth/callback"       element={<AuthCallbackPage />} />

        {/* ── Products ───────────────────────────────────────────────────── */}
        <Route path="/products"                   element={<ProductsPage />} />
        <Route path="/products/:categorySlug"     element={<ProductsPage />} />
        <Route path="/product/:slug"              element={<ProductDetailPage />} />

        {/* ── Checkout & Orders ──────────────────────────────────────────── */}
        <Route path="/checkout"                          element={<CheckoutPage />} />
        <Route path="/order-success/:orderId"            element={<OrderSuccessPage />} />
        <Route path="/order-failed/:orderId"             element={<OrderFailedPage />} />
        <Route path="/order-bank-transfer/:orderNumber"  element={<BankTransferInstructionsPage />} />

        {/* ── Protected customer routes ───────────────────────────────────── */}
        <Route
          path="/account/orders"
          element={
            <ProtectedRoute>
              <OrderHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
          }
        />

        {/* ── Admin ──────────────────────────────────────────────────────── */}
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index                    element={<AdminDashboard />} />
          <Route path="orders"            element={<AdminOrders />} />
          <Route path="orders/:id"        element={<AdminOrderDetail />} />
          <Route path="products"          element={<AdminProducts />} />
          <Route path="products/new"      element={<AdminProductForm />} />
          <Route path="products/:id/edit" element={<AdminProductForm />} />
          <Route path="customers"         element={<AdminCustomers />} />
          <Route path="customers/:id"     element={<AdminCustomerDetail />} />
        </Route>

        {/* ── 404 ────────────────────────────────────────────────────────── */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-red-50">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-4xl font-bold text-red-600">404</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Page introuvable</h1>
                <p className="text-slate-500 mb-6">
                  La page que vous cherchez n'existe pas.
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Retour à l'accueil
                </Link>
              </div>
            </div>
          }
        />
      </Routes>
    </Suspense>
  );
}

// ============================================================================
// MAIN APP
// ============================================================================

export function App() {
  const { language } = useStore();

  // Keep document direction in sync with the stored language preference.
  // This effect runs on the root component so it fires before any page renders.
  useEffect(() => {
    document.documentElement.dir  = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          {/*
           * AppRoutes is wrapped in Suspense (inside the component itself).
           * CartDrawer and ToastNotifications are intentionally outside —
           * they must never be replaced by the PageLoader fallback.
           */}
          <AppRoutes />
          <CartDrawer />
          <ToastNotifications />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}