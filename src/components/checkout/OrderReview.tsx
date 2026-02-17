/**
 * Order Review Component
 * Ghalinino - Tunisia E-commerce
 * 
 * Final step showing all order details before placing.
 */

import { cn, formatPrice } from '@/lib/utils';
import { useLanguage } from '@/hooks';
import { useCartContext } from '@/contexts/CartContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { formatPhone, type ShippingAddress, type PaymentMethodType, type CheckoutTotals } from '@/lib/checkout';
import { Button } from '@/components/common';

// ============================================================================
// TYPES
// ============================================================================

interface OrderReviewProps {
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethodType;
  totals: CheckoutTotals;
  onPlaceOrder: () => void;
  onBack?: () => void;
  onEditShipping?: () => void;
  onEditPayment?: () => void;
  isLoading?: boolean;
  /** When false, the Place Order button is disabled and a warning banner is shown */
  wholesaleMinimumMet?: boolean;
  /** Amount still needed to reach the wholesale minimum, in TND */
  wholesaleAmountShort?: number;
}

// ============================================================================
// TRANSLATIONS
// ============================================================================

const t = {
  title: { ar: 'مراجعة الطلب', fr: 'Vérifier la commande' },
  subtitle: { ar: 'تأكد من صحة المعلومات قبل تأكيد الطلب', fr: 'Vérifiez les informations avant de confirmer' },
  shippingAddress: { ar: 'عنوان التوصيل', fr: 'Adresse de livraison' },
  paymentMethod: { ar: 'طريقة الدفع', fr: 'Mode de paiement' },
  orderItems: { ar: 'المنتجات', fr: 'Articles' },
  edit: { ar: 'تعديل', fr: 'Modifier' },
  placeOrder: { ar: 'تأكيد الطلب', fr: 'Confirmer la commande' },
  placingOrder: { ar: 'جاري تأكيد الطلب...', fr: 'Confirmation en cours...' },
  back: { ar: 'رجوع', fr: 'Retour' },
  paymentMethods: {
    cod: { ar: 'الدفع عند الاستلام', fr: 'Paiement à la livraison' },
    bank_transfer: { ar: 'التحويل البنكي', fr: 'Virement bancaire' },
    flouci: { ar: 'فلوسي', fr: 'Flouci' },
  },
  bankTransferNote: { ar: 'ستتلقى تفاصيل الحساب البنكي بعد تأكيد الطلب', fr: 'Vous recevrez les détails bancaires après confirmation' },
  codNote: { ar: 'سيتم تحصيل المبلغ عند الاستلام', fr: 'Le montant sera collecté à la livraison' },
  flouciNote: { ar: 'سيتم تحويلك لصفحة الدفع', fr: 'Vous serez redirigé vers la page de paiement' },
  termsNote: { ar: 'بتأكيد الطلب، أوافق على الشروط والأحكام', fr: 'En confirmant, j\'accepte les conditions générales' },
  subtotal: { ar: 'المجموع الفرعي', fr: 'Sous-total' },
  shipping: { ar: 'التوصيل', fr: 'Livraison' },
  shippingFree: { ar: 'مجاني', fr: 'Gratuit' },
  codFee: { ar: 'رسوم الدفع عند الاستلام', fr: 'Frais COD' },
  total: { ar: 'المجموع الكلي', fr: 'Total' },
};

// ============================================================================
// PLACEHOLDER IMAGE
// ============================================================================

const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRjFGNUY5Ii8+CjxwYXRoIGQ9Ik0yNCAyNEgyN0wzMCAyN0wzNiAyMUw0MiAyN1YzNkgxOFYyN0wyNCAyNFoiIGZpbGw9IiNFMkU4RjAiLz4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyMSIgcj0iMyIgZmlsbD0iI0UyRThGMCIvPgo8L3N2Zz4K';

// ============================================================================
// COMPONENT
// ============================================================================

export function OrderReview({
  shippingAddress,
  paymentMethod,
  totals,
  onPlaceOrder,
  onBack,
  onEditShipping,
  onEditPayment,
  isLoading = false,
  wholesaleMinimumMet = true,
  wholesaleAmountShort = 0,
}: OrderReviewProps) {
  const { language, isRTL } = useLanguage();
  const { items } = useCartContext();
  const { isWholesale } = useAuthContext();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t.title[language]}
        </h2>
        <p className="text-slate-600">{t.subtitle[language]}</p>
      </div>

      {/* Shipping Address */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {t.shippingAddress[language]}
          </h3>
          {onEditShipping && (
            <button
              type="button"
              onClick={onEditShipping}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              {t.edit[language]}
            </button>
          )}
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="font-medium text-slate-900">{shippingAddress.fullName}</p>
          <p className="text-slate-600">{formatPhone(shippingAddress.phone)}</p>
          <p className="text-slate-600 mt-2">
            {shippingAddress.addressLine1}
            {shippingAddress.addressLine2 && <>, {shippingAddress.addressLine2}</>}
          </p>
          <p className="text-slate-600">
            {shippingAddress.city}, {shippingAddress.governorate}
            {shippingAddress.postalCode && ` - ${shippingAddress.postalCode}`}
          </p>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            {t.paymentMethod[language]}
          </h3>
          {onEditPayment && (
            <button
              type="button"
              onClick={onEditPayment}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              {t.edit[language]}
            </button>
          )}
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="font-medium text-slate-900">
            {t.paymentMethods[paymentMethod][language]}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {paymentMethod === 'cod' && t.codNote[language]}
            {paymentMethod === 'bank_transfer' && t.bankTransferNote[language]}
            {paymentMethod === 'flouci' && t.flouciNote[language]}
          </p>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {t.orderItems[language]} ({items.length})
        </h3>
        <div className="space-y-3">
          {items.map((item) => {
            const price = isWholesale && item.product.wholesalePrice
              ? item.product.wholesalePrice
              : item.product.price;

            return (
              <div key={item.id} className="flex gap-4 py-3 border-b border-slate-100 last:border-0">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                  <img
                    src={item.product.images[0] || PLACEHOLDER_IMAGE}
                    alt={language === 'ar' ? item.product.nameAr : item.product.nameFr}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 line-clamp-1">
                    {language === 'ar' ? item.product.nameAr : item.product.nameFr}
                  </p>
                  <p className="text-sm text-slate-500">
                    {item.quantity} x {formatPrice(price, language)}
                  </p>
                </div>
                <p className={cn(
                  'font-semibold shrink-0',
                  isWholesale && item.product.wholesalePrice ? 'text-green-600' : 'text-slate-900'
                )}>
                  {formatPrice(price * item.quantity, language)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">{t.subtotal[language]}</span>
            <span className="text-slate-900">{formatPrice(totals.subtotal, language)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">{t.shipping[language]}</span>
            {totals.shippingFee === 0 ? (
              <span className="text-green-600">{t.shippingFree[language]}</span>
            ) : (
              <span className="text-slate-900">{formatPrice(totals.shippingFee, language)}</span>
            )}
          </div>
          {totals.codFee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">{t.codFee[language]}</span>
              <span className="text-amber-600">+{formatPrice(totals.codFee, language)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg pt-2 border-t border-slate-200">
            <span className="font-bold text-slate-900">{t.total[language]}</span>
            <span className="font-bold text-red-600">{formatPrice(totals.total, language)}</span>
          </div>
        </div>
      </div>

      {/* Terms */}
      <p className="text-xs text-slate-500 text-center">
        {t.termsNote[language]}
      </p>

      {/* Wholesale minimum warning */}
      {!wholesaleMinimumMet && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium flex items-center gap-2">
            <span>⚠️</span>
            {language === 'ar' ? 'الحد الأدنى للطلب غير محقق' : 'Minimum de commande non atteint'}
          </p>
          <p className="text-red-700 text-sm mt-1">
            {language === 'ar' ? 'أضف المزيد لإتمام الطلب' : 'Ajoutez plus pour passer commande'}{' '}
            {formatPrice(wholesaleAmountShort, language)}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className={cn('flex gap-4', isRTL && 'flex-row-reverse')}>
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
          onClick={onPlaceOrder}
          disabled={isLoading || !wholesaleMinimumMet}
          fullWidth
          size="lg"
          isLoading={isLoading}
          className={cn(
            !wholesaleMinimumMet && 'bg-slate-300 text-slate-500 cursor-not-allowed hover:bg-slate-300'
          )}
          leftIcon={
            wholesaleMinimumMet ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : undefined
          }
        >
          {isLoading
            ? t.placingOrder[language]
            : !wholesaleMinimumMet
            ? (language === 'ar' ? 'الحد الأدنى غير محقق' : 'Minimum non atteint')
            : t.placeOrder[language]}
        </Button>
      </div>
    </div>
  );
}