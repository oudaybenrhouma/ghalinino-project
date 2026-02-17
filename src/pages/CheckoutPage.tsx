/**
 * Checkout Page
 * Ghalinino - Tunisia E-commerce
 * 
 * Multi-step checkout flow:
 * 1. Auth (login/continue as guest)
 * 2. Shipping information
 * 3. Payment method selection
 * 4. Order review and placement
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cn, formatPrice } from '@/lib/utils';
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
import { createCODOrder, createBankTransferOrder, createFlouciOrder, type OrderCartItem } from '@/lib/orderProcessing';
import { generateFlouciPayment } from '@/lib/flouci';
import { validateWholesaleMinimum } from '@/lib/wholesaleValidation';
import { toast } from 'react-hot-toast';
import type { Governorate } from '@/types';

// ============================================================================
// TRANSLATIONS
// ============================================================================

const t = {
  checkout: { ar: 'إتمام الطلب', fr: 'Finaliser la commande' },
  backToCart: { ar: 'العودة للسلة', fr: 'Retour au panier' },
  emptyCart: { ar: 'سلتك فارغة', fr: 'Votre panier est vide' },
  emptyCartDesc: { ar: 'أضف بعض المنتجات قبل إتمام الطلب', fr: 'Ajoutez des produits avant de commander' },
  browseProducts: { ar: 'تصفح المنتجات', fr: 'Parcourir les produits' },
  
  // Step 1: Auth
  loginRequired: { ar: 'تسجيل الدخول', fr: 'Connexion' },
  loginDescription: { ar: 'سجل دخولك للحصول على تجربة أفضل وتتبع طلباتك', fr: 'Connectez-vous pour une meilleure expérience et suivre vos commandes' },
  continueAsGuest: { ar: 'المتابعة كضيف', fr: 'Continuer en tant qu\'invité' },
  guestDescription: { ar: 'يمكنك إتمام الطلب بدون حساب', fr: 'Vous pouvez commander sans compte' },
  login: { ar: 'تسجيل الدخول', fr: 'Se connecter' },
  register: { ar: 'إنشاء حساب', fr: 'Créer un compte' },
  or: { ar: 'أو', fr: 'ou' },
  welcomeBack: { ar: 'مرحباً بعودتك', fr: 'Bienvenue' },
  continueCheckout: { ar: 'متابعة الطلب', fr: 'Continuer la commande' },
  
  // Order success
  orderPlaced: { ar: 'تم تأكيد طلبك!', fr: 'Commande confirmée !' },
  orderNumber: { ar: 'رقم الطلب', fr: 'Numéro de commande' },
  orderConfirmation: { ar: 'ستتلقى رسالة تأكيد على بريدك الإلكتروني', fr: 'Vous recevrez un email de confirmation' },
  viewOrders: { ar: 'عرض طلباتي', fr: 'Voir mes commandes' },
  continueShopping: { ar: 'متابعة التسوق', fr: 'Continuer les achats' },

  // Wholesale minimum
  minOrderNotMet: { ar: 'الحد الأدنى للطلب غير محقق', fr: 'Minimum de commande non atteint' },
  addMoreToCheckout: { ar: 'أضف المزيد لإتمام الطلب', fr: 'Ajoutez plus pour passer commande' },
  placeOrder: { ar: 'تأكيد الطلب', fr: 'Confirmer la commande' },
  minimumNotMet: { ar: 'الحد الأدنى غير محقق', fr: 'Minimum non atteint' },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function CheckoutPage() {
  const { language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();
  const isWholesale = user?.wholesaleStatus === 'approved';
  const { isEmpty, subtotal, clearCart, items } = useCartContext();
  const addNotification = useStore((state) => state.addNotification);

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('auth');
  const [completedSteps, setCompletedSteps] = useState<CheckoutStep[]>([]);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Calculate totals
  const totals = calculateCheckoutTotals(
    subtotal,
    shippingAddress?.governorate as Governorate | null,
    paymentMethod || 'cod',
    isWholesale,
    0 // discount
  );

  // Wholesale minimum validation
  // CartContext.CartItem has the same runtime shape as the Zustand CartItem
  // that validateWholesaleMinimum expects (both have product.price, product.wholesalePrice).
  const wholesaleValidation = isWholesale
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? validateWholesaleMinimum(items as any, true)
    : { isValid: true, minimumMet: true, amountShort: 0, errors: [] };

  // Skip auth step if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && currentStep === 'auth') {
      setCompletedSteps(['auth']);
      setCurrentStep('shipping');
    }
  }, [isAuthenticated, authLoading, currentStep]);

  // Redirect if cart is empty
  useEffect(() => {
    if (isEmpty && !authLoading) {
      const timer = setTimeout(() => {
        if (isEmpty) {
          navigate('/products');
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isEmpty, authLoading, navigate]);

  const goToStep = useCallback((step: CheckoutStep) => {
    setCurrentStep(step);
  }, []);

  const handleContinueAsGuest = useCallback(() => {
    setCompletedSteps(['auth']);
    setCurrentStep('shipping');
  }, []);

  const handleShippingSubmit = useCallback((address: ShippingAddress, _saveToProfile: boolean) => {
    setShippingAddress(address);
    setCompletedSteps((prev) => [...prev.filter((s) => s !== 'shipping'), 'shipping']);
    setCurrentStep('payment');
  }, []);

  const handlePaymentSubmit = useCallback(() => {
    if (paymentMethod) {
      setCompletedSteps((prev) => [...prev.filter((s) => s !== 'payment'), 'payment']);
      setCurrentStep('review');
    }
  }, [paymentMethod]);

  // Handle place order with wholesale validation
  const handlePlaceOrder = useCallback(async () => {
    if (!shippingAddress || !paymentMethod) return;

    // Validate wholesale minimum
    if (!wholesaleValidation.isValid) {
      toast.error(wholesaleValidation.errors.join(', '));
      return;
    }

    setIsPlacingOrder(true);

    try {
      const orderParams = {
        userId: user?.id,
        guestEmail: !user ? undefined : undefined, // guests provide email in shipping form
        guestPhone: shippingAddress.phone,
        shippingAddress,
        paymentMethod,
        totals,
        // CartContext.CartItem and OrderCartItem have the same runtime shape —
        // both have { productId, quantity, product: { id, nameAr, nameFr, price, ... } }
        items: items as unknown as OrderCartItem[],
        isWholesaleOrder: isWholesale,
      };

      let result;

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

      const newOrderNumber = result.orderNumber || 'ORD-UNKNOWN';
      
      await clearCart();

      addNotification({
        type: 'success',
        title: language === 'ar' ? 'تم تأكيد طلبك!' : 'Commande confirmée !',
        message: newOrderNumber,
        duration: 5000,
      });

      if (paymentMethod === 'bank_transfer') {
        navigate(`/order-bank-transfer/${newOrderNumber}`);
      } else if (paymentMethod === 'flouci') {
        const flouciResponse = await generateFlouciPayment(totals.total, result.orderId);
        if (flouciResponse.success && flouciResponse.redirect_link) {
          window.location.href = flouciResponse.redirect_link;
        } else {
          navigate(`/order-failed/${result.orderId}`);
          throw new Error(flouciResponse.error || 'Failed to generate Flouci payment');
        }
      } else {
        navigate(`/order-success/${result.orderId}`, {
          state: {
            orderNumber: newOrderNumber,
            paymentMethod,
            total: totals.total,
          }
        });
      }

    } catch (error) {
      console.error('Order placement error:', error);
      addNotification({
        type: 'error',
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        message: error instanceof Error ? error.message : (language === 'ar' ? 'فشل في إتمام الطلب' : 'Échec de la commande'),
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
    clearCart,
    addNotification,
    language,
    navigate,
    wholesaleValidation,
  ]);

  const handleEditShipping = useCallback(() => {
    setCurrentStep('shipping');
  }, []);

  const handleEditPayment = useCallback(() => {
    setCurrentStep('payment');
  }, []);

  // Empty cart view
  if (isEmpty && !authLoading) {
    return (
      <CheckoutLayout language={language} isRTL={isRTL}>
        <div className="max-w-lg mx-auto text-center py-12">
          <div className="w-20 h-20 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            {t.emptyCart[language]}
          </h1>
          <p className="text-slate-600 mb-6">
            {t.emptyCartDesc[language]}
          </p>
          <Button onClick={() => navigate('/products')}>
            {t.browseProducts[language]}
          </Button>
        </div>
      </CheckoutLayout>
    );
  }

  return (
    <CheckoutLayout language={language} isRTL={isRTL}>
      {/* Progress indicator */}
      <div className="mb-8">
        <CheckoutProgress
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={(step) => {
            if (completedSteps.includes(step)) {
              goToStep(step);
            }
          }}
        />
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left column: Steps */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Auth */}
          {currentStep === 'auth' && (
            <AuthStep
              language={language}
              isAuthenticated={isAuthenticated}
              user={user}
              onContinueAsGuest={handleContinueAsGuest}
              onContinue={() => {
                setCompletedSteps(['auth']);
                setCurrentStep('shipping');
              }}
            />
          )}

          {/* Step 2: Shipping */}
          {currentStep === 'shipping' && (
            <ShippingForm
              initialData={shippingAddress || undefined}
              onSubmit={handleShippingSubmit}
              onBack={!isAuthenticated ? () => setCurrentStep('auth') : undefined}
              isLoading={false}
            />
          )}

          {/* Step 3: Payment */}
          {currentStep === 'payment' && (
            <PaymentMethodSelector
              selectedMethod={paymentMethod}
              onSelect={setPaymentMethod}
              onSubmit={handlePaymentSubmit}
              onBack={() => setCurrentStep('shipping')}
              isLoading={false}
            />
          )}

          {/* Step 4: Review & Place Order */}
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

        {/* Right column: Summary */}
        {currentStep !== 'auth' && (
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <CheckoutSummary
                shippingAddress={shippingAddress}
                paymentMethod={paymentMethod}
                totals={totals}
                showItems={true}
              />

              {/* Additional warning in summary (optional visibility) */}
              {isWholesale && !wholesaleValidation.minimumMet && currentStep === 'review' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
                  <p className="text-amber-800 font-medium">
                    الحد الأدنى للطلب: أضف المزيد لإكمال العملية
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </CheckoutLayout>
  );
}

// ============================================================================
// AUTH STEP COMPONENT (unchanged)
// ============================================================================

interface AuthStepProps {
  language: 'ar' | 'fr';
  isAuthenticated: boolean;
  user: { fullName: string | null; email: string } | null;
  onContinueAsGuest: () => void;
  onContinue: () => void;
}

function AuthStep({
  language,
  isAuthenticated,
  user,
  onContinueAsGuest,
  onContinue,
}: AuthStepProps) {
  if (isAuthenticated && user) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center text-white font-bold text-xl">
            {user.fullName?.charAt(0) || user.email.charAt(0)}
          </div>
          <div>
            <p className="text-sm text-slate-500">مرحباً بعودتك</p>
            <p className="font-bold text-slate-900">{user.fullName || user.email}</p>
          </div>
        </div>
        <Button onClick={onContinue} fullWidth size="lg">
          متابعة الطلب
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          تسجيل الدخول مطلوب
        </h3>
        <p className="text-slate-600 text-sm mb-4">
          سجل دخولك للحصول على تجربة أفضل وتتبع طلباتك
        </p>
        <div className="flex gap-3">
          <Link to="/login?redirect=/checkout" className="flex-1">
            <Button fullWidth>تسجيل الدخول</Button>
          </Link>
          <Link to="/register?redirect=/checkout" className="flex-1">
            <Button variant="outline" fullWidth>إنشاء حساب</Button>
          </Link>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-gradient-to-br from-slate-50 via-white to-red-50 text-slate-500">
            أو
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          المتابعة كضيف
        </h3>
        <p className="text-slate-600 text-sm mb-4">
          يمكنك إتمام الطلب بدون حساب
        </p>
        <Button variant="outline" fullWidth onClick={onContinueAsGuest}>
          المتابعة كضيف
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// LAYOUT COMPONENT (unchanged)
// ============================================================================

interface CheckoutLayoutProps {
  children: React.ReactNode;
  language: 'ar' | 'fr';
  isRTL: boolean;
}

function CheckoutLayout({ children, language, isRTL }: CheckoutLayoutProps) {
  return (
    <div className={cn(
      'min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50',
      isRTL ? 'font-[Cairo]' : 'font-[Inter]'
    )}>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
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

          <h2 className="text-lg font-bold text-slate-900">
            {t.checkout[language]}
          </h2>

          <div className="flex items-center gap-4">
            <Link
              to="/cart"
              className="text-sm text-slate-600 hover:text-red-600 transition-colors hidden sm:inline"
            >
              {t.backToCart[language]}
            </Link>
            <LanguageToggle />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>

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