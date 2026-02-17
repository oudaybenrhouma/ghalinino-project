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

import { lazy, Suspense, useEffect, useState, useRef } from 'react';
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
import { useProducts, useCategories } from '@/hooks/useProducts';
import { ProductCard, ProductCardSkeleton } from '@/components/products/ProductCard';

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

// ── Animated counter hook ─────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1200, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf: number;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return count;
}

function HomePage() {
  const { language, isRTL } = useLanguage();
  const { user, isAuthenticated, isLoading, signOut, isPendingWholesale, isWholesale } =
    useAuthContext();
  const navigate = useNavigate();

  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  const { products: featuredProducts, isLoading: productsLoading } = useProducts({
    filters: { isFeatured: true },
    sort: 'featured',
    limit: 4,
  });
  const { categories } = useCategories();

  // Intersection observer for stats counter animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const statOrders = useCountUp(12400, 1400, statsVisible);
  const statGovernates = useCountUp(24, 900, statsVisible);
  const statSavings = useCountUp(28, 800, statsVisible);

  useEffect(() => {
    document.documentElement.dir  = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  const t = (ar: string, fr: string) => (language === 'ar' ? ar : fr);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const shippingZones = [
    { labelAr: 'تونس الكبرى', labelFr: 'Grand Tunis', price: 5, color: 'bg-red-50 border-red-200 text-red-700' },
    { labelAr: 'الشمال', labelFr: 'Nord', price: 7, color: 'bg-orange-50 border-orange-200 text-orange-700' },
    { labelAr: 'الوسط', labelFr: 'Centre', price: 8, color: 'bg-amber-50 border-amber-200 text-amber-700' },
    { labelAr: 'الجنوب', labelFr: 'Sud', price: 10, color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  ];

  const trustFeatures = [
    {
      iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      titleAr: 'دفع آمن ومضمون',
      titleFr: 'Paiement sécurisé',
      descAr: 'فلوسي، تحويل بنكي، أو الدفع عند الاستلام',
      descFr: 'Flouci, virement bancaire ou paiement à la livraison',
    },
    {
      iconPath: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
      titleAr: 'إرجاع مجاني',
      titleFr: 'Retour gratuit',
      descAr: '7 أيام لإعادة أي منتج بدون قيد أو شرط',
      descFr: '7 jours pour retourner tout produit sans condition',
    },
    {
      iconPath: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
      titleAr: 'أسعار الجملة',
      titleFr: 'Prix grossiste',
      descAr: 'وفر حتى 30% مع حساب التاجر بالجملة',
      descFr: 'Économisez jusqu\'à 30% avec un compte grossiste',
    },
    {
      iconPath: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
      titleAr: 'توصيل لكل تونس',
      titleFr: 'Livraison partout en Tunisie',
      descAr: 'نوصل لجميع الولايات الـ 24 خلال 48 ساعة',
      descFr: 'Livraison dans les 24 wilayas en 48h',
    },
  ];

  return (
    <div
      className={cn(
        'min-h-screen bg-white',
        isRTL ? 'font-[Cairo]' : 'font-[Inter]'
      )}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b border-slate-100"
        style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Top utility bar */}
          <div className="hidden md:flex items-center justify-between py-1.5 text-xs text-slate-500 border-b border-slate-100">
            <span>{t('شحن مجاني للطلبات فوق 200 د.ت للجملة', 'Livraison gratuite dès 200 TND pour grossistes')}</span>
            <div className="flex items-center gap-4">
              <Link to="/account/orders" className="hover:text-red-600 transition-colors">
                {t('طلباتي', 'Mes commandes')}
              </Link>
              <span className="text-slate-300">|</span>
              {isAuthenticated ? (
                <button onClick={handleSignOut} className="hover:text-red-600 transition-colors">
                  {t('خروج', 'Déconnexion')}
                </button>
              ) : (
                <Link to="/login" className="hover:text-red-600 transition-colors">
                  {t('تسجيل الدخول', 'Connexion')}
                </Link>
              )}
            </div>
          </div>

          {/* Main nav */}
          <div className="flex items-center justify-between py-3">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-11 h-11 bg-red-600 rounded-xl flex items-center justify-center shadow-md shadow-red-200 group-hover:shadow-lg group-hover:shadow-red-300 transition-all">
                  <span className="text-white font-black text-xl leading-none" style={{ fontFamily: 'Cairo, sans-serif' }}>غ</span>
                </div>
              </div>
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <div className="font-black text-slate-900 text-xl tracking-tight leading-none">
                  {t('غالينينو', 'Ghalinino')}
                </div>
                <div className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-0.5">
                  {t('متجرك في تونس', 'Tunisie E-commerce')}
                </div>
              </div>
            </Link>

            {/* Center nav links */}
            <nav className="hidden lg:flex items-center gap-8">
              <Link to="/products" className="text-sm font-medium text-slate-600 hover:text-red-600 transition-colors">
                {t('المنتجات', 'Produits')}
              </Link>
              <Link to="/products/promotions" className="text-sm font-medium text-slate-600 hover:text-red-600 transition-colors">
                {t('العروض', 'Promotions')}
              </Link>
              <Link to="/register/wholesale" className="text-sm font-medium text-slate-600 hover:text-red-600 transition-colors">
                {t('بيع بالجملة', 'Vente en gros')}
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <LanguageToggle />
              <CartBadge />

              {isLoading ? (
                <div className="w-8 h-8 bg-slate-100 rounded-lg animate-pulse" />
              ) : isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Link to="/account/orders" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{user?.fullName?.split(' ')[0] || t('حسابي', 'Mon compte')}</span>
                    {isWholesale && (
                      <span className="w-2 h-2 bg-green-500 rounded-full" />
                    )}
                    {isPendingWholesale && (
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    )}
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                      {t('دخول', 'Connexion')}
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4">
                      {t('تسجيل', 'S\'inscrire')}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* ── HERO ────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-red-600" style={{ minHeight: '520px' }}>
          {/* Geometric background pattern */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-red-500 opacity-40" />
            <div className="absolute top-10 right-1/3 w-64 h-64 rounded-full bg-red-700 opacity-30" />
            <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-red-800 opacity-25" />
            <div className="absolute bottom-10 left-1/4 w-48 h-48 rounded-full bg-red-500 opacity-20" />
            {/* Decorative Arabic pattern overlay */}
            <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
              <defs>
                <pattern id="hero-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M20 0 L40 20 L20 40 L0 20 Z" fill="none" stroke="white" strokeWidth="1"/>
                  <circle cx="20" cy="20" r="5" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="400" height="400" fill="url(#hero-pattern)"/>
            </svg>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              {/* Left: copy */}
              <div className={isRTL ? 'text-right order-1' : 'text-left'}>
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-semibold mb-5 border border-white/20">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  {t('توصيل لجميع ولايات تونس', 'Livraison dans toute la Tunisie')}
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-5">
                  {language === 'ar' ? (
                    <>تسوّق بذكاء،<br /><span className="text-red-200">وفّر أكثر</span></>
                  ) : (
                    <>Achetez malin,<br /><span className="text-red-200">économisez plus</span></>
                  )}
                </h1>

                <p className="text-red-100 text-lg mb-8 max-w-md leading-relaxed">
                  {t(
                    'أسعار الجملة متاحة للجميع. سجّل حساب تاجر واستمتع بخصومات تصل إلى 30%',
                    "Prix grossiste accessibles à tous. Créez un compte pro et profitez de remises jusqu'à 30%"
                  )}
                </p>

                <div className={cn('flex flex-wrap gap-3', isRTL ? 'justify-end' : 'justify-start')}>
                  <Link to="/products">
                    <button className="px-6 py-3 bg-white text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all shadow-lg shadow-red-900/20 text-sm">
                      {t('تسوّق الآن', 'Acheter maintenant')}
                    </button>
                  </Link>
                  <Link to="/register/wholesale">
                    <button className="px-6 py-3 bg-transparent border-2 border-white/50 text-white font-bold rounded-xl hover:bg-white/10 transition-all text-sm">
                      {t('حساب تاجر الجملة', 'Compte grossiste')}
                    </button>
                  </Link>
                </div>
              </div>

              {/* Right: stats cards */}
              <div className={cn('grid grid-cols-2 gap-4', isRTL ? 'order-0' : '')} ref={statsRef}>
                {[
                  { value: statOrders.toLocaleString(language === 'ar' ? 'ar-TN' : 'fr-TN') + '+', labelAr: 'طلب مكتمل', labelFr: 'commandes livrées' },
                  { value: statGovernates, labelAr: 'ولاية نوصل إليها', labelFr: 'wilayas couvertes' },
                  { value: statSavings + '%', labelAr: 'خصم للجملة', labelFr: 'remise grossiste' },
                  { value: '48h', labelAr: 'توصيل سريع', labelFr: 'livraison rapide' },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 text-center hover:bg-white/15 transition-colors"
                  >
                    <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                    <div className="text-red-200 text-xs font-medium">
                      {language === 'ar' ? stat.labelAr : stat.labelFr}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>


        {/* ── TRUST FEATURES ──────────────────────────────────────────────── */}
        <section className="border-b border-slate-100 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {trustFeatures.map((feat, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={feat.iconPath} />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm leading-snug">
                      {language === 'ar' ? feat.titleAr : feat.titleFr}
                    </div>
                    <div className="text-slate-500 text-xs mt-0.5 leading-snug hidden md:block">
                      {language === 'ar' ? feat.descAr : feat.descFr}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CATEGORIES ──────────────────────────────────────────────────── */}
        {categories.length > 0 && (
          <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-7">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  {t('تسوّق حسب الفئة', 'Acheter par catégorie')}
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  {t('استكشف تشكيلتنا المتنوعة', 'Explorez notre sélection variée')}
                </p>
              </div>
              <Link
                to="/products"
                className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors flex items-center gap-1"
              >
                {t('عرض الكل', 'Voir tout')}
                <svg className={cn('w-4 h-4', isRTL && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {categories.slice(0, 10).map((cat, i) => {
                const colors = [
                  'from-red-500 to-rose-600',
                  'from-orange-500 to-amber-600',
                  'from-emerald-500 to-teal-600',
                  'from-blue-500 to-indigo-600',
                  'from-purple-500 to-violet-600',
                  'from-pink-500 to-rose-500',
                  'from-cyan-500 to-blue-500',
                  'from-lime-500 to-green-600',
                  'from-amber-500 to-orange-500',
                  'from-fuchsia-500 to-purple-600',
                ];
                return (
                  <Link
                    key={cat.id}
                    to={`/products/${cat.slug}`}
                    className="group relative rounded-2xl overflow-hidden bg-gradient-to-br aspect-[4/3] flex flex-col justify-end p-4 hover:scale-[1.02] transition-transform duration-200 shadow-sm hover:shadow-md"
                    style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
                  >
                    <div className={cn('absolute inset-0 bg-gradient-to-br opacity-90', colors[i % colors.length])} />
                    <div className="relative z-10">
                      <div className="text-white font-bold text-sm leading-tight">
                        {language === 'ar' ? cat.name_ar : cat.name_fr}
                      </div>
                    </div>
                  </Link>
                );
              })}

              {/* "All products" catch-all tile */}
              <Link
                to="/products"
                className="group relative rounded-2xl overflow-hidden bg-slate-900 aspect-[4/3] flex flex-col justify-end p-4 hover:scale-[1.02] transition-transform duration-200 shadow-sm hover:shadow-md"
              >
                <div className="relative z-10">
                  <div className="text-white font-bold text-sm">{t('جميع المنتجات', 'Tous les produits')}</div>
                  <div className="text-slate-400 text-xs mt-0.5">{t('اكتشف المزيد →', 'Explorer →')}</div>
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* ── FEATURED PRODUCTS ───────────────────────────────────────────── */}
        <section className="py-12 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-7">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  {t('منتجات مميزة', 'Produits vedettes')}
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  {t('اختيارات بعناية لأفضل العروض', 'Une sélection soigneuse des meilleures offres')}
                </p>
              </div>
              <Link
                to="/products"
                className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors flex items-center gap-1"
              >
                {t('عرض الكل', 'Voir tout')}
                <svg className={cn('w-4 h-4', isRTL && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {productsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : featuredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              /* Empty state — show CTA to browse */
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-slate-500 text-sm mb-4">{t('المنتجات قادمة قريباً', 'Produits bientôt disponibles')}</p>
                <Link to="/products">
                  <button className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors">
                    {t('تصفح المنتجات', 'Parcourir les produits')}
                  </button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ── WHOLESALE PROMO BANNER ───────────────────────────────────────── */}
        {!isWholesale && (
          <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6">
            <div
              className="rounded-3xl overflow-hidden relative"
              style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)',
              }}
            >
              {/* Decorative blobs */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-600 rounded-full opacity-10 translate-x-1/3 -translate-y-1/3" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-500 rounded-full opacity-10 -translate-x-1/3 translate-y-1/3" />

              <div className="relative px-8 py-10 md:py-12 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <div className="inline-flex items-center gap-2 bg-red-600/20 text-red-400 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-red-500/30">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    {t('برنامج التجار', 'Programme grossiste')}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-white mb-3">
                    {language === 'ar' ? (
                      <>بِع بالجملة،<br />اربح أكثر</>
                    ) : (
                      <>Vendez en gros,<br />gagnez plus</>
                    )}
                  </h3>
                  <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                    {t(
                      'سجّل حسابك كتاجر وتمتع بأسعار حصرية، شحن مجاني فوق 500 د.ت، وأولوية المعالجة',
                      "Inscrivez-vous comme grossiste et profitez de prix exclusifs, livraison gratuite dès 500 TND et traitement prioritaire"
                    )}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-5">
                    <div className="flex items-center gap-2 text-slate-300 text-xs">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                      {t('خصم حتى 30%', "Jusqu'à 30% de remise")}
                    </div>
                    <div className="flex items-center gap-2 text-slate-300 text-xs">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                      {t('شحن مجاني فوق 500 د.ت', 'Livraison gratuite dès 500 TND')}
                    </div>
                    <div className="flex items-center gap-2 text-slate-300 text-xs">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                      {t('دعم متميز', 'Support prioritaire')}
                    </div>
                  </div>
                </div>

                <div className={cn('flex flex-col gap-3 flex-shrink-0', isRTL ? 'items-start' : 'items-end')}>
                  <Link to="/register/wholesale">
                    <button className="px-7 py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-900/40 text-sm whitespace-nowrap">
                      {t('سجّل كتاجر جملة', "S'inscrire comme grossiste")}
                    </button>
                  </Link>
                  {!isAuthenticated && (
                    <Link to="/login" className="text-slate-400 hover:text-white text-sm transition-colors text-center">
                      {t('لديك حساب؟ سجّل دخولك', 'Déjà inscrit ? Connectez-vous')}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── SHIPPING ZONES ───────────────────────────────────────────────── */}
        <section className="py-12 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className={cn('mb-7', isRTL ? 'text-right' : 'text-left')}>
              <h2 className="text-2xl font-black text-slate-900">
                {t('أسعار التوصيل', 'Tarifs de livraison')}
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                {t('نوصل لجميع الولايات الـ 24 خلال 24-48 ساعة', 'Livraison dans toutes les 24 wilayas sous 24-48h')}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {shippingZones.map((zone, i) => (
                <div
                  key={i}
                  className={cn(
                    'rounded-2xl border p-5 flex flex-col items-center text-center gap-2',
                    zone.color
                  )}
                >
                  <svg className="w-6 h-6 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="font-bold text-base">{language === 'ar' ? zone.labelAr : zone.labelFr}</div>
                  <div className="text-2xl font-black">{formatPrice(zone.price, language)}</div>
                </div>
              ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-slate-700 text-sm">
                <span className="font-semibold text-green-700">{t('شحن مجاني', 'Livraison gratuite')}</span>
                {' '}{t('لتجار الجملة عند الطلب فوق 500 د.ت', 'pour les grossistes dès 500 TND de commande')}
              </p>
            </div>
          </div>
        </section>

        {/* ── PAYMENT METHODS ─────────────────────────────────────────────── */}
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6">
          <div className={cn('mb-7', isRTL ? 'text-right' : 'text-left')}>
            <h2 className="text-2xl font-black text-slate-900">
              {t('طرق الدفع المتاحة', 'Moyens de paiement')}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {t('ادفع بالطريقة التي تناسبك', 'Payez selon votre préférence')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                titleAr: 'الدفع عند الاستلام',
                titleFr: 'Paiement à la livraison',
                descAr: '+2 د.ت رسوم معالجة',
                descFr: '+2 TND frais de traitement',
                accent: 'text-amber-600 bg-amber-50 border-amber-200',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                ),
                titleAr: 'تحويل بنكي',
                titleFr: 'Virement bancaire',
                descAr: 'مجاني — أمن وموثوق',
                descFr: 'Gratuit — sécurisé et fiable',
                accent: 'text-blue-600 bg-blue-50 border-blue-200',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                ),
                titleAr: 'فلوسي (دفع إلكتروني)',
                titleFr: 'Flouci (paiement en ligne)',
                descAr: 'بطاقة بنكية أو E-Dinar',
                descFr: 'Carte bancaire ou E-Dinar',
                accent: 'text-green-600 bg-green-50 border-green-200',
              },
            ].map((method, i) => (
              <div
                key={i}
                className={cn('rounded-2xl border p-6 flex items-start gap-4', method.accent)}
              >
                <div className="flex-shrink-0">{method.icon}</div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    {language === 'ar' ? method.titleAr : method.titleFr}
                  </div>
                  <div className="text-slate-500 text-xs mt-1">
                    {language === 'ar' ? method.descAr : method.descFr}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Brand column */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-black text-lg" style={{ fontFamily: 'Cairo' }}>غ</span>
                </div>
                <div>
                  <div className="font-black text-white text-lg">{t('غالينينو', 'Ghalinino')}</div>
                  <div className="text-slate-400 text-xs">{t('متجرك في تونس', 'Votre boutique en Tunisie')}</div>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                {t(
                  'منصة التجارة الإلكترونية الأولى في تونس للتجزئة والجملة. نوصل لجميع الولايات بسرعة وأمان.',
                  'La première plateforme e-commerce en Tunisie pour le détail et le gros. Livraison rapide et sécurisée dans toutes les wilayas.'
                )}
              </p>
            </div>

            {/* Links */}
            <div>
              <div className="font-bold text-sm text-slate-300 mb-4 uppercase tracking-wider">
                {t('المتجر', 'Boutique')}
              </div>
              <ul className="space-y-2.5">
                {[
                  { to: '/products', ar: 'جميع المنتجات', fr: 'Tous les produits' },
                  { to: '/products/promotions', ar: 'العروض والتخفيضات', fr: 'Promotions' },
                  { to: '/register/wholesale', ar: 'حساب تاجر الجملة', fr: 'Espace grossiste' },
                ].map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-slate-400 hover:text-white text-sm transition-colors"
                    >
                      {language === 'ar' ? link.ar : link.fr}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="font-bold text-sm text-slate-300 mb-4 uppercase tracking-wider">
                {t('حسابي', 'Mon compte')}
              </div>
              <ul className="space-y-2.5">
                {[
                  { to: '/login', ar: 'تسجيل الدخول', fr: 'Connexion' },
                  { to: '/register', ar: 'إنشاء حساب', fr: 'Créer un compte' },
                  { to: '/account/orders', ar: 'طلباتي', fr: 'Mes commandes' },
                ].map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-slate-400 hover:text-white text-sm transition-colors"
                    >
                      {language === 'ar' ? link.ar : link.fr}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} {t('غالينينو. جميع الحقوق محفوظة.', 'Ghalinino. Tous droits réservés.')}</p>
            <p>{t('صُنع بـ ❤️ في تونس', 'Fait avec ❤️ en Tunisie')}</p>
          </div>
        </div>
      </footer>
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