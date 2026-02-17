/**
 * Shipping Calculation Logic
 * Tunisia E-commerce - Governorate-based Shipping
 */

import type { Governorate } from '@/types';
import { getShippingPrice as getBaseShippingPrice } from './utils';
import { WHOLESALE_CONFIG } from './wholesaleValidation';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ShippingCalculation {
  baseShipping: number; // Base shipping fee for governorate
  wholesaleDiscount: number; // Discount for wholesale users
  finalShipping: number; // Final shipping after discounts
  isFree: boolean; // Whether shipping is free
  freeShippingThreshold?: number; // Threshold for free shipping
  amountUntilFree?: number; // How much more to spend for free shipping
}

export interface ShippingOptions {
  governorate: Governorate;
  cartTotal: number;
  isWholesale: boolean;
  wholesaleApproved?: boolean;
}

// ============================================
// SHIPPING CONSTANTS
// ============================================

export const SHIPPING_CONFIG = {
  RETAIL_BASE_SHIPPING: 7000, // 7 TND in millimes
  WHOLESALE_BASE_SHIPPING: 5000, // 5 TND in millimes
  WHOLESALE_DISCOUNT: 2000, // 2 TND discount for wholesale
  FREE_SHIPPING_THRESHOLD: WHOLESALE_CONFIG.FREE_SHIPPING_THRESHOLD,
} as const;

// ============================================
// MAIN SHIPPING CALCULATION
// ============================================

/**
 * Calculate shipping fee based on user type and cart total
 */
export function calculateShipping(options: ShippingOptions): ShippingCalculation {
  const {
    governorate,
    cartTotal,
    isWholesale,
    wholesaleApproved = false,
  } = options;

  // Get base shipping price for governorate
  const baseShipping = getBaseShippingPrice(governorate);

  // Initialize result
  const result: ShippingCalculation = {
    baseShipping,
    wholesaleDiscount: 0,
    finalShipping: baseShipping,
    isFree: false,
  };

  // Wholesale users get discounted or free shipping
  if (isWholesale && wholesaleApproved) {
    // Check if qualifies for free shipping
    if (cartTotal >= SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD) {
      result.isFree = true;
      result.finalShipping = 0;
      result.wholesaleDiscount = baseShipping;
    } else {
      // Apply wholesale discount
      result.wholesaleDiscount = SHIPPING_CONFIG.WHOLESALE_DISCOUNT;
      result.finalShipping = Math.max(0, baseShipping - SHIPPING_CONFIG.WHOLESALE_DISCOUNT);
    }

    // Calculate amount until free shipping
    if (!result.isFree) {
      result.freeShippingThreshold = SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD;
      result.amountUntilFree = SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD - cartTotal;
    }
  }

  return result;
}

/**
 * Get shipping fee only (backward compatibility)
 */
export function getShippingFee(
  governorate: Governorate,
  cartTotal: number,
  isWholesale: boolean,
  wholesaleApproved: boolean = false
): number {
  const calculation = calculateShipping({
    governorate,
    cartTotal,
    isWholesale,
    wholesaleApproved,
  });
  
  return calculation.finalShipping;
}

/**
 * Check if order qualifies for free shipping
 */
export function qualifiesForFreeShipping(
  cartTotal: number,
  isWholesale: boolean,
  wholesaleApproved: boolean = false
): boolean {
  if (!isWholesale || !wholesaleApproved) {
    return false;
  }
  
  return cartTotal >= SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD;
}

/**
 * Get free shipping progress for wholesale users
 */
export function getFreeShippingProgress(
  cartTotal: number,
  isWholesale: boolean,
  wholesaleApproved: boolean = false
): {
  percentage: number;
  amountRemaining: number;
  qualifies: boolean;
} | null {
  if (!isWholesale || !wholesaleApproved) {
    return null; // Retail users don't get free shipping
  }

  const threshold = SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD;
  const percentage = Math.min((cartTotal / threshold) * 100, 100);
  const amountRemaining = Math.max(threshold - cartTotal, 0);

  return {
    percentage,
    amountRemaining,
    qualifies: cartTotal >= threshold,
  };
}

/**
 * Format shipping message for display
 */
export function getShippingMessage(
  calculation: ShippingCalculation,
  language: 'ar' | 'fr'
): string {
  if (calculation.isFree) {
    return language === 'ar' ? 'شحن مجاني' : 'Livraison gratuite';
  }

  if (calculation.wholesaleDiscount > 0 && !calculation.isFree) {
    const saved = calculation.wholesaleDiscount / 1000;
    return language === 'ar'
      ? `توفير ${saved.toFixed(3)} د.ت على الشحن`
      : `Économie de ${saved.toFixed(3)} TND sur la livraison`;
  }

  return '';
}