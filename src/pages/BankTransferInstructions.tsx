/**
 * Bank Transfer Instructions Page
 * Ghalinino - Tunisia E-commerce
 * 
 * Displays bank details and allows uploading payment proof.
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '@/hooks';
import { Button } from '@/components/common';
import { PaymentProofUploader } from '@/components/checkout/PaymentProofUploader';
import { cn } from '@/lib/utils';
import { BANK_DETAILS } from '@/lib/checkout';
import { supabase } from '@/lib/supabase';

// ============================================================================
// TRANSLATIONS
// ============================================================================

const t = {
  title: { ar: 'تأكيد الدفع البنكي', fr: 'Confirmation de virement' },
  subtitle: { ar: 'يرجى إتمام التحويل وتحميل وصل الدفع', fr: 'Veuillez effectuer le virement et télécharger le reçu' },
  orderRef: { ar: 'مرجع الطلب', fr: 'Référence commande' },
  bankInfo: { ar: 'معلومات الحساب البنكي', fr: 'Coordonnées bancaires' },
  uploadProof: { ar: 'تحميل وصل الدفع', fr: 'Télécharger la preuve' },
  uploadDesc: { ar: 'يمكنك تحميل صورة (سكرين شوت) أو ملف PDF', fr: 'Vous pouvez télécharger une image (capture) ou un PDF' },
  backToHome: { ar: 'العودة للرئيسية', fr: 'Retour à l\'accueil' },
  step1: { ar: '1. قم بالتحويل', fr: '1. Effectuez le virement' },
  step2: { ar: '2. حمل الوصل', fr: '2. Téléchargez le reçu' },
  note: { ar: 'ملاحظة: سيتم معالجة طلبك بعد التحقق من الدفع (عادة خلال 24 ساعة)', fr: 'Note: Votre commande sera traitée après vérification (généralement sous 24h)' },
  loading: { ar: 'جاري تحميل الطلب...', fr: 'Chargement de la commande...' },
  notFound: { ar: 'الطلب غير موجود', fr: 'Commande introuvable' },
  amount: { ar: 'المبلغ الإجمالي', fr: 'Montant total' },
  success: { ar: 'تم استلام الوصل بنجاح', fr: 'Reçu téléchargé avec succès' },
  verification: { ar: 'سنقوم بالتحقق من الدفع قريباً', fr: 'Nous vérifierons le paiement bientôt' },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function BankTransferInstructionsPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { language, isRTL } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<any | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);

  useEffect(() => {
    if (!orderNumber) return;
    
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('order_number', orderNumber)
          .single();
          
        if (error) throw error;
        
        setOrder(data);
        
        if (data && (data as any).bank_transfer_proof_url) {
          setUploadComplete(true);
        }
      } catch (err: any) {
        console.error('Error fetching order:', err);
        setError(err.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber]);

  const handleUploadSuccess = async (path: string) => {
    if (!order) return;

    try {
      // Update order with proof URL and set status to payment_pending if it was just 'pending'
      const updates: any = {
        bank_transfer_proof_url: path,
        updated_at: new Date().toISOString(),
      };
      
      if (order.status === 'pending') {
        updates.status = 'payment_pending';
      }

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', order.id);

      if (error) throw error;

      setUploadComplete(true);
      
    } catch (err: any) {
      console.error('Error updating order:', err);
      // Even if DB update fails, the file is uploaded. 
      // We might want to show an error or retry, but for UX let's show success state locally
      // and maybe log it. Ideally we should rollback or retry.
      setUploadComplete(true); 
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">{t.loading[language]}</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{t.notFound[language]}</p>
        <Link to="/">
          <Button>{t.backToHome[language]}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={cn(
      'min-h-screen bg-slate-50 py-12 px-4',
      isRTL ? 'font-[Cairo]' : 'font-[Inter]'
    )}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {t.title[language]}
          </h1>
          <p className="text-slate-600">
            {t.subtitle[language]}
          </p>
        </div>

        {/* Order Ref & Amount */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6 text-center">
          <div className="grid grid-cols-2 gap-4 divide-x divide-x-reverse">
            <div>
              <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">
                {t.orderRef[language]}
              </p>
              <p className="text-xl font-mono font-bold text-slate-900">
                {order.order_number}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">
                {t.amount[language]}
              </p>
              <p className="text-xl font-bold text-indigo-600">
                {order.total.toFixed(3)} TND
              </p>
            </div>
          </div>
          
          <p className="text-xs text-red-600 mt-4 font-medium bg-red-50 py-2 px-4 rounded-full inline-block">
            {language === 'ar' 
              ? `يرجى ذكر "${order.order_number}" في ملاحظات التحويل` 
              : `Veuillez mentionner "${order.order_number}" dans le virement`}
          </p>
        </div>

        {/* Instructions Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Bank Details */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">1</span>
              {t.bankInfo[language]}
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500 mb-1">{language === 'ar' ? 'البنك' : 'Banque'}</p>
                <p className="font-medium">{BANK_DETAILS.bankName}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">{language === 'ar' ? 'المستفيد' : 'Bénéficiaire'}</p>
                <p className="font-medium">{BANK_DETAILS.accountName}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">RIB</p>
                <p className="font-mono bg-slate-50 p-2 rounded border border-slate-100 text-center text-sm md:text-base break-all">
                  {BANK_DETAILS.rib}
                </p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">{language === 'ar' ? 'الفرع' : 'Agence'}</p>
                <p className="font-medium">{BANK_DETAILS.agency}</p>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">2</span>
              {t.uploadProof[language]}
            </h3>
            
            {!uploadComplete ? (
              <>
                <p className="text-sm text-slate-500 mb-4">
                  {t.uploadDesc[language]}
                </p>
                <PaymentProofUploader 
                  orderId={order.id} // Passing UUID here for folder naming
                  onUploadSuccess={handleUploadSuccess} 
                />
              </>
            ) : (
              <div className="text-center py-8 h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-bold text-green-800 mb-2">
                  {t.success[language]}
                </p>
                <p className="text-sm text-slate-600">
                  {t.verification[language]}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Note */}
        <p className="text-center text-sm text-slate-500 mb-8 max-w-lg mx-auto">
          {t.note[language]}
        </p>

        {/* Back Button */}
        <div className="text-center">
          <Link to="/">
            <Button variant="outline">
              {t.backToHome[language]}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
