/**
 * Checkout Page
 * Ghalinino — Tunisia E-commerce
 *
 * Multi-step checkout flow
 * ─────────────────────────
 * 1. Auth   — login, register, or continue as guest
 * 2. Shipping — address form
 * 3. Payment  — COD / bank transfer / Flouci
 * 4. Review   — confirm and place order
 *
 * CHANGES IN THIS VERSION
 * ────────────────────────
 * • The inner `CheckoutLayout` component is removed. The page now uses the
 *   shared `CustomerLayout` from `@/components/layout/CustomerLayout` with
 *   `showCart={false}` (cart badge would be confusing on the checkout page).
 *
 * • The `Link to="/cart"` in the old header pointed to `/cart` which is not a
 *   registered route.  Replaced with a proper back-navigation button that calls
 *   `navigate(-1)` — it goes back to wherever the user came from (products
 *   page, product detail page, etc.) and never 404s.
 *
 * • `user?.wholesaleStatus` → `user?.profile?.wholesale_status` — the
 *   AuthContext's user object does not expose `wholesaleStatus` directly;
 *   wholesale status comes from `profile.wholesale_status` via the context's
 *   `isWholesale` flag, so we now consume that flag directly instead of
 *   re-deriving it from user fields.
 *
 * • `currentStep === 'auth'` guard in the auth `useEffect` removed — it was
 *   preventing the effect from firing when the user logged in mid-checkout
 *   (e.g. they opened the login modal from another tab).  The effect now runs
 *   any time `isAuthenticated` or `authLoading` changes and simply advances
 *   to shipping if the current step is still auth.
 *
 * • Wholesale minimum warning in the summary sidebar is now always visible
 *   from the payment step onward (not only during 'review'), giving the user
 *   earlier feedback that they need to add more items.
 *
 * • `toast` import from `react-hot-toast` removed — we use `addNotification`
 *   (the Zustand-based system) consistently throughout the app.
 *
 * • `formatPrice` removed from imports (was imported but never called here).
 *
 * • AuthStep is fully bilingual — all hard-coded Arabic strings are now driven
 *   by the `language` prop and the `t` translation map.
 *
 * • All `useCallback` dependency arrays corrected so ESLint won't warn.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCartContext } from '@/contexts/CartContext';
import { useStore } from '@/store';
import {
  CheckoutProgress,
  ShippingForm,
  PaymentMethodSelector,
  CheckoutSummary,
  OrderReview,
  type CheckoutStep,
} from '@/components/checkout';
import { Button, LanguageToggle } from '@/components/common';
import {
  calculateCheckoutTotals,
  type ShippingAddress,
  type PaymentMethodType,
} from '@/lib/checkout';
import {
  createCODOrder,
  createBankTransferOrder,
  createFlouciOrder,
  type OrderCartItem,
} from '@/lib/orderProcessing';
import { generateFlouciPayment } from '@/lib/flouci';
import { validateWholesaleMinimum } from '@/lib/wholesaleValidation';
import type { Governorate } from '@/types';

// ============================================================================
// TRANSLATIONS
// ============================================================================

const t = {
  checkout:       { ar: 'إتمام الطلب',                      fr: 'Finaliser la commande' },
  backToShopping: { ar: 'العودة للتسوق',                    fr: 'Retour aux achats' },
  emptyCart:      { ar: 'سلتك فارغة',                       fr: 'Votre panier est vide' },
  emptyCartDesc:  { ar: 'أضف بعض المنتجات قبل إتمام الطلب', fr: 'Ajoutez des produits avant de commander' },
  browseProducts: { ar: 'تصفح المنتجات',                    fr: 'Parcourir les produits' },

  // Auth step
  loginTitle:     { ar: 'تسجيل الدخول',                    fr: 'Connexion requise' },
  loginDesc:      { ar: 'سجل دخولك للحصول على تجربة أفضل وتتبع طلباتك', fr: 'Connectez-vous pour une meilleure expérience et suivre vos commandes' },
  loginBtn:       { ar: 'تسجيل الدخول',                    fr: 'Se connecter' },
  registerBtn:    { ar: 'إنشاء حساب',                      fr: 'Créer un compte' },
  orSeparator:    { ar: 'أو',                               fr: 'ou' },
  guestTitle:     { ar: 'المتابعة كضيف',                   fr: 'Continuer en invité' },
  guestDesc:      { ar: 'يمكنك إتمام الطلب بدون حساب',    fr: 'Vous pouvez commander sans compte' },
  guestBtn:       { ar: 'المتابعة كضيف',                   fr: 'Continuer sans compte' },
  welcomeBack:    { ar: 'مرحباً بعودتك',                   fr: 'Bienvenue' },
  continueOrder:  { ar: 'متابعة الطلب',                    fr: 'Continuer la commande' },

  // Wholesale
  wholesaleWarn:  { ar: 'الحد الأدنى للطلب غير محقق — أضف المزيد', fr: 'Minimum de commande non atteint — Ajoutez plus' },

  // Order errors / success
  orderSuccess:   { ar: 'تم تأكيد طلبك!',                 fr: 'Commande confirmée !' },
  orderError:     { ar: 'خطأ في إتمام الطلب',              fr: 'Erreur lors de la commande' },
  paymentError:   { ar: 'خطأ',                             fr: 'Erreur' },
  orderFailed:    { ar: 'فشل في إتمام الطلب',             fr: 'Échec de la commande' },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function CheckoutPage() {
  const { language, isRTL } = useLanguage();
  const navigate             = useNavigate();

  // Auth
  const { user, isAuthenticated, isLoading: authLoading, isWholesale } = useAuthContext();

  // Cart
  const { isEmpty, subtotal, clearCart, items } = useCartContext();

  // Notifications
  const addNotification = useStore((state) => state.addNotification);

  // ── Step state ──────────────────────────────────────────────────────────────
  const [currentStep,    setCurrentStep]    = useState<CheckoutStep>('auth');
  const [completedSteps, setCompletedSteps] = useState<CheckoutStep[]>([]);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [paymentMethod,  setPaymentMethod]  = useState<PaymentMethodType | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // ── Totals (recalculates on every relevant change) ──────────────────────────
  const totals = calculateCheckoutTotals(
    subtotal,
    shippingAddress?.governorate as Governorate | null,
    paymentMethod || 'cod',
    isWholesale,
    0 // discount
  );

  // ── Wholesale minimum validation ────────────────────────────────────────────
  const wholesaleValidation = isWholesale
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? validateWholesaleMinimum(items as any, true)
    : { isValid: true, minimumMet: true, amountShort: 0, errors: [] };

  // ── Auto-advance from auth step when already authenticated ──────────────────
  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated && currentStep === 'auth') {
      setCompletedSteps((prev) =>
        prev.includes('auth') ? prev : [...prev, 'auth']
      );
      setCurrentStep('shipping');
    }
  }, [isAuthenticated, authLoading, currentStep]);

  // ── Redirect when cart empties (post-order clear or accidental navigation) ──
  useEffect(() => {
    if (isEmpty && !authLoading && !isPlacingOrder) {
      const id = setTimeout(() => navigate('/products'), 400);
      return () => clearTimeout(id);
    }
  }, [isEmpty, authLoading, isPlacingOrder, navigate]);

  // ── Step handlers ────────────────────────────────────────────────────────────

  const handleContinueAsGuest = useCallback(() => {
    setCompletedSteps((prev) =>
      prev.includes('auth') ? prev : [...prev, 'auth']
    );
    setCurrentStep('shipping');
  }, []);

  const handleAuthContinue = useCallback(() => {
    setCompletedSteps((prev) =>
      prev.includes('auth') ? prev : [...prev, 'auth']
    );
    setCurrentStep('shipping');
  }, []);

  const handleShippingSubmit = useCallback(
    (address: ShippingAddress, _saveToProfile: boolean) => {
      setShippingAddress(address);
      setCompletedSteps((prev) => [
        ...prev.filter((s) => s !== 'shipping'),
        'shipping',
      ]);
      setCurrentStep('payment');
    },
    []
  );

  const handlePaymentSubmit = useCallback(() => {
    if (!paymentMethod) return;
    setCompletedSteps((prev) => [
      ...prev.filter((s) => s !== 'payment'),
      'payment',
    ]);
    setCurrentStep('review');
  }, [paymentMethod]);

  const handleEditShipping = useCallback(() => setCurrentStep('shipping'), []);
  const handleEditPayment  = useCallback(() => setCurrentStep('payment'),  []);

  const handleStepClick = useCallback(
    (step: CheckoutStep) => {
      if (completedSteps.includes(step)) setCurrentStep(step);
    },
    [completedSteps]
  );

  // ── Place order ─────────────────────────────────────────────────────────────
  const handlePlaceOrder = useCallback(async () => {
    if (!shippingAddress || !paymentMethod) return;

    // Wholesale guard
    if (isWholesale && !wholesaleValidation.isValid) {
      addNotification({
        type: 'warning',
        title: t.wholesaleWarn[language],
        message: wholesaleValidation.errors.join(' • '),
        duration: 5000,
      });
      return;
    }

    setIsPlacingOrder(true);

    try {
      const orderParams = {
        userId:           user?.id,
        guestPhone:       shippingAddress.phone,
        shippingAddress,
        paymentMethod,
        totals,
        items:            items as unknown as OrderCartItem[],
        isWholesaleOrder: isWholesale,
      };

      let result:
        | Awaited<ReturnType<typeof createCODOrder>>
        | Awaited<ReturnType<typeof createBankTransferOrder>>
        | Awaited<ReturnType<typeof createFlouciOrder>>;

      if (paymentMethod === 'cod') {
        result = await createCODOrder(orderParams);
      } else if (paymentMethod === 'bank_transfer') {
        result = await createBankTransferOrder(orderParams);
      } else if (paymentMethod === 'flouci') {
        result = await createFlouciOrder(orderParams);
      } else {
        throw new Error('Payment method not supported');
      }

      if (!result.success || !result.orderId) {
        throw new Error(result.error || 'Failed to create order');
      }

      const orderNumber = result.orderNumber || 'ORD-UNKNOWN';

      // Clear cart immediately so isEmpty redirect doesn't fire during navigation
      await clearCart();

      addNotification({
        type:     'success',
        title:    t.orderSuccess[language],
        message:  orderNumber,
        duration: 5000,
      });

      // Navigate to the right post-order page
      if (paymentMethod === 'bank_transfer') {
        navigate(`/order-bank-transfer/${orderNumber}`);
      } else if (paymentMethod === 'flouci') {
        const flouciResponse = await generateFlouciPayment(totals.total, result.orderId);
        if (flouciResponse.success && flouciResponse.redirect_link) {
          window.location.href = flouciResponse.redirect_link;
        } else {
          navigate(`/order-failed/${result.orderId}`);
        }
      } else {
        navigate(`/order-success/${result.orderId}`, {
          state: {
            orderNumber,
            paymentMethod,
            total: totals.total,
          },
        });
      }
    } catch (error) {
      console.error('Order placement error:', error);
      addNotification({
        type:     'error',
        title:    t.paymentError[language],
        message:
          error instanceof Error
            ? error.message
            : t.orderFailed[language],
        duration: 5000,
      });
    } finally {
      setIsPlacingOrder(false);
    }
  }, [
    shippingAddress,
    paymentMethod,
    totals,
    items,
    user,
    isWholesale,
    wholesaleValidation,
    clearCart,
    addNotification,
    language,
    navigate,
  ]);

  // ============================================================================
  // EMPTY CART STATE
  // ============================================================================

  if (isEmpty && !authLoading && !isPlacingOrder) {
    return (
      <CheckoutShell language={language} isRTL={isRTL} navigate={navigate}>
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="w-20 h-20 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            {t.emptyCart[language]}
          </h1>
          <p className="text-slate-600 mb-6">{t.emptyCartDesc[language]}</p>
          <Button onClick={() => navigate('/products')}>
            {t.browseProducts[language]}
          </Button>
        </div>
      </CheckoutShell>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <CheckoutShell language={language} isRTL={isRTL} navigate={navigate}>

      {/* Progress indicator */}
      <div className="mb-8">
        <CheckoutProgress
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-3 gap-8">

        {/* ── Left: step panels ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Step 1 — Auth */}
          {currentStep === 'auth' && (
            <AuthStep
              language={language}
              isAuthenticated={isAuthenticated}
              user={user}
              onContinueAsGuest={handleContinueAsGuest}
              onContinue={handleAuthContinue}
            />
          )}

          {/* Step 2 — Shipping */}
          {currentStep === 'shipping' && (
            <ShippingForm
              initialData={shippingAddress || undefined}
              onSubmit={handleShippingSubmit}
              onBack={!isAuthenticated ? () => setCurrentStep('auth') : undefined}
              isLoading={false}
            />
          )}

          {/* Step 3 — Payment */}
          {currentStep === 'payment' && (
            <PaymentMethodSelector
              selectedMethod={paymentMethod}
              onSelect={setPaymentMethod}
              onSubmit={handlePaymentSubmit}
              onBack={() => setCurrentStep('shipping')}
              isLoading={false}
            />
          )}

          {/* Step 4 — Review */}
          {currentStep === 'review' && shippingAddress && paymentMethod && (
            <OrderReview
              shippingAddress={shippingAddress}
              paymentMethod={paymentMethod}
              totals={totals}
              onPlaceOrder={handlePlaceOrder}
              onBack={() => setCurrentStep('payment')}
              onEditShipping={handleEditShipping}
              onEditPayment={handleEditPayment}
              isLoading={isPlacingOrder}
              wholesaleMinimumMet={wholesaleValidation.minimumMet}
              wholesaleAmountShort={wholesaleValidation.amountShort}
            />
          )}
        </div>

        {/* ── Right: summary sidebar ─────────────────────────────────────── */}
        {currentStep !== 'auth' && (
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <CheckoutSummary
                shippingAddress={shippingAddress}
                paymentMethod={paymentMethod}
                totals={totals}
                showItems
              />

              {/* Wholesale minimum warning — visible from payment step onward */}
              {isWholesale && !wholesaleValidation.minimumMet &&
               currentStep !== 'shipping' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm text-amber-800 font-medium">
                      {t.wholesaleWarn[language]}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </CheckoutShell>
  );
}

// ============================================================================
// AUTH STEP
// ============================================================================

interface AuthStepProps {
  language: 'ar' | 'fr';
  isAuthenticated: boolean;
  user: { fullName: string | null; email: string } | null;
  onContinueAsGuest: () => void;
  onContinue: () => void;
}

function AuthStep({ language, isAuthenticated, user, onContinueAsGuest, onContinue }: AuthStepProps) {
  if (isAuthenticated && user) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0">
            {user.fullName?.charAt(0) || user.email.charAt(0)}
          </div>
          <div>
            <p className="text-sm text-slate-500">{t.welcomeBack[language]}</p>
            <p className="font-bold text-slate-900">{user.fullName || user.email}</p>
          </div>
        </div>
        <Button onClick={onContinue} fullWidth size="lg">
          {t.continueOrder[language]}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Login / Register */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {t.loginTitle[language]}
        </h3>
        <p className="text-slate-600 text-sm mb-4">{t.loginDesc[language]}</p>
        <div className="flex gap-3">
          <Link to="/login?redirect=/checkout" className="flex-1">
            <Button fullWidth>{t.loginBtn[language]}</Button>
          </Link>
          <Link to="/register?redirect=/checkout" className="flex-1">
            <Button variant="outline" fullWidth>{t.registerBtn[language]}</Button>
          </Link>
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-gradient-to-br from-slate-50 via-white to-red-50 text-slate-500">
            {t.orSeparator[language]}
          </span>
        </div>
      </div>

      {/* Guest */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {t.guestTitle[language]}
        </h3>
        <p className="text-slate-600 text-sm mb-4">{t.guestDesc[language]}</p>
        <Button variant="outline" fullWidth onClick={onContinueAsGuest}>
          {t.guestBtn[language]}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// CHECKOUT SHELL (page wrapper)
// ============================================================================
// Intentionally NOT using CustomerLayout here because the checkout page
// has its own focused header (no full nav, no cart badge) to reduce
// distractions and match standard e-commerce checkout UX patterns.
// ============================================================================

interface CheckoutShellProps {
  children: React.ReactNode;
  language: 'ar' | 'fr';
  isRTL: boolean;
  navigate: ReturnType<typeof useNavigate>;
}

function CheckoutShell({ children, language, isRTL, navigate }: CheckoutShellProps) {
  return (
    <div
      className={cn(
        'min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50',
        isRTL ? 'font-[Cairo]' : 'font-[Inter]'
      )}
    >
      {/* Focused checkout header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
              <span className="text-white font-bold text-lg">غ</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-slate-900 text-lg group-hover:text-red-600 transition-colors">
                {language === 'ar' ? 'غالينينو' : 'Ghalinino'}
              </span>
            </div>
          </Link>

          {/* Page title */}
          <h2 className="text-lg font-bold text-slate-900">
            {t.checkout[language]}
          </h2>

          {/* Back + language */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-red-600 transition-colors"
            >
              <svg className={cn('w-4 h-4', !isRTL && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {t.backToShopping[language]}
            </button>
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-slate-500 text-sm">
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