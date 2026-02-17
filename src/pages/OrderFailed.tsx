
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks';
import { Button } from '@/components/common';
import { cn } from '@/lib/utils';

export function OrderFailedPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { language, isRTL } = useLanguage();
  const navigate = useNavigate();

  const t = {
    title: { ar: 'فشلت عملية الدفع', fr: 'Échec du paiement' },
    subtitle: { ar: 'لم نتمكن من معالجة عملية الدفع الخاصة بك.', fr: 'Nous n\'avons pas pu traiter votre paiement.' },
    retry: { ar: 'حاول مجدداً', fr: 'Réessayer' },
    changeMethod: { ar: 'تغيير طريقة الدفع', fr: 'Changer le mode de paiement' },
    desc: { ar: 'يرجى التأكد من رصيدك أو المحاولة بطريقة أخرى.', fr: 'Veuillez vérifier votre solde ou essayer une autre méthode.' },
  };

  return (
    <div className={cn(
      'min-h-[60vh] flex flex-col items-center justify-center py-12 px-4 bg-slate-50',
      isRTL ? 'font-[Cairo]' : 'font-[Inter]'
    )}>
      <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-slate-900 mb-2 text-center">
        {t.title[language]}
      </h1>
      
      <p className="text-lg text-slate-600 mb-8 text-center">
        {t.subtitle[language]}
      </p>

      <p className="text-slate-500 text-center max-w-md mb-8">
        {t.desc[language]}
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* For now, just go back to cart or home as re-initiating payment for same order requires complex state management */}
        <Button size="lg" onClick={() => navigate('/checkout')}>
          {t.changeMethod[language]}
        </Button>
        <Link to={`/order-bank-transfer/${orderId}`}>
            {/* Fallback to bank transfer? No, just link to products */}
        </Link>
      </div>
    </div>
  );
}
