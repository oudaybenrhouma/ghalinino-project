/**
 * Bank Transfer Instructions Page — Redesigned
 * Step-by-step visual guide, copy bank details, urgency timer, prominent upload
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '@/hooks';
import { Button } from '@/components/common';
import { PaymentProofUploader } from '@/components/checkout/PaymentProofUploader';
import { cn } from '@/lib/utils';
import { BANK_DETAILS } from '@/lib/checkout';
import { supabase, ordersWrite } from '@/lib/supabase';

// Explicit type so Supabase's inferred `never` doesn't propagate
interface OrderRow {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  bank_transfer_proof_url?: string | null;
  [key: string]: unknown;
}

// ─── Translations ─────────────────────────────────────────────────────────────

const t = {
  title:         { ar: 'تأكيد التحويل البنكي', fr: 'Confirmation du virement' },
  subtitle:      { ar: 'أتمم التحويل وأرسل وصل الدفع لتأكيد طلبك', fr: 'Effectuez le virement puis envoyez votre reçu pour confirmer votre commande' },
  orderRef:      { ar: 'رقم الطلب', fr: 'Référence' },
  amount:        { ar: 'المبلغ', fr: 'Montant' },
  step1Title:    { ar: 'أولاً: قم بالتحويل البنكي', fr: 'Étape 1 : Effectuez le virement' },
  step1Desc:     { ar: 'استخدم المعلومات أدناه لإتمام التحويل من حسابك البنكي', fr: 'Utilisez les informations ci-dessous pour effectuer le virement depuis votre banque' },
  step2Title:    { ar: 'ثانياً: أرفق وصل الدفع', fr: 'Étape 2 : Joignez le reçu' },
  step2Desc:     { ar: 'بعد إتمام التحويل، قم بتحميل صورة أو PDF لوصل الدفع', fr: 'Après le virement, téléchargez une capture d\'écran ou un PDF de votre reçu' },
  bank:          { ar: 'البنك', fr: 'Banque' },
  beneficiary:   { ar: 'المستفيد', fr: 'Bénéficiaire' },
  agency:        { ar: 'الفرع', fr: 'Agence' },
  rib:           { ar: 'الـ RIB', fr: 'RIB' },
  copy:          { ar: 'نسخ', fr: 'Copier' },
  copied:        { ar: 'تم النسخ!', fr: 'Copié !' },
  mention:       { ar: 'يجب ذكر رقم الطلب في خانة الملاحظات', fr: 'Mentionnez la référence dans le motif du virement' },
  urgencyLabel:  { ar: 'احتجز طلبك لـ', fr: 'Votre commande est réservée pour' },
  loading:       { ar: 'جاري التحميل...', fr: 'Chargement...' },
  notFound:      { ar: 'الطلب غير موجود', fr: 'Commande introuvable' },
  backHome:      { ar: 'العودة للرئيسية', fr: 'Retour à l\'accueil' },
  successTitle:  { ar: 'تم استلام وصل الدفع!', fr: 'Reçu bien reçu !' },
  successDesc:   { ar: 'سنقوم بالتحقق وتأكيد طلبك خلال 24 ساعة. شكراً لثقتك بغالينينو 🎉', fr: 'Nous vérifierons et confirmerons votre commande sous 24h. Merci pour votre confiance 🎉' },
  viewOrders:    { ar: 'متابعة طلباتي', fr: 'Voir mes commandes' },
  faqTitle:      { ar: 'أسئلة شائعة', fr: 'Questions fréquentes' },
  contactHelp:   { ar: 'هل تحتاج مساعدة؟', fr: 'Besoin d\'aide ?' },
  contactDesc:   { ar: 'تواصل معنا عبر البريد أو الهاتف', fr: 'Contactez-nous par email ou téléphone' },
  contactBtn:    { ar: 'تواصل معنا', fr: 'Nous contacter' },
};

const FAQ: { q: { ar: string; fr: string }; a: { ar: string; fr: string } }[] = [
  {
    q: { ar: 'متى يُعالَج طلبي؟', fr: 'Quand ma commande sera-t-elle traitée ?' },
    a: { ar: 'بعد التحقق من وصل الدفع، عادةً خلال 24 ساعة من الأيام العملية.', fr: 'Après vérification de votre reçu, généralement sous 24h ouvrables.' },
  },
  {
    q: { ar: 'ماذا أكتب في خانة الملاحظات؟', fr: 'Que mettre dans le motif du virement ?' },
    a: { ar: 'اكتب رقم طلبك بالكامل حتى نتمكن من ربط الدفع بطلبك.', fr: 'Indiquez votre numéro de commande complet pour que nous puissions relier le paiement.' },
  },
  {
    q: { ar: 'هل يمكنني رفع الوصل لاحقاً؟', fr: 'Puis-je envoyer le reçu plus tard ?' },
    a: { ar: 'نعم، يمكنك العودة لهذه الصفحة في أي وقت برابطها لرفع الوصل.', fr: 'Oui, vous pouvez revenir sur cette page avec le lien reçu par email.' },
  },
];

// ─── Icons ────────────────────────────────────────────────────────────────────

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ChevronIcon({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg className={cn('w-4 h-4 transition-transform', open && 'rotate-180', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ text, language }: { text: string; language: 'ar' | 'fr' }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  return (
    <button
      onClick={handleCopy}
      className={cn(
        'flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all',
        copied
          ? 'bg-green-100 text-green-700'
          : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600'
      )}
    >
      {copied
        ? <><CheckIcon className="w-3 h-3" />{t.copied[language]}</>
        : <><CopyIcon className="w-3 h-3" />{t.copy[language]}</>
      }
    </button>
  );
}

// ─── Countdown Timer ──────────────────────────────────────────────────────────

function CountdownTimer({ language, createdAt }: { language: 'ar' | 'fr'; createdAt?: string }) {
  const HOLD_HOURS = 48;
  const getRemaining = useCallback(() => {
    const base = createdAt ? new Date(createdAt).getTime() : Date.now();
    const deadline = base + HOLD_HOURS * 60 * 60 * 1000;
    return Math.max(0, deadline - Date.now());
  }, [createdAt]);

  const [remaining, setRemaining] = useState(getRemaining);

  useEffect(() => {
    const iv = setInterval(() => setRemaining(getRemaining()), 1000);
    return () => clearInterval(iv);
  }, [getRemaining]);

  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  const isUrgent = hours < 6;

  return (
    <div className={cn(
      'flex items-center gap-3 p-3.5 rounded-xl border text-sm',
      isUrgent
        ? 'bg-red-50 border-red-200 text-red-700'
        : 'bg-amber-50 border-amber-200 text-amber-700'
    )}>
      <ClockIcon className="w-4 h-4 flex-shrink-0" />
      <span className="font-medium">{t.urgencyLabel[language]}</span>
      <span className="font-mono font-bold text-base ml-auto tabular-nums">
        {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}

// ─── Bank Detail Row ──────────────────────────────────────────────────────────

function BankRow({ label, value, mono = false, copyable = false, language }: {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
  language: 'ar' | 'fr';
}) {
  const isRTL = language === 'ar';
  return (
    <div className={cn('flex items-center justify-between gap-3 py-2.5 border-b border-slate-100 last:border-0', isRTL && 'flex-row-reverse')}>
      <span className="text-xs text-slate-500 flex-shrink-0">{label}</span>
      <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
        <span className={cn('font-medium text-sm text-slate-800', mono && 'font-mono')}>{value}</span>
        {copyable && <CopyButton text={value} language={language} />}
      </div>
    </div>
  );
}

// ─── FAQ Accordion ────────────────────────────────────────────────────────────

function FAQSection({ language }: { language: 'ar' | 'fr' }) {
  const [open, setOpen] = useState<number | null>(null);
  const isRTL = language === 'ar';
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className={cn('px-5 py-4 border-b border-slate-100', isRTL && 'text-right')}>
        <h3 className="font-bold text-slate-800">{t.faqTitle[language]}</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {FAQ.map((item, i) => (
          <div key={i}>
            <button
              className={cn(
                'w-full flex items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors',
                isRTL && 'flex-row-reverse'
              )}
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span className={isRTL ? 'text-right' : 'text-left'}>{item.q[language]}</span>
              <ChevronIcon open={open === i} className="flex-shrink-0 text-slate-400" />
            </button>
            {open === i && (
              <div className={cn('px-5 pb-4 text-sm text-slate-600 leading-relaxed', isRTL && 'text-right')}>
                {item.a[language]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Success State ────────────────────────────────────────────────────────────

function SuccessState({ language }: { language: 'ar' | 'fr' }) {
  const isRTL = language === 'ar';
  return (
    <div className="flex flex-col items-center text-center py-12 px-6">
      <div className="relative mb-6">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200">
            <CheckIcon className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="absolute -top-1 -right-1 text-2xl animate-bounce">🎉</div>
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-3">{t.successTitle[language]}</h2>
      <p className="text-slate-600 text-sm leading-relaxed max-w-sm mb-8">{t.successDesc[language]}</p>
      <Link to="/account/orders">
        <Button className="bg-red-600 hover:bg-red-700 text-white rounded-full px-8 py-2.5 font-semibold shadow-md shadow-red-200">
          {t.viewOrders[language]}
        </Button>
      </Link>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BankTransferInstructionsPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { language, isRTL } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);

  useEffect(() => {
    if (!orderNumber) return;
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('orders').select('*').eq('order_number', orderNumber).single();
        if (error) throw error;
        const row = data as unknown as OrderRow;
        setOrder(row);
        if (row?.bank_transfer_proof_url) setUploadComplete(true);
      } catch (err: any) {
        setError(err.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderNumber]);

  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUploadSuccess = async (path: string) => {
    if (!order) return;
    setUploadError(null);
    try {
      // Only update the proof URL — do NOT touch status.
      // The order_status enum has no 'payment_pending' value.
      // Admin will review the proof and manually advance the status to 'paid'.
      // RLS policy "orders_update_proof_own" (migration 007) permits this update.
      const { error: updateError } = await ordersWrite()
        .update({
          bank_transfer_proof_url: path,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Reflect in local state immediately — don't wait for a refetch
      setOrder((prev) =>
        prev ? { ...prev, bank_transfer_proof_url: path } : prev
      );
      setUploadComplete(true);
    } catch (err: any) {
      console.error('Bank transfer proof save failed:', err);
      setUploadError(
        language === 'ar'
          ? 'حدث خطأ أثناء الحفظ. تأكد من تسجيل الدخول وحاول مجدداً.'
          : 'Erreur lors de la sauvegarde. Vérifiez votre connexion et réessayez.'
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <p className="text-red-500 mb-6 font-medium">{t.notFound[language]}</p>
        <Link to="/"><Button>{t.backHome[language]}</Button></Link>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-slate-50', isRTL ? 'font-[Cairo]' : 'font-[Inter]')} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-red-900 text-white py-10 px-4">
        <div className="max-w-xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20 mb-4">
            💳 {language === 'ar' ? 'تحويل بنكي آمن' : 'Virement bancaire sécurisé'}
          </div>
          <h1 className="text-2xl font-bold mb-2">{t.title[language]}</h1>
          <p className="text-slate-300 text-sm">{t.subtitle[language]}</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8 space-y-5">

        {/* Order Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-slate-100">
            <div className={cn('p-5', isRTL && 'text-right')}>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">{t.orderRef[language]}</p>
              <p className="font-mono font-bold text-slate-900 text-lg">{order.order_number}</p>
            </div>
            <div className={cn('p-5', isRTL ? 'text-left' : 'text-right')}>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">{t.amount[language]}</p>
              <p className="font-bold text-red-600 text-lg">{order.total?.toFixed(3)} TND</p>
            </div>
          </div>

          {/* Mention reminder */}
          <div className={cn('mx-4 mb-4 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 text-xs', isRTL && 'flex-row-reverse')}>
            <span className="text-base flex-shrink-0">⚠️</span>
            <span>
              <strong className="font-semibold">{t.mention[language]}</strong>
              {' — '}<span className="font-mono font-bold">{order.order_number}</span>
            </span>
          </div>
        </div>

        {/* Countdown Timer */}
        <CountdownTimer language={language} createdAt={order.created_at} />

        {/* Step 1: Bank Details */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className={cn('flex items-start gap-3 p-5 border-b border-slate-100', isRTL && 'flex-row-reverse')}>
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm shadow-red-200">
              1
            </div>
            <div className={isRTL ? 'text-right' : ''}>
              <h2 className="font-bold text-slate-900">{t.step1Title[language]}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{t.step1Desc[language]}</p>
            </div>
          </div>

          <div className="p-5 space-y-0">
            <BankRow label={t.bank[language]} value={BANK_DETAILS.bankName} language={language} />
            <BankRow label={t.beneficiary[language]} value={BANK_DETAILS.accountName} copyable language={language} />
            <BankRow label="RIB" value={BANK_DETAILS.rib} mono copyable language={language} />
            <BankRow label={t.agency[language]} value={BANK_DETAILS.agency} language={language} />
          </div>

          {/* Copy All Button */}
          <div className="px-5 pb-5">
            <CopyButton
              text={`${t.beneficiary[language]}: ${BANK_DETAILS.accountName}\nRIB: ${BANK_DETAILS.rib}\n${t.bank[language]}: ${BANK_DETAILS.bankName}`}
              language={language}
            />
          </div>
        </div>

        {/* Step 2: Upload Proof */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className={cn('flex items-start gap-3 p-5 border-b border-slate-100', isRTL && 'flex-row-reverse')}>
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm',
              uploadComplete
                ? 'bg-green-500 text-white shadow-green-200'
                : 'bg-red-600 text-white shadow-red-200'
            )}>
              {uploadComplete ? <CheckIcon className="w-4 h-4" /> : '2'}
            </div>
            <div className={isRTL ? 'text-right' : ''}>
              <h2 className="font-bold text-slate-900">{t.step2Title[language]}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{t.step2Desc[language]}</p>
            </div>
          </div>

          <div className="p-5">
            {uploadComplete ? (
              <SuccessState language={language} />
            ) : (
              <>
                {uploadError && (
                  <div className="mb-4 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-xs">
                    <span className="text-base flex-shrink-0">⚠️</span>
                    <span>{uploadError}</span>
                  </div>
                )}
                <PaymentProofUploader
                  orderId={order.id}
                  onUploadSuccess={handleUploadSuccess}
                />
              </>
            )}
          </div>
        </div>

        {/* FAQ */}
        <FAQSection language={language} />

        {/* Contact Support */}
        <div className={cn('bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center justify-between gap-4', isRTL && 'flex-row-reverse')}>
          <div className={isRTL ? 'text-right' : ''}>
            <p className="font-semibold text-slate-800 text-sm">{t.contactHelp[language]}</p>
            <p className="text-xs text-slate-500 mt-0.5">{t.contactDesc[language]}</p>
          </div>
          <a href="mailto:support@ghalinino.com" className="flex-shrink-0">
            <Button variant="outline" className="text-sm rounded-xl px-4 py-2">
              {t.contactBtn[language]}
            </Button>
          </a>
        </div>

        {/* Back to home */}
        <div className="text-center pb-4">
          <Link to="/" className="text-sm text-slate-400 hover:text-red-600 transition-colors">
            {t.backHome[language]}
          </Link>
        </div>
      </div>
    </div>
  );
}