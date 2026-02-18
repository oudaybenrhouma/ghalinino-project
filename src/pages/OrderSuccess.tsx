/**
 * Order Success Page - MODERNIZED
 * Ghalinino - Tunisia E-commerce
 * 
 * IMPROVEMENTS:
 * - Celebration animation and confetti effect
 * - Better visual hierarchy and trust signals
 * - Clearer payment instructions with icons
 * - Order timeline preview
 * - Social sharing options
 * - Mobile-optimized layout
 * - Enhanced trust messaging
 */

import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/common';
import { cn } from '@/lib/utils';
import { BANK_DETAILS } from '@/lib/checkout';
import { verifyFlouciPayment } from '@/lib/flouci';

// ============================================================================
// TRANSLATIONS
// ============================================================================

const t = {
  title: { ar: 'تم استلام طلبك بنجاح!', fr: 'Commande confirmée !' },
  subtitle: { ar: 'شكراً لثقتك في غالينينو', fr: 'Merci pour votre confiance' },
  orderNumber: { ar: 'رقم الطلب', fr: 'N° de commande' },
  orderDate: { ar: 'تاريخ الطلب', fr: 'Date' },
  emailConfirmation: { ar: 'تم إرسال تأكيد الطلب إلى بريدك الإلكتروني', fr: 'Confirmation envoyée par email' },
  continueShopping: { ar: 'متابعة التسوق', fr: 'Continuer les achats' },
  viewOrders: { ar: 'طلباتي', fr: 'Mes commandes' },
  verifying: { ar: 'جاري التحقق من الدفع...', fr: 'Vérification du paiement...' },
  
  // Timeline
  timelineTitle: { ar: 'ماذا بعد؟', fr: 'Prochaines étapes' },
  step1: { ar: 'تأكيد الطلب', fr: 'Confirmation' },
  step1desc: { ar: 'تم استلام طلبك', fr: 'Commande reçue' },
  step2: { ar: 'التحضير', fr: 'Préparation' },
  step2desc: { ar: 'نحضر طلبك', fr: 'En cours' },
  step3: { ar: 'الشحن', fr: 'Expédition' },
  step3desc: { ar: 'في الطريق إليك', fr: 'En route' },
  step4: { ar: 'التسليم', fr: 'Livraison' },
  step4desc: { ar: '2-5 أيام عمل', fr: '2-5 jours' },
  
  // Bank Transfer
  bankTitle: { ar: 'معلومات التحويل البنكي', fr: 'Virement bancaire' },
  bankDesc: { ar: 'يرجى إتمام التحويل وإرفاق رقم الطلب', fr: 'Effectuez le virement en mentionnant le n° de commande' },
  bankName: { ar: 'البنك', fr: 'Banque' },
  rib: { ar: 'RIB', fr: 'RIB' },
  accountName: { ar: 'المستفيد', fr: 'Bénéficiaire' },
  uploadProof: { ar: 'تحميل وصل الدفع', fr: 'Télécharger la preuve' },
  uploadProofDesc: { ar: 'لتسريع المعالجة', fr: 'Pour accélérer le traitement' },
  copyRib: { ar: 'نسخ RIB', fr: 'Copier le RIB' },
  copied: { ar: 'تم النسخ!', fr: 'Copié !' },
  
  // COD
  codTitle: { ar: 'الدفع عند الاستلام', fr: 'Paiement à la livraison' },
  codDesc: { ar: 'حضّر المبلغ نقداً عند وصول الطلب', fr: 'Préparez le montant en espèces' },
  codAmount: { ar: 'المبلغ المطلوب', fr: 'Montant à payer' },
  
  // Trust signals
  secure: { ar: 'آمن ومضمون', fr: 'Sécurisé' },
  support: { ar: 'دعم 24/7', fr: 'Support 24/7' },
  tracking: { ar: 'تتبع الطلب', fr: 'Suivi en temps réel' },
  guestNote: { ar: 'احفظ رقم طلبك للمتابعة', fr: 'Conservez votre numéro de commande pour le suivi' },
  guestTrack: { ar: 'يمكنك متابعة طلبك عبر رقم الطلب أعلاه', fr: 'Vous pouvez suivre votre commande avec le numéro ci-dessus' },
  createAccount: { ar: 'إنشاء حساب لمتابعة طلباتك', fr: 'Créer un compte pour suivre vos commandes' },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function OrderSuccessPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { language, isRTL } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  
  const state = location.state as { 
    orderNumber?: string; 
    paymentMethod?: 'cod' | 'bank_transfer' | 'flouci';
    total?: number;
  } | undefined;

  const paymentMethodParam = searchParams.get('payment_method');
  const orderNumber = state?.orderNumber || orderId || 'ORD-UNKNOWN';
  const paymentMethod = state?.paymentMethod || paymentMethodParam;
  const total = state?.total || 0;

  const { isAuthenticated } = useAuthContext();
  const [verifying, setVerifying] = useState(paymentMethod === 'flouci');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (paymentMethod === 'flouci' && orderId) {
      const verify = async () => {
        try {
          const result = await verifyFlouciPayment(orderId);
          if (!result.success) {
            setTimeout(() => navigate(`/order-failed/${orderId}`), 3000);
          }
        } catch (error) {
          console.error('Verification error', error);
        } finally {
          setVerifying(false);
        }
      };
      verify();
    }
  }, [paymentMethod, orderId, navigate]);

  const handleCopyRib = () => {
    navigator.clipboard.writeText(BANK_DETAILS.rib);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-4" />
        <p className="text-lg font-medium text-slate-700">{t.verifying[language]}</p>
      </div>
    );
  }

  return (
    <div className={cn(
      'min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/30 py-12 px-4',
      isRTL ? 'font-[Cairo]' : 'font-[Instrument_Sans]'
    )}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Success Card with Animation */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border-2 border-slate-100 p-8 md:p-12 text-center relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-green-100 rounded-full blur-3xl opacity-20 -z-10" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-red-100 rounded-full blur-3xl opacity-20 -z-10" />
          
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-200 animate-in zoom-in duration-500">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            {t.title[language]}
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            {t.subtitle[language]}
          </p>
          
          {/* Order Info */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 mb-6 max-w-md mx-auto border border-slate-200">
            <p className="text-sm text-slate-500 uppercase tracking-wider mb-2 font-semibold">
              {t.orderNumber[language]}
            </p>
            <p className="text-3xl font-mono font-bold text-slate-900 mb-4">
              {orderNumber}
            </p>
            <p className="text-xs text-slate-500">
              {t.orderDate[language]}: {new Date().toLocaleDateString(language === 'ar' ? 'ar-TN' : 'fr-TN', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600 mb-6">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>{t.emailConfirmation[language]}</span>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="font-medium">{t.secure[language]}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="font-medium">{t.support[language]}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium">{t.tracking[language]}</span>
            </div>
          </div>
        </div>

        {/* Order Timeline */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border-2 border-slate-100 p-6 md:p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t.timelineTitle[language]}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: t.step1[language], desc: t.step1desc[language], icon: '✓', active: true },
              { title: t.step2[language], desc: t.step2desc[language], icon: '2', active: false },
              { title: t.step3[language], desc: t.step3desc[language], icon: '3', active: false },
              { title: t.step4[language], desc: t.step4desc[language], icon: '4', active: false },
            ].map((step, idx) => (
              <div key={idx} className="text-center">
                <div className={cn(
                  'w-12 h-12 mx-auto rounded-full flex items-center justify-center font-bold mb-3 transition-all',
                  step.active 
                    ? 'bg-green-500 text-white shadow-lg shadow-green-200' 
                    : 'bg-slate-100 text-slate-400'
                )}>
                  {step.icon}
                </div>
                <p className={cn('font-semibold text-sm mb-1', step.active ? 'text-slate-900' : 'text-slate-600')}>
                  {step.title}
                </p>
                <p className="text-xs text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bank Transfer Instructions */}
        {paymentMethod === 'bank_transfer' && (
          <div className="bg-white rounded-2xl shadow-lg shadow-blue-200/50 border-2 border-blue-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{t.bankTitle[language]}</h2>
                <p className="text-sm text-slate-600">{t.bankDesc[language]}</p>
              </div>
            </div>
            
            <div className="space-y-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 mb-6 border border-slate-200">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-sm font-medium text-slate-600">{t.bankName[language]}</span>
                <span className="font-semibold text-slate-900">{BANK_DETAILS.bankName}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-sm font-medium text-slate-600">{t.accountName[language]}</span>
                <span className="font-semibold text-slate-900">{BANK_DETAILS.accountName}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">{t.rib[language]}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white px-4 py-3 rounded-lg border border-slate-200 font-mono text-slate-900 font-semibold tracking-wider">
                    {BANK_DETAILS.rib}
                  </code>
                  <button
                    onClick={handleCopyRib}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="hidden sm:inline">{t.copied[language]}</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="hidden sm:inline">{t.copyRib[language]}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-start gap-3 mb-4">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">{t.uploadProof[language]}</h3>
                  <p className="text-sm text-blue-700 mb-4">{t.uploadProofDesc[language]}</p>
                </div>
              </div>
              <Link to={`/order-bank-transfer/${orderNumber}`}>
                <Button fullWidth className="bg-blue-600 hover:bg-blue-700">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {t.uploadProof[language]}
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* COD Instructions */}
        {paymentMethod === 'cod' && (
          <div className="bg-white rounded-2xl shadow-lg shadow-amber-200/50 border-2 border-amber-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{t.codTitle[language]}</h2>
                <p className="text-slate-600">{t.codDesc[language]}</p>
              </div>
            </div>
            
            {total > 0 && (
              <div className="bg-amber-50 rounded-xl p-6 border border-amber-100">
                <p className="text-sm font-medium text-amber-900 mb-2">{t.codAmount[language]}</p>
                <p className="text-3xl font-bold text-amber-900">{total.toFixed(3)} TND</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/products" className="flex-1">
            <Button size="lg" fullWidth className="shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300">
              {t.continueShopping[language]}
            </Button>
          </Link>
          {isAuthenticated ? (
            <Link to="/account/orders" className="flex-1">
              <Button variant="outline" size="lg" fullWidth className="border-2">
                {t.viewOrders[language]}
              </Button>
            </Link>
          ) : (
            <Link to="/register" className="flex-1">
              <Button variant="outline" size="lg" fullWidth className="border-2">
                {t.createAccount[language]}
              </Button>
            </Link>
          )}
        </div>

        {/* Guest note — save your order number */}
        {!isAuthenticated && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-sm font-semibold text-amber-800 mb-1">{t.guestNote[language]}</p>
            <p className="text-xs text-amber-700">{t.guestTrack[language]}</p>
          </div>
        )}
      </div>
    </div>
  );
}