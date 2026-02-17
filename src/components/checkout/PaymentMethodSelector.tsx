/**
 * Payment Method Selector
 * Ghalinino - Tunisia E-commerce
 * 
 * Radio button selection for payment methods with descriptions.
 */

import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks';
import { PAYMENT_METHODS, BANK_DETAILS, type PaymentMethodType } from '@/lib/checkout';
import { Button } from '@/components/common';

// ============================================================================
// TYPES
// ============================================================================

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethodType | null;
  onSelect: (method: PaymentMethodType) => void;
  onSubmit: () => void;
  onBack?: () => void;
  isLoading?: boolean;
}

// ============================================================================
// TRANSLATIONS
// ============================================================================

const t = {
  title: { ar: 'طريقة الدفع', fr: 'Mode de paiement' },
  selectMethod: { ar: 'اختر طريقة الدفع', fr: 'Choisissez votre mode de paiement' },
  continue: { ar: 'متابعة', fr: 'Continuer' },
  back: { ar: 'رجوع', fr: 'Retour' },
  fee: { ar: 'رسوم إضافية', fr: 'Frais supplémentaires' },
  noFee: { ar: 'بدون رسوم', fr: 'Sans frais' },
  bankDetails: { ar: 'تفاصيل الحساب البنكي', fr: 'Détails du compte bancaire' },
  bankNote: { ar: 'ستظهر التفاصيل الكاملة بعد تأكيد الطلب', fr: 'Les détails complets seront affichés après confirmation' },
  codNote: { ar: 'يرجى تحضير المبلغ المحدد عند الاستلام', fr: 'Veuillez préparer le montant exact à la livraison' },
  flouciNote: { ar: 'سيتم تحويلك إلى صفحة الدفع الآمنة', fr: 'Vous serez redirigé vers la page de paiement sécurisée' },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function PaymentMethodSelector({
  selectedMethod,
  onSelect,
  onSubmit,
  onBack,
  isLoading = false,
}: PaymentMethodSelectorProps) {
  const { language, isRTL } = useLanguage();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        {t.title[language]}
      </h2>
      <p className="text-slate-600 mb-6">{t.selectMethod[language]}</p>

      {/* Payment Methods */}
      <div className="space-y-4">
        {PAYMENT_METHODS.map((method) => {
          const isSelected = selectedMethod === method.id;
          const name = language === 'ar' ? method.nameAr : method.nameFr;
          const description = language === 'ar' ? method.descriptionAr : method.descriptionFr;

          return (
            <div key={method.id}>
              <label
                className={cn(
                  'flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer',
                  'transition-all duration-200',
                  isSelected
                    ? 'border-red-600 bg-red-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                {/* Radio */}
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.id}
                  checked={isSelected}
                  onChange={() => onSelect(method.id)}
                  className="mt-1 text-red-600 focus:ring-red-500"
                />

                {/* Icon */}
                <div className={cn(
                  'shrink-0 w-12 h-12 rounded-lg flex items-center justify-center',
                  isSelected ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'
                )}>
                  <PaymentIcon icon={method.icon} />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={cn(
                      'font-semibold',
                      isSelected ? 'text-red-900' : 'text-slate-900'
                    )}>
                      {name}
                    </h3>
                    {method.additionalFee > 0 ? (
                      <span className="text-sm text-amber-600 font-medium">
                        +{method.additionalFee} TND
                      </span>
                    ) : (
                      <span className="text-sm text-green-600 font-medium">
                        {t.noFee[language]}
                      </span>
                    )}
                  </div>
                  <p className={cn(
                    'text-sm',
                    isSelected ? 'text-red-700' : 'text-slate-600'
                  )}>
                    {description}
                  </p>
                </div>
              </label>

              {/* Extra info when selected */}
              {isSelected && (
                <div className="mt-3 ml-6 mr-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  {method.id === 'cod' && (
                    <div className="flex items-start gap-3 text-slate-700">
                      <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm">{t.codNote[language]}</p>
                    </div>
                  )}

                  {method.id === 'bank_transfer' && (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 text-slate-700">
                        <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium">{t.bankDetails[language]}</p>
                          <p className="text-sm text-slate-500">{t.bankNote[language]}</p>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-white rounded border border-slate-200 text-sm space-y-1">
                        <p><span className="text-slate-500">{language === 'ar' ? 'البنك:' : 'Banque:'}</span> {BANK_DETAILS.bankName}</p>
                        <p><span className="text-slate-500">{language === 'ar' ? 'صاحب الحساب:' : 'Titulaire:'}</span> {BANK_DETAILS.accountName}</p>
                        <p className="font-mono text-slate-500">RIB: ••••••••••••••••••••</p>
                      </div>
                    </div>
                  )}

                  {method.id === 'flouci' && (
                    <div className="flex items-start gap-3 text-slate-700">
                      <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <p className="text-sm">{t.flouciNote[language]}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className={cn('flex gap-4 pt-6 mt-6 border-t', isRTL && 'flex-row-reverse')}>
        {onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-shrink-0"
          >
            {t.back[language]}
          </Button>
        )}
        <Button
          onClick={onSubmit}
          fullWidth
          size="lg"
          isLoading={isLoading}
          disabled={!selectedMethod}
          rightIcon={
            <svg className={cn('w-5 h-5', isRTL && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          }
        >
          {t.continue[language]}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// PAYMENT ICON
// ============================================================================

function PaymentIcon({ icon }: { icon: string }) {
  switch (icon) {
    case 'cash':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case 'bank':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    case 'card':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      );
    default:
      return <span>💳</span>;
  }
}
