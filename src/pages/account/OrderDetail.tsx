/**
 * Order Detail Page — Redesigned
 * Visual timeline, clear hierarchy, prominent actions, print/contact/return options
 */

import { useParams, Link } from 'react-router-dom';
import { useOrderDetail } from '@/hooks/useOrderDetail';
import { useLanguage } from '@/hooks';
import { PaymentProofModal } from '@/components/account/PaymentProofModal';
import { Button } from '@/components/common';
import { formatPrice, cn } from '@/lib/utils';
import { useState, useEffect, JSX } from 'react';
import { AccountLayout } from '@/components/layout';

// ─── Icons ────────────────────────────────────────────────────────────────────

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function PrintIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  );
}

function SupportIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}

function LocationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}

function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// ─── Visual Order Timeline ────────────────────────────────────────────────────

type TimelineStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered';

const TIMELINE_STEPS: { id: TimelineStatus; icon: JSX.Element; label: { ar: string; fr: string } }[] = [
  {
    id: 'pending',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    label: { ar: 'تم الطلب', fr: 'Commandé' },
  },
  {
    id: 'paid',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>,
    label: { ar: 'تم الدفع', fr: 'Payé' },
  },
  {
    id: 'processing',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>,
    label: { ar: 'قيد التجهيز', fr: 'Préparation' },
  },
  {
    id: 'shipped',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>,
    label: { ar: 'في الطريق', fr: 'En route' },
  },
  {
    id: 'delivered',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>,
    label: { ar: 'تم التوصيل', fr: 'Livré' },
  },
];

function VisualTimeline({ currentStatus, language }: { currentStatus: string; language: 'ar' | 'fr' }) {
  const isRTL = language === 'ar';

  if (currentStatus === 'cancelled') {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
        <XCircleIcon className="w-6 h-6 flex-shrink-0" />
        <div>
          <p className="font-semibold">{language === 'ar' ? 'تم إلغاء هذا الطلب' : 'Commande annulée'}</p>
          <p className="text-sm text-red-600 mt-0.5">
            {language === 'ar' ? 'إذا كانت لديك أسئلة، تواصل معنا' : 'Si vous avez des questions, contactez-nous'}
          </p>
        </div>
      </div>
    );
  }

  if (currentStatus === 'refunded') {
    return (
      <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
        <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
        </svg>
        <p className="font-semibold">{language === 'ar' ? 'تم استرجاع هذا الطلب' : 'Commande remboursée'}</p>
      </div>
    );
  }

  const currentIndex = TIMELINE_STEPS.findIndex(s => s.id === currentStatus);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className={cn('relative', isRTL && 'direction-rtl')}>
      {/* Progress bar background */}
      <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-200" />
      {/* Progress bar fill */}
      <div
        className="absolute top-5 left-5 h-0.5 bg-gradient-to-r from-red-400 to-red-600 transition-all duration-700"
        style={{ width: `calc(${(activeIndex / (TIMELINE_STEPS.length - 1)) * 100}% - 0px)` }}
      />

      <div className="relative flex justify-between">
        {TIMELINE_STEPS.map((step, index) => {
          const isDone = index < activeIndex;
          const isCurrent = index === activeIndex;
          const isPending = index > activeIndex;

          return (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white z-10',
                isDone && 'border-red-500 bg-red-500 text-white',
                isCurrent && 'border-red-500 text-red-600 ring-4 ring-red-100',
                isPending && 'border-slate-200 text-slate-300',
              )}>
                {isDone ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.icon
                )}
              </div>
              <span className={cn(
                'text-[10px] sm:text-xs font-medium text-center leading-tight max-w-[60px]',
                (isDone || isCurrent) ? 'text-slate-800' : 'text-slate-400'
              )}>
                {step.label[language]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Payment Status Chip ──────────────────────────────────────────────────────

function PaymentChip({ status, method, language }: { status: string; method: string; language: 'ar' | 'fr' }) {
  const isPaid = status === 'paid';
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border',
      isPaid
        ? 'bg-green-50 text-green-700 border-green-200'
        : 'bg-amber-50 text-amber-700 border-amber-200'
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', isPaid ? 'bg-green-400' : 'bg-amber-400 animate-pulse')} />
      {isPaid
        ? (language === 'ar' ? 'مدفوع' : 'Payé')
        : (language === 'ar' ? 'انتظار الدفع' : 'En attente')}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { order, isLoading, error, refetch } = useOrderDetail(id);
  const { language } = useLanguage();
  const [showProofModal, setShowProofModal] = useState(false);
  const isRTL = language === 'ar';

  // Refetch when the user returns to this tab/window (e.g. after uploading proof
  // on the BankTransferInstructions page and navigating back)
  useEffect(() => {
    const handleFocus = () => { refetch(); };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetch]);

  if (isLoading) {
    return (
      <AccountLayout>
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-slate-200 rounded" />
          <div className="h-32 bg-slate-100 rounded-2xl" />
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2 h-64 bg-slate-100 rounded-2xl" />
            <div className="h-64 bg-slate-100 rounded-2xl" />
          </div>
        </div>
      </AccountLayout>
    );
  }

  if (error || !order) {
    return (
      <AccountLayout>
        <div className="text-center py-16">
          <p className="text-red-600 mb-4">
            {error || (language === 'ar' ? 'الطلب غير موجود' : 'Commande introuvable')}
          </p>
          <Link to="/account/orders">
            <Button variant="outline">
              {language === 'ar' ? 'العودة للطلبات' : 'Retour aux commandes'}
            </Button>
          </Link>
        </div>
      </AccountLayout>
    );
  }

  const canCancel = ['pending', 'payment_pending'].includes(order.status);
  const canReturn = order.status === 'delivered';
  const canTrack = ['shipped', 'processing'].includes(order.status);

  // Wholesale: can add virement proof after order is placed, before it's processed
  const canAddVirement =
    order.is_wholesale_order &&
    !['cancelled', 'delivered', 'refunded'].includes(order.status) &&
    !order.bank_transfer_proof_url;

  // Wholesale: proof submitted, waiting for admin review
  const virementPending =
    order.is_wholesale_order &&
    !!order.bank_transfer_proof_url &&
    order.payment_status !== 'paid';

  return (
    <AccountLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Breadcrumb + Actions Row */}
        <div className={cn('flex items-center justify-between gap-4 mb-6', isRTL && 'flex-row-reverse')}>
          <Link
            to="/account/orders"
            className={cn(
              'flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 transition-colors font-medium',
              isRTL && 'flex-row-reverse'
            )}
          >
            <ArrowLeftIcon className={cn('w-4 h-4', isRTL && 'rotate-180')} />
            {language === 'ar' ? 'طلباتي' : 'Mes commandes'}
          </Link>

          {/* Print invoice */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300"
          >
            <PrintIcon className="w-3.5 h-3.5" />
            {language === 'ar' ? 'طباعة الفاتورة' : 'Imprimer'}
          </button>
        </div>

        {/* Order Header Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5">
          <div className={cn('flex items-start justify-between gap-4 mb-4', isRTL && 'flex-row-reverse')}>
            <div className={isRTL ? 'text-right' : ''}>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">
                {language === 'ar' ? 'رقم الطلب' : 'Commande'}
              </p>
              <h1 className="text-xl font-bold font-mono text-slate-900">{order.order_number}</h1>
              <p className="text-sm text-slate-500 mt-1">
                {new Date(order.created_at).toLocaleDateString(
                  language === 'ar' ? 'ar-TN' : 'fr-TN',
                  { year: 'numeric', month: 'long', day: 'numeric' }
                )}
              </p>
            </div>
            <div className={cn('flex flex-col items-end gap-2', isRTL && 'items-start')}>
              <PaymentChip status={order.payment_status} method={order.payment_method} language={language} />
            </div>
          </div>

          {/* Visual Timeline */}
          <div className="pt-2">
            <VisualTimeline currentStatus={order.status} language={language} />
          </div>
        </div>

        {/* Tracking CTA (if shipped) */}
        {canTrack && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 mb-5 flex items-center justify-between shadow-md shadow-indigo-200">
            <div className={cn('flex items-center gap-3', isRTL && 'flex-row-reverse')}>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <TruckIcon className="w-5 h-5 text-white" />
              </div>
              <div className={isRTL ? 'text-right' : ''}>
                <p className="font-semibold text-white text-sm">
                  {language === 'ar' ? 'طلبك في الطريق!' : 'Votre colis est en route !'}
                </p>
                <p className="text-indigo-200 text-xs">
                  {language === 'ar' ? 'تتبع شحنتك الآن' : 'Suivez votre livraison'}
                </p>
              </div>
            </div>
            <button className="bg-white text-indigo-600 text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-indigo-50 transition-colors flex-shrink-0">
              {language === 'ar' ? 'تتبع' : 'Suivre'}
            </button>
          </div>
        )}

        {/* Wholesale Virement Banner — add proof after order placed */}
        {canAddVirement && (
          <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-4 mb-5 shadow-sm shadow-amber-100">
            <div className={cn('flex items-start gap-3', isRTL && 'flex-row-reverse')}>
              <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm shadow-amber-200">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className={cn('flex-1 min-w-0', isRTL && 'text-right')}>
                <p className="font-bold text-amber-900 text-sm">
                  {language === 'ar' ? 'هل تريد الدفع بالتحويل البنكي؟' : 'Payer par virement bancaire ?'}
                </p>
                <p className="text-amber-700 text-xs mt-0.5 leading-relaxed">
                  {language === 'ar'
                    ? 'يمكنك إرفاق وصل التحويل البنكي الآن لتسريع معالجة طلبك'
                    : 'Joignez votre justificatif de virement pour accélérer le traitement de votre commande'}
                </p>
              </div>
              <Link
                to={`/order-bank-transfer/${order.order_number}`}
                className="flex-shrink-0"
              >
                <button className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-sm whitespace-nowrap">
                  {language === 'ar' ? 'إرفاق الوصل' : 'Joindre le reçu'}
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* Wholesale Virement Pending — proof submitted, awaiting review */}
        {virementPending && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 mb-5 flex items-center gap-3 shadow-sm">
            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className={cn('flex-1', isRTL && 'text-right')}>
              <p className="font-semibold text-blue-900 text-sm">
                {language === 'ar' ? 'وصل التحويل قيد المراجعة' : 'Justificatif de virement en cours de vérification'}
              </p>
              <p className="text-blue-700 text-xs mt-0.5">
                {language === 'ar' ? 'سيتم تأكيد طلبك بعد التحقق، عادةً خلال 24 ساعة' : 'Votre commande sera confirmée après vérification, sous 24h généralement'}
              </p>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid md:grid-cols-3 gap-5">

          {/* Left: Products + Payment */}
          <div className="md:col-span-2 space-y-5">

            {/* Products */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className={cn('px-5 py-4 border-b border-slate-100 flex items-center gap-2', isRTL && 'flex-row-reverse')}>
                <PackageIcon className="w-4 h-4 text-slate-400" />
                <h2 className="font-bold text-slate-800">
                  {language === 'ar' ? 'المنتجات' : 'Articles commandés'}
                </h2>
                <span className="text-xs text-slate-400 font-medium ml-auto">
                  {order.items?.length ?? 0} {language === 'ar' ? 'منتج' : 'article(s)'}
                </span>
              </div>

              <div className="divide-y divide-slate-50">
                {order.items?.map((item: any) => {
                  const name = language === 'ar'
                    ? item.product_snapshot?.name_ar
                    : item.product_snapshot?.name_fr;
                  return (
                    <div key={item.id} className={cn('flex gap-3 p-4', isRTL && 'flex-row-reverse')}>
                      {/* Image */}
                      <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                        {item.product_snapshot?.image ? (
                          <img src={item.product_snapshot.image} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <PackageIcon className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      <div className={cn('flex-1 min-w-0', isRTL && 'text-right')}>
                        <p className="font-medium text-slate-800 text-sm leading-snug line-clamp-2">{name}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {item.quantity} × {formatPrice(item.unit_price * 1000, language)}
                        </p>
                      </div>

                      <p className={cn('font-bold text-slate-800 text-sm flex-shrink-0', isRTL && 'order-first')}>
                        {formatPrice(item.total_price * 1000, language)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h2 className={cn('font-bold text-slate-800 mb-4', isRTL && 'text-right')}>
                {language === 'ar' ? 'معلومات الدفع' : 'Informations de paiement'}
              </h2>

              <div className="space-y-3">
                <div className={cn('flex justify-between items-center text-sm', isRTL && 'flex-row-reverse')}>
                  <span className="text-slate-500">
                    {language === 'ar' ? 'طريقة الدفع' : 'Méthode de paiement'}
                  </span>
                  <span className="font-semibold capitalize text-slate-800">
                    {order.payment_method === 'bank_transfer'
                      ? (language === 'ar' ? 'تحويل بنكي' : 'Virement bancaire')
                      : order.payment_method === 'cod'
                        ? (language === 'ar' ? 'الدفع عند الاستلام' : 'Paiement à la livraison')
                        : 'Flouci'}
                  </span>
                </div>

                {/* Show proof row if payment is bank_transfer OR if wholesale customer added proof later */}
                {(order.payment_method === 'bank_transfer' || (order.is_wholesale_order && order.bank_transfer_proof_url)) && (
                  <div className={cn('flex justify-between items-center text-sm', isRTL && 'flex-row-reverse')}>
                    <span className="text-slate-500">
                      {language === 'ar' ? 'وصل التحويل' : 'Preuve de virement'}
                    </span>
                    {order.bank_transfer_proof_url ? (
                      <button
                        onClick={() => setShowProofModal(true)}
                        className="text-sm font-semibold text-red-600 hover:text-red-700 underline underline-offset-2"
                      >
                        {language === 'ar' ? 'عرض الوصل' : 'Voir la preuve'}
                      </button>
                    ) : (
                      <span className="text-amber-600 text-xs font-medium">
                        {language === 'ar' ? 'لم يُحمَّل بعد' : 'Non téléchargé'}
                      </span>
                    )}
                  </div>
                )}

                {/* Totals */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className={cn('flex justify-between text-sm', isRTL && 'flex-row-reverse')}>
                    <span className="text-slate-500">{language === 'ar' ? 'المجموع الفرعي' : 'Sous-total'}</span>
                    <span>{formatPrice(order.subtotal * 1000, language)}</span>
                  </div>
                  <div className={cn('flex justify-between text-sm', isRTL && 'flex-row-reverse')}>
                    <span className="text-slate-500">{language === 'ar' ? 'الشحن' : 'Frais de livraison'}</span>
                    <span>{formatPrice(order.shipping_cost * 1000, language)}</span>
                  </div>
                  <div className={cn('flex justify-between font-bold text-lg pt-2 border-t border-slate-100', isRTL && 'flex-row-reverse')}>
                    <span>{language === 'ar' ? 'المجموع الكلي' : 'Total'}</span>
                    <span className="text-red-600">{formatPrice(order.total * 1000, language)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Address + Actions */}
          <div className="space-y-5">

            {/* Delivery Address */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className={cn('flex items-center gap-2 mb-4', isRTL && 'flex-row-reverse')}>
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                  <LocationIcon className="w-4 h-4 text-red-600" />
                </div>
                <h2 className="font-bold text-slate-800">
                  {language === 'ar' ? 'عنوان التوصيل' : 'Adresse de livraison'}
                </h2>
              </div>

              <div className={cn('text-sm text-slate-600 space-y-1 leading-relaxed', isRTL && 'text-right')}>
                <p className="font-semibold text-slate-900">{order.shipping_address.full_name}</p>
                <p>{order.shipping_address.address_line_1}</p>
                {order.shipping_address.address_line_2 && (
                  <p>{order.shipping_address.address_line_2}</p>
                )}
                <p>{order.shipping_address.city}, {order.shipping_address.governorate}</p>
                <p className="font-medium text-slate-800 pt-1">{order.shipping_address.phone}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {/* Add Virement — wholesale only, proof not yet submitted */}
              {canAddVirement && (
                <Link to={`/order-bank-transfer/${order.order_number}`} className="block">
                  <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-all shadow-sm shadow-amber-200">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    {language === 'ar' ? 'إرفاق وصل التحويل' : 'Joindre le virement'}
                  </button>
                </Link>
              )}

              {/* Contact Support */}
              <a
                href="mailto:support@ghalinino.com"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all"
              >
                <SupportIcon className="w-4 h-4" />
                {language === 'ar' ? 'تواصل مع الدعم' : 'Contacter le support'}
              </a>

              {/* Cancel Order */}
              {canCancel && (
                <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50 transition-all">
                  <XCircleIcon className="w-4 h-4" />
                  {language === 'ar' ? 'إلغاء الطلب' : 'Annuler la commande'}
                </button>
              )}

              {/* Return Request */}
              {canReturn && (
                <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-amber-200 text-sm font-semibold text-amber-700 hover:bg-amber-50 transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                  </svg>
                  {language === 'ar' ? 'طلب إرجاع' : 'Demander un retour'}
                </button>
              )}
            </div>

            {/* Help note */}
            <p className={cn('text-xs text-slate-400 leading-relaxed', isRTL && 'text-right')}>
              {language === 'ar'
                ? 'لأي استفسار، نحن متاحون على البريد الإلكتروني أو الهاتف'
                : 'Pour toute question, nous sommes disponibles par email ou téléphone'}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Proof Modal */}
      {order.bank_transfer_proof_url && (
        <PaymentProofModal
          isOpen={showProofModal}
          onClose={() => setShowProofModal(false)}
          proofPath={order.bank_transfer_proof_url}
        />
      )}
    </AccountLayout>
  );
}