/**
 * Checkout Summary Sidebar
 * Ghalinino - Tunisia E-commerce
 * 
 * Order summary with cart items, shipping, and totals.
 */

import { cn, formatPrice } from '@/lib/utils';
import { useLanguage } from '@/hooks';
import { useCartContext } from '@/contexts/CartContext';
import { useAuthContext } from '@/contexts/AuthContext';
import type { CheckoutTotals, ShippingAddress, PaymentMethodType } from '@/lib/checkout';

// ============================================================================
// TYPES
// ============================================================================

interface CheckoutSummaryProps {
  shippingAddress?: ShippingAddress | null;
  paymentMethod?: PaymentMethodType | null;
  totals: CheckoutTotals;
  showItems?: boolean;
  compact?: boolean;
}

// ============================================================================
// TRANSLATIONS
// ============================================================================

const t = {
  orderSummary: { ar: 'ملخص الطلب', fr: 'Récapitulatif' },
  items: { ar: 'المنتجات', fr: 'Articles' },
  subtotal: { ar: 'المجموع الفرعي', fr: 'Sous-total' },
  shipping: { ar: 'التوصيل', fr: 'Livraison' },
  shippingFree: { ar: 'مجاني', fr: 'Gratuit' },
  codFee: { ar: 'رسوم الدفع عند الاستلام', fr: 'Frais paiement à la livraison' },
  discount: { ar: 'الخصم', fr: 'Réduction' },
  total: { ar: 'المجموع الكلي', fr: 'Total' },
  wholesaleDiscount: { ar: 'أسعار الجملة مطبقة', fr: 'Prix de gros appliqués' },
  shippingTo: { ar: 'التوصيل إلى', fr: 'Livraison à' },
  paymentVia: { ar: 'الدفع عبر', fr: 'Paiement par' },
  paymentMethods: {
    cod: { ar: 'الدفع عند الاستلام', fr: 'Paiement à la livraison' },
    bank_transfer: { ar: 'التحويل البنكي', fr: 'Virement bancaire' },
    flouci: { ar: 'فلوسي', fr: 'Flouci' },
  },
};

// ============================================================================
// PLACEHOLDER IMAGE
// ============================================================================

const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRjFGNUY5Ii8+CjxwYXRoIGQ9Ik0yNCAyNEgyN0wzMCAyN0wzNiAyMUw0MiAyN1YzNkgxOFYyN0wyNCAyNFoiIGZpbGw9IiNFMkU4RjAiLz4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyMSIgcj0iMyIgZmlsbD0iI0UyRThGMCIvPgo8L3N2Zz4K';

// ============================================================================
// COMPONENT
// ============================================================================

export function CheckoutSummary({
  shippingAddress,
  paymentMethod,
  totals,
  showItems = true,
  compact = false,
}: CheckoutSummaryProps) {
  const { language } = useLanguage();
  const { items, itemCount } = useCartContext();
  const { isWholesale } = useAuthContext();

  return (
    <div className={cn(
      'bg-white rounded-2xl shadow-sm border border-slate-200',
      compact ? 'p-4' : 'p-6'
    )}>
      {/* Header */}
      <h3 className={cn(
        'font-bold text-slate-900 flex items-center gap-2',
        compact ? 'text-base mb-4' : 'text-lg mb-6'
      )}>
        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        {t.orderSummary[language]}
        <span className="ml-auto text-sm font-normal text-slate-500">
          ({itemCount} {t.items[language]})
        </span>
      </h3>

      {/* Wholesale indicator */}
      {isWholesale && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-green-700 font-medium">
            {t.wholesaleDiscount[language]}
          </span>
        </div>
      )}

      {/* Cart items list */}
      {showItems && items.length > 0 && (
        <div className={cn(
          'space-y-3 border-b border-slate-200',
          compact ? 'pb-4 mb-4 max-h-48 overflow-y-auto' : 'pb-6 mb-6 max-h-64 overflow-y-auto'
        )}>
          {items.map((item) => (
            <div key={item.id} className="flex gap-3">
              {/* Image */}
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                <img
                  src={item.product.images[0] || PLACEHOLDER_IMAGE}
                  alt={language === 'ar' ? item.product.nameAr : item.product.nameFr}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                  }}
                />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 line-clamp-1">
                  {language === 'ar' ? item.product.nameAr : item.product.nameFr}
                </p>
                <p className="text-xs text-slate-500">
                  {item.quantity} x {formatPrice(
                    (isWholesale && item.product.wholesalePrice
                      ? item.product.wholesalePrice
                      : item.product.price),
                    language
                  )}
                </p>
              </div>

              {/* Line total */}
              <p className={cn(
                'text-sm font-semibold shrink-0',
                isWholesale && item.product.wholesalePrice ? 'text-green-600' : 'text-slate-900'
              )}>
                {formatPrice(
                  (isWholesale && item.product.wholesalePrice
                    ? item.product.wholesalePrice
                    : item.product.price) * item.quantity,
                  language
                )}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Shipping info */}
      {shippingAddress && (
        <div className="mb-4 pb-4 border-b border-slate-200">
          <p className="text-xs text-slate-500 mb-1">{t.shippingTo[language]}</p>
          <p className="text-sm text-slate-900 font-medium">{shippingAddress.fullName}</p>
          <p className="text-sm text-slate-600">
            {shippingAddress.addressLine1}, {shippingAddress.city}
          </p>
        </div>
      )}

      {/* Payment method */}
      {paymentMethod && (
        <div className="mb-4 pb-4 border-b border-slate-200">
          <p className="text-xs text-slate-500 mb-1">{t.paymentVia[language]}</p>
          <p className="text-sm text-slate-900 font-medium">
            {t.paymentMethods[paymentMethod][language]}
          </p>
        </div>
      )}

      {/* Totals */}
      <div className="space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">{t.subtotal[language]}</span>
          <span className="text-slate-900 font-medium">
            {formatPrice(totals.subtotal, language)}
          </span>
        </div>

        {/* Shipping */}
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">{t.shipping[language]}</span>
          {totals.shippingFee === 0 ? (
            <span className="text-green-600 font-medium">{t.shippingFree[language]}</span>
          ) : (
            <span className="text-slate-900 font-medium">
              {formatPrice(totals.shippingFee, language)}
            </span>
          )}
        </div>

        {/* COD fee */}
        {totals.codFee > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">{t.codFee[language]}</span>
            <span className="text-amber-600 font-medium">
              +{formatPrice(totals.codFee, language)}
            </span>
          </div>
        )}

        {/* Discount */}
        {totals.discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">{t.discount[language]}</span>
            <span className="text-green-600 font-medium">
              -{formatPrice(totals.discount, language)}
            </span>
          </div>
        )}

        {/* Total */}
        <div className={cn(
          'flex justify-between pt-3 border-t border-slate-200',
          compact ? 'text-base' : 'text-lg'
        )}>
          <span className="font-bold text-slate-900">{t.total[language]}</span>
          <span className="font-bold text-red-600">
            {formatPrice(totals.total, language)}
          </span>
        </div>
      </div>
    </div>
  );
}