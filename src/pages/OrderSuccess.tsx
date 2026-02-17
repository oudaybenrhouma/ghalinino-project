import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '@/hooks';
import { Button } from '@/components/common';
import { cn } from '@/lib/utils';

export function OrderSuccessPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { language, isRTL } = useLanguage();

  const t = {
    title: { ar: 'شكراً لطلبك!', fr: 'Merci pour votre commande !' },
    subtitle: { ar: 'تم استلام طلبك بنجاح', fr: 'Votre commande a été reçue avec succès' },
    orderNum: { ar: 'رقم الطلب:', fr: 'Numéro de commande :' },
    desc: { ar: 'سنقوم بمعالجة طلبك وإعلامك عند شحنه.', fr: 'Nous traiterons votre commande et vous informerons lors de l\'expédition.' },
    emailConf: { ar: 'تم إرسال رسالة تأكيد إلى بريدك الإلكتروني.', fr: 'Un email de confirmation a été envoyé à votre adresse.' },
    continue: { ar: 'متابعة التسوق', fr: 'Continuer vos achats' },
    viewOrder: { ar: 'تتبع الطلب', fr: 'Suivre la commande' },
  };

  return (
    <div className={cn(
      'min-h-[60vh] flex flex-col items-center justify-center py-12 px-4 bg-slate-50',
      isRTL ? 'font-[Cairo]' : 'font-[Inter]'
    )}>
      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-slate-900 mb-2 text-center">
        {t.title[language]}
      </h1>
      
      <p className="text-lg text-slate-600 mb-8 text-center">
        {t.subtitle[language]}
      </p>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 w-full max-w-md text-center">
        <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">
          {t.orderNum[language]}
        </p>
        <p className="text-2xl font-mono font-bold text-slate-900">
          {orderId}
        </p>
      </div>

      <p className="text-slate-500 text-center max-w-md mb-8">
        {t.desc[language]}
        <br />
        {t.emailConf[language]}
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link to="/products">
          <Button size="lg">
            {t.continue[language]}
          </Button>
        </Link>
        {/* Future: Link to order details page */}
        {/* <Link to={`/account/orders/${orderId}`}>
          <Button variant="outline" size="lg">
            {t.viewOrder[language]}
          </Button>
        </Link> */}
      </div>
    </div>
  );
}
