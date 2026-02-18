/**
 * Wholesale Application Status Page
 * Ghalinino - Tunisia E-commerce
 *
 * Shows users the current state of their wholesale application:
 * - pending:  waiting for admin review
 * - approved: active wholesale account, shows benefits
 * - rejected: shows reason, option to re-apply
 * - none:     prompt to apply
 */

import { Link } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks';
import { AccountLayout } from '@/components/layout';
import { Button } from '@/components/common';
import { cn } from '@/lib/utils';
import { getWholesaleStatusMessage } from '@/lib/wholesaleValidation';

// ============================================================================
// TRANSLATIONS
// ============================================================================

const t = {
  pageTitle: { ar: 'حساب تاجر الجملة', fr: 'Compte Grossiste' },

  // pending state
  pendingTitle: { ar: 'طلبك قيد المراجعة', fr: 'Demande en cours d\'examen' },
  pendingDesc: {
    ar: 'سنراجع طلبك خلال 24–48 ساعة وسيصلك بريد إلكتروني عند البت فيه.',
    fr: 'Nous examinerons votre demande sous 24–48h. Un email vous sera envoyé dès la décision.',
  },
  pendingSteps: {
    ar: ['تم استلام طلبك', 'مراجعة الوثائق', 'القرار النهائي'],
    fr: ['Demande reçue', 'Vérification des documents', 'Décision finale'],
  },

  // approved state
  approvedTitle: { ar: 'حساب الجملة مفعّل 🎉', fr: 'Compte grossiste actif 🎉' },
  approvedDesc: {
    ar: 'تهانينا! يمكنك الآن الاستفادة من أسعار الجملة الحصرية.',
    fr: 'Félicitations ! Vous bénéficiez désormais des prix de gros exclusifs.',
  },
  benefits: {
    prices: { ar: 'أسعار الجملة مخفضة على جميع المنتجات', fr: 'Prix de gros sur tous les produits' },
    minimums: { ar: 'حد أدنى للطلب: 100 دينار', fr: 'Commande minimum : 100 DT' },
    shipping: { ar: 'شحن مجاني عند تجاوز 500 دينار', fr: 'Livraison gratuite dès 500 DT' },
    support: { ar: 'دعم مخصص وأولوية في التوصيل', fr: 'Support dédié et livraison prioritaire' },
  },
  shopNow: { ar: 'تسوق بأسعار الجملة', fr: 'Acheter au prix de gros' },
  discountTier: { ar: 'مستوى الخصم', fr: 'Niveau de remise' },

  // rejected state
  rejectedTitle: { ar: 'تم رفض طلبك', fr: 'Demande refusée' },
  rejectedDesc: {
    ar: 'للأسف لم يتم قبول طلبك. يمكنك تقديم طلب جديد مع تصحيح المعلومات المطلوبة.',
    fr: 'Votre demande n\'a pas été acceptée. Vous pouvez en soumettre une nouvelle.',
  },
  rejectionReason: { ar: 'سبب الرفض:', fr: 'Raison du refus :' },
  reApply: { ar: 'تقديم طلب جديد', fr: 'Soumettre une nouvelle demande' },

  // none state
  noneTitle: { ar: 'هل أنت تاجر؟', fr: 'Vous êtes commerçant ?' },
  noneDesc: {
    ar: 'سجّل كتاجر جملة واحصل على أسعار حصرية تصل إلى 40% أقل.',
    fr: 'Inscrivez-vous comme grossiste et profitez de prix exclusifs jusqu\'à 40% moins chers.',
  },
  applyNow: { ar: 'تقدم بطلب الآن', fr: 'Faire une demande' },

  // business info
  businessInfo: { ar: 'معلومات الشركة', fr: 'Informations de l\'entreprise' },
  businessName: { ar: 'اسم الشركة', fr: 'Nom de l\'entreprise' },
  businessTaxId: { ar: 'المعرف الجبائي', fr: 'Matricule fiscal' },
  businessAddress: { ar: 'العنوان', fr: 'Adresse' },
  businessPhone: { ar: 'هاتف الشركة', fr: 'Téléphone' },
  appliedOn: { ar: 'تاريخ التقديم', fr: 'Date de la demande' },
  approvedOn: { ar: 'تاريخ الموافقة', fr: 'Date d\'approbation' },
  documents: { ar: 'الوثائق المرفقة', fr: 'Documents joints' },
  viewDocument: { ar: 'عرض الوثيقة', fr: 'Voir le document' },
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function StatusBadge({ status, language }: { status: string; language: 'ar' | 'fr' }) {
  const styles = {
    pending:  'bg-amber-100 text-amber-800 border border-amber-200',
    approved: 'bg-green-100 text-green-800 border border-green-200',
    rejected: 'bg-red-100 text-red-800 border border-red-200',
    none:     'bg-slate-100 text-slate-600 border border-slate-200',
  }[status] ?? 'bg-slate-100 text-slate-600';

  return (
    <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-sm font-medium', styles)}>
      {getWholesaleStatusMessage(status, language)}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4">
      <span className="text-sm font-medium text-slate-500 sm:w-40 shrink-0">{label}</span>
      <span className="text-sm text-slate-900">{value}</span>
    </div>
  );
}

// ============================================================================
// PENDING STATE
// ============================================================================

function PendingState({ user, language }: { user: any; language: 'ar' | 'fr' }) {
  const steps = t.pendingSteps[language];

  return (
    <div className="space-y-6">
      {/* Status indicator */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-amber-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-amber-900 mb-1">{t.pendingTitle[language]}</h2>
            <p className="text-amber-700 text-sm">{t.pendingDesc[language]}</p>
          </div>
        </div>

        {/* Progress steps */}
        <div className="mt-6 flex items-center gap-2">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                i === 0 ? 'bg-amber-500 text-white' : 'bg-amber-200 text-amber-600'
              )}>
                {i === 0
                  ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  : i + 1
                }
              </div>
              <span className={cn(
                'text-xs font-medium hidden sm:inline',
                i === 0 ? 'text-amber-800' : 'text-amber-500'
              )}>{step}</span>
              {i < steps.length - 1 && (
                <div className={cn('flex-1 h-0.5', i === 0 ? 'bg-amber-300' : 'bg-amber-200')} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Business info submitted */}
      {user?.businessName && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <h3 className="font-semibold text-slate-900">{t.businessInfo[language]}</h3>
          <div className="space-y-2">
            <InfoRow label={t.businessName[language]} value={user.businessName} />
            <InfoRow label={t.businessTaxId[language]} value={user.businessTaxId} />
            <InfoRow label={t.businessAddress[language]} value={user.businessAddress} />
            <InfoRow label={t.businessPhone[language]} value={user.businessPhone} />
            {user.wholesaleAppliedAt && (
              <InfoRow
                label={t.appliedOn[language]}
                value={new Date(user.wholesaleAppliedAt).toLocaleDateString(
                  language === 'ar' ? 'ar-TN' : 'fr-TN'
                )}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// APPROVED STATE
// ============================================================================

function ApprovedState({ user, language }: { user: any; language: 'ar' | 'fr' }) {
  const tier = user?.wholesaleDiscountTier ?? 1;

  return (
    <div className="space-y-6">
      {/* Success banner */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-green-900 mb-1">{t.approvedTitle[language]}</h2>
            <p className="text-green-700 text-sm mb-4">{t.approvedDesc[language]}</p>
            <Link to="/products">
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                {t.shopNow[language]}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Discount tier + benefits */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">{t.discountTier[language]}</h3>
          <div className="flex gap-1">
            {[1, 2, 3].map((t) => (
              <div key={t} className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                t <= tier ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400'
              )}>{t}</div>
            ))}
          </div>
        </div>

        <ul className="space-y-3">
          {[
            t.benefits.prices[language],
            t.benefits.minimums[language],
            t.benefits.shipping[language],
            t.benefits.support[language],
          ].map((benefit, i) => (
            <li key={i} className="flex items-center gap-3 text-sm text-slate-700">
              <svg className="w-5 h-5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      {/* Business info */}
      {user?.businessName && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <h3 className="font-semibold text-slate-900">{t.businessInfo[language]}</h3>
          <div className="space-y-2">
            <InfoRow label={t.businessName[language]} value={user.businessName} />
            <InfoRow label={t.businessTaxId[language]} value={user.businessTaxId} />
            {user.wholesaleApprovedAt && (
              <InfoRow
                label={t.approvedOn[language]}
                value={new Date(user.wholesaleApprovedAt).toLocaleDateString(
                  language === 'ar' ? 'ar-TN' : 'fr-TN'
                )}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// REJECTED STATE
// ============================================================================

function RejectedState({ user, language }: { user: any; language: 'ar' | 'fr' }) {
  return (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-red-900 mb-1">{t.rejectedTitle[language]}</h2>
            <p className="text-red-700 text-sm mb-3">{t.rejectedDesc[language]}</p>
            {user?.wholesaleRejectionReason && (
              <div className="bg-white rounded-lg p-3 border border-red-200">
                <p className="text-xs font-medium text-red-700 mb-1">{t.rejectionReason[language]}</p>
                <p className="text-sm text-slate-800">{user.wholesaleRejectionReason}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Link to="/register/wholesale">
        <Button fullWidth size="lg" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
          {t.reApply[language]}
        </Button>
      </Link>
    </div>
  );
}

// ============================================================================
// NONE STATE (no application)
// ============================================================================

function NoneState({ language }: { language: 'ar' | 'fr' }) {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-red-900 rounded-2xl p-8 text-white text-center">
      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <h2 className="text-xl font-bold mb-2">{t.noneTitle[language]}</h2>
      <p className="text-white/70 text-sm mb-6">{t.noneDesc[language]}</p>
      <Link to="/register/wholesale">
        <Button className="bg-white text-slate-900 hover:bg-slate-100">
          {t.applyNow[language]}
        </Button>
      </Link>
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export function WholesaleStatusPage() {
  const { user } = useAuthContext();
  const { language, isRTL } = useLanguage();

  const status = user?.wholesaleStatus ?? 'none';

  return (
    <AccountLayout>
      <div className={cn('max-w-2xl mx-auto px-4 py-8', isRTL && 'font-[Cairo]')}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            {t.pageTitle[language]}
          </h1>
          <StatusBadge status={status} language={language} />
        </div>

        {/* Content by status */}
        {status === 'pending'  && <PendingState  user={user} language={language} />}
        {status === 'approved' && <ApprovedState user={user} language={language} />}
        {status === 'rejected' && <RejectedState user={user} language={language} />}
        {status === 'none'     && <NoneState language={language} />}
      </div>
    </AccountLayout>
  );
}