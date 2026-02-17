/**
 * Order Success Page
 * Ghalinino - Tunisia E-commerce
 * 
 * Displays order confirmation and next steps.
 */

import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks';
import { Button } from '@/components/common';
import { cn } from '@/lib/utils';
import { BANK_DETAILS } from '@/lib/checkout';
import { verifyFlouciPayment } from '@/lib/flouci';

// ============================================================================
// TRANSLATIONS
// ============================================================================

const t = {
  title: { ar: 'تم استلام طلبك بنجاح!', fr: 'Commande reçue avec succès !' },
  subtitle: { ar: 'شكراً لتسوقك مع غالينينو', fr: 'Merci d\'avoir magasiné chez Ghalinino' },
  orderNumber: { ar: 'رقم الطلب', fr: 'Numéro de commande' },
  emailConfirmation: { ar: 'تم إرسال تفاصيل الطلب إلى بريدك الإلكتروني', fr: 'Les détails de la commande ont été envoyés à votre email' },
  continueShopping: { ar: 'متابعة التسوق', fr: 'Continuer les achats' },
  viewOrder: { ar: 'عرض تفاصيل الطلب', fr: 'Voir la commande' },
  verifying: { ar: 'جاري التحقق من الدفع...', fr: 'Vérification du paiement...' },
  paymentSuccess: { ar: 'تم الدفع بنجاح!', fr: 'Paiement réussi !' },
  paymentFailed: { ar: 'فشل الدفع', fr: 'Paiement échoué' },
  
  // Bank Transfer Specific
  bankTitle: { ar: 'معلومات التحويل البنكي', fr: 'Informations de virement bancaire' },
  bankDesc: { ar: 'يرجى تحويل المبلغ الإجمالي إلى الحساب التالي وإرفاق رقم الطلب في الملاحظات', fr: 'Veuillez transférer le montant total vers le compte suivant en mentionnant le numéro de commande' },
  bankName: { ar: 'البنك', fr: 'Banque' },
  rib: { ar: 'رقم الحساب (RIB)', fr: 'RIB' },
  accountName: { ar: 'المستفيد', fr: 'Bénéficiaire' },
  uploadProof: { ar: 'تحميل وصل الدفع', fr: 'Télécharger la preuve de paiement' },
  uploadProofDesc: { ar: 'لتسريع معالجة طلبك، يرجى تحميل صورة من وصل التحويل', fr: 'Pour accélérer le traitement, veuillez télécharger une copie du virement' },
  
  // COD Specific
  codTitle: { ar: 'تعليمات الدفع عند الاستلام', fr: 'Instructions de paiement à la livraison' },
  codDesc: { ar: 'يرجى تحضير المبلغ المحدد نقداً عند وصول عامل التوصيل', fr: 'Veuillez préparer le montant exact en espèces à l\'arrivée du livreur' },
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
  
  // Get state passed from checkout (if available) or URL params
  const state = location.state as { 
    orderNumber?: string; 
    paymentMethod?: 'cod' | 'bank_transfer' | 'flouci';
    total?: number;
  } | undefined;

  // Check URL params for payment method (redirect from Flouci)
  const paymentMethodParam = searchParams.get('payment_method');

  // Fallback if accessed directly without state (e.g. refresh)
  // In a real app, we would fetch order details by ID here
  const orderNumber = state?.orderNumber || orderId || 'ORD-UNKNOWN';
  const paymentMethod = state?.paymentMethod || paymentMethodParam;

  const [verifying, setVerifying] = useState(paymentMethod === 'flouci');
  const [verificationResult, setVerificationResult] = useState<'success' | 'failed' | null>(null);

  useEffect(() => {
    if (paymentMethod === 'flouci' && orderId) {
      const verify = async () => {
        try {
          const result = await verifyFlouciPayment(orderId);
          if (result.success) {
            setVerificationResult('success');
          } else {
            setVerificationResult('failed');
            // Optionally redirect to failure page after delay
            setTimeout(() => navigate(`/order-failed/${orderId}`), 3000);
          }
        } catch (error) {
          console.error('Verification error', error);
          setVerificationResult('failed');
        } finally {
          setVerifying(false);
        }
      };
      verify();
    }
  }, [paymentMethod, orderId, navigate]);

  if (verifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <svg className="w-12 h-12 animate-spin text-indigo-600 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-lg text-slate-700">{t.verifying[language]}</p>
      </div>
    );
  }

  return (
    <div className={cn(
      'min-h-screen bg-slate-50 py-12 px-4',
      isRTL ? 'font-[Cairo]' : 'font-[Inter]'
    )}>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {t.title[language]}
          </h1>
          <p className="text-slate-600 mb-8">
            {t.subtitle[language]}
          </p>
          
          <div className="bg-slate-50 rounded-xl p-6 mb-8 inline-block w-full max-w-sm">
            <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">
              {t.orderNumber[language]}
            </p>
            <p className="text-2xl font-mono font-bold text-slate-900">
              {orderNumber}
            </p>
          </div>
          
          <p className="text-sm text-slate-500">
            {t.emailConfirmation[language]}
          </p>
        </div>

        {/* Payment Specific Instructions */}
        {paymentMethod === 'bank_transfer' && (
          <div className="bg-white rounded-2xl shadow-sm border border-blue-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                {t.bankTitle[language]}
              </h2>
            </div>
            
            <p className="text-slate-600 mb-6">
              {t.bankDesc[language]}
            </p>
            
            <div className="space-y-4 bg-slate-50 rounded-xl p-6 mb-6">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3 last:border-0 last:pb-0">
                <span className="text-slate-500">{t.bankName[language]}</span>
                <span className="font-medium text-slate-900">{BANK_DETAILS.bankName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-3 last:border-0 last:pb-0">
                <span className="text-slate-500">{t.accountName[language]}</span>
                <span className="font-medium text-slate-900">{BANK_DETAILS.accountName}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-slate-200 pb-3 last:border-0 last:pb-0">
                <span className="text-slate-500">{t.rib[language]}</span>
                <span className="font-mono font-medium text-slate-900 text-lg tracking-wider">
                  {BANK_DETAILS.rib}
                </span>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 mb-2">
                {t.uploadProof[language]}
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                {t.uploadProofDesc[language]}
              </p>
              <Link to={`/order-bank-transfer/${orderNumber}`}>
                <Button variant="outline" fullWidth className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300">
                  {t.uploadProof[language]}
                </Button>
              </Link>
            </div>
          </div>
        )}

        {paymentMethod === 'cod' && (
          <div className="bg-white rounded-2xl shadow-sm border border-amber-200 p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                {t.codTitle[language]}
              </h2>
            </div>
            <p className="text-slate-600">
              {t.codDesc[language]}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/products" className="flex-1 sm:flex-none">
            <Button size="lg" fullWidth>
              {t.continueShopping[language]}
            </Button>
          </Link>
          <Link to="/account/orders" className="flex-1 sm:flex-none">
            <Button variant="outline" size="lg" fullWidth>
              {t.viewOrder[language]}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
