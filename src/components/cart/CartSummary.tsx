/**
 * Cart Summary Component
 * Ghalinino - Tunisia E-commerce
 */

import { Link } from 'react-router-dom';
import { cn, formatPrice } from '@/lib/utils';
import { useLanguage } from '@/hooks';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCartContext } from '@/contexts/CartContext';
import { Button } from '@/components/common';
import { MinimumOrderProgress } from './MinimumOrderProgress';
import { calculateShipping, getFreeShippingProgress } from '@/lib/shipping';
import { canSeeWholesalePrices } from '@/lib/wholesaleValidation';

// ============================================================================
// TYPES
// ============================================================================

interface CartSummaryProps {
  compact?: boolean;
  onCheckout?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CartSummary({ compact = false, onCheckout }: CartSummaryProps) {
  const { language } = useLanguage();
  const { user, profile } = useAuthContext();
  const { items, itemCount, subtotal, isEmpty } = useCartContext();

  const selectedGovernorate = 'tunis'; // TODO: replace with real selected governorate state

  // Check if user is wholesale approved
  const isWholesale = profile?.wholesale_status === 'approved';
  const wholesaleApproved = canSeeWholesalePrices(profile?.wholesale_status);

  // ===============================
  // SHIPPING CALCULATION
  // ===============================

  const shippingCalculation = calculateShipping({
    governorate: selectedGovernorate,
    cartTotal: subtotal,
    isWholesale,
    wholesaleApproved,
  });

  const freeShippingProgress = getFreeShippingProgress(
    subtotal,
    isWholesale,
    wholesaleApproved
  );

  // ===============================
  // TOTAL
  // ===============================

  const total = subtotal + shippingCalculation.finalShipping;

  // Check if any items are using wholesale prices
  const usingWholesalePrices =
    isWholesale &&
    items.some(item => item.product.wholesalePrice !== null);

  // Don't render if cart is empty
  if (isEmpty) return null;

  return (
    <div
      className={cn(
        'bg-slate-50 rounded-xl p-6',
        compact && 'p-4'
      )}
    >
      {/* Item count */}
      <div className="flex justify-between items-center text-sm text-slate-600 mb-4">
        <span>
          {itemCount} {language === 'ar' ? 'منتج' : 'article(s)'}
        </span>
      </div>

      {/* Wholesale Indicator */}
      {usingWholesalePrices && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm text-green-700 font-medium">
            {language === 'ar'
              ? 'أسعار الجملة مطبقة'
              : 'Prix de gros appliqués'}
          </span>
        </div>
      )}

      {/* =========================
          WHOLESALE MIN ORDER
      ========================== */}
      {isWholesale && (
        <MinimumOrderProgress
          currentTotal={subtotal}
          className="mb-4"
        />
      )}

      {/* =========================
          FREE SHIPPING PROGRESS
      ========================== */}
      {freeShippingProgress &&
        !freeShippingProgress.qualifies && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-green-700">
              {formatPrice(
                freeShippingProgress.amountRemaining,
                language
              )}{' '}
              {language === 'ar'
                ? 'حتى الشحن المجاني'
                : "jusqu'à la livraison gratuite"} 🚚
            </p>
            <div className="relative w-full h-2 bg-green-100 rounded-full overflow-hidden mt-2">
              <div
                className="absolute left-0 top-0 h-full bg-green-500 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(freeShippingProgress.percentage, 100)}%`,
                }}
              />
            </div>
          </div>
        )}

      {/* Subtotal */}
      <div className="flex justify-between items-center py-3 border-b border-slate-200">
        <span className="text-slate-600">
          {language === 'ar' ? 'المجموع الفرعي' : 'Sous-total'}
        </span>
        <span className="font-semibold text-slate-900">
          {formatPrice(subtotal, language)}
        </span>
      </div>

      {/* Shipping */}
      <div className="flex justify-between items-center py-3 border-b border-slate-200 text-sm">
        <span className="text-slate-600">
          {language === 'ar' ? 'الشحن' : 'Livraison'}
        </span>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              'font-medium',
              shippingCalculation.isFree && 'text-green-600 font-semibold'
            )}
          >
            {shippingCalculation.isFree
              ? language === 'ar'
                ? 'مجاني'
                : 'Gratuit'
              : formatPrice(
                  shippingCalculation.finalShipping,
                  language
                )}
          </span>

          {shippingCalculation.wholesaleDiscount > 0 &&
            !shippingCalculation.isFree && (
              <span className="text-xs text-green-600">
                (-{formatPrice(
                  shippingCalculation.wholesaleDiscount,
                  language
                )})
              </span>
            )}
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center py-4">
        <span className="text-lg font-bold text-slate-900">
          {language === 'ar' ? 'المجموع' : 'Total'}
        </span>
        <span className="text-xl font-bold text-red-600">
          {formatPrice(total, language)}
        </span>
      </div>

      {/* Checkout Button */}
      {onCheckout && (
        <Button
          onClick={onCheckout}
          fullWidth
          size="lg"
          className="mb-3"
        >
          {language === 'ar' ? 'إتمام الطلب' : 'Commander'}
        </Button>
      )}

      {/* Continue Shopping Link */}
      <Link
        to="/products"
        className="block text-center text-sm text-slate-600 hover:text-red-600 transition-colors"
      >
        {language === 'ar'
          ? 'متابعة التسوق'
          : 'Continuer les achats'}
      </Link>
    </div>
  );
}