/**
 * Wholesale Business Logic Validation
 * Tunisia E-commerce - Wholesale Tier System
 */

import type { CartItem } from '@/types';

// ============================================
// CONSTANTS
// ============================================

export const WHOLESALE_CONFIG = {
  MINIMUM_ORDER_VALUE: 100000, // 100 TND in millimes
  FREE_SHIPPING_THRESHOLD: 500000, // 500 TND in millimes
  DEFAULT_DISCOUNT_TIER: 1,
  MAX_DISCOUNT_TIER: 3,
} as const;

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface WholesaleValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  minimumMet: boolean;
  currentTotal: number;
  minimumRequired: number;
  amountShort: number;
}

export interface VolumeDiscount {
  quantity: number;
  discountPercentage: number;
  name: string;
}

// ============================================
// MINIMUM ORDER VALIDATION
// ============================================

/**
 * Validate if cart meets wholesale minimum order value
 */
export function validateWholesaleMinimum(
  cartItems: CartItem[],
  isWholesale: boolean
): WholesaleValidationResult {
  const result: WholesaleValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    minimumMet: true,
    currentTotal: 0,
    minimumRequired: WHOLESALE_CONFIG.MINIMUM_ORDER_VALUE,
    amountShort: 0,
  };

  // Retail users don't have minimum
  if (!isWholesale) {
    return result;
  }

  // Calculate cart total (using wholesale prices)
  result.currentTotal = cartItems.reduce((total, item) => {
    const price = item.product.wholesalePrice || item.product.price;
    return total + price * item.quantity;
  }, 0);

  // Check if minimum is met
  if (result.currentTotal < result.minimumRequired) {
    result.isValid = false;
    result.minimumMet = false;
    result.amountShort = result.minimumRequired - result.currentTotal;
    result.errors.push(
      `Minimum order value not met. Add ${(result.amountShort / 1000).toFixed(3)} TND more to checkout.`
    );
  }

  return result;
}

/**
 * Calculate progress towards minimum order
 */
export function getMinimumOrderProgress(
  currentTotal: number,
  isWholesale: boolean
): {
  percentage: number;
  amountRemaining: number;
  isMet: boolean;
} {
  if (!isWholesale) {
    return { percentage: 100, amountRemaining: 0, isMet: true };
  }

  const minimum = WHOLESALE_CONFIG.MINIMUM_ORDER_VALUE;
  const percentage = Math.min((currentTotal / minimum) * 100, 100);
  const amountRemaining = Math.max(minimum - currentTotal, 0);

  return {
    percentage,
    amountRemaining,
    isMet: currentTotal >= minimum,
  };
}

// ============================================
// VOLUME DISCOUNT CALCULATIONS
// ============================================

/**
 * Get applicable volume discounts for a product
 * This is hardcoded for MVP, will use database in future
 */
export function getVolumeDiscounts(
  productId?: string
): VolumeDiscount[] {
  // Global volume discounts (apply to all products)
  return [
    { quantity: 10, discountPercentage: 5, name: 'Buy 10+' },
    { quantity: 20, discountPercentage: 10, name: 'Buy 20+' },
    { quantity: 50, discountPercentage: 15, name: 'Buy 50+' },
    { quantity: 100, discountPercentage: 20, name: 'Buy 100+' },
  ];
}

/**
 * Calculate volume discount for a specific quantity
 */
export function calculateVolumeDiscount(
  quantity: number,
  basePrice: number,
  productId?: string
): {
  discountPercentage: number;
  discountAmount: number;
  finalPrice: number;
} {
  const discounts = getVolumeDiscounts(productId);
  
  // Find the highest applicable discount
  const applicableDiscount = discounts
    .filter((d) => quantity >= d.quantity)
    .sort((a, b) => b.discountPercentage - a.discountPercentage)[0];

  if (!applicableDiscount) {
    return {
      discountPercentage: 0,
      discountAmount: 0,
      finalPrice: basePrice,
    };
  }

  const discountAmount = Math.round(
    (basePrice * applicableDiscount.discountPercentage) / 100
  );
  const finalPrice = basePrice - discountAmount;

  return {
    discountPercentage: applicableDiscount.discountPercentage,
    discountAmount,
    finalPrice,
  };
}

// ============================================
// APPROVAL STATUS HELPERS
// ============================================

/**
 * Check if user can see wholesale prices
 */
export function canSeeWholesalePrices(
  wholesaleStatus: string | null | undefined
): boolean {
  return wholesaleStatus === 'approved';
}

/**
 * Check if user is pending wholesale approval
 */
export function isPendingWholesaleApproval(
  wholesaleStatus: string | null | undefined
): boolean {
  return wholesaleStatus === 'pending';
}

/**
 * Get user-friendly wholesale status message
 */
export function getWholesaleStatusMessage(
  wholesaleStatus: string | null | undefined,
  language: 'ar' | 'fr'
): string {
  const messages = {
    approved: {
      ar: 'حساب جملة نشط',
      fr: 'Compte grossiste actif',
    },
    pending: {
      ar: 'طلب الجملة قيد المراجعة',
      fr: 'Demande en cours de révision',
    },
    rejected: {
      ar: 'طلب الجملة مرفوض',
      fr: 'Demande refusée',
    },
    none: {
      ar: 'حساب تجزئة',
      fr: 'Compte détail',
    },
  };

  const status = (wholesaleStatus || 'none') as keyof typeof messages;
  return messages[status]?.[language] || messages.none[language];
}

// ============================================
// BUSINESS RULES VALIDATION
// ============================================

/**
 * Validate wholesale account eligibility
 */
export function validateWholesaleAccount(data: {
  businessName: string;
  businessTaxId: string;
  businessDocuments: File[];
}): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  // Business name required
  if (!data.businessName || data.businessName.trim().length < 3) {
    errors.businessName = 'Company name must be at least 3 characters';
  }

  // Tax ID required (Tunisia format: 7 digits + letter)
  const taxIdPattern = /^\d{7}[A-Z]$/;
  if (!data.businessTaxId || !taxIdPattern.test(data.businessTaxId.toUpperCase())) {
    errors.businessTaxId = 'Invalid tax ID format (expected: 1234567A)';
  }

  // Business documents required
  if (!data.businessDocuments || data.businessDocuments.length === 0) {
    errors.businessDocuments = 'Please upload your business license';
  }

  // File size validation (max 5MB per file)
  if (data.businessDocuments) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = data.businessDocuments.filter(
      (file) => file.size > maxSize
    );
    if (oversizedFiles.length > 0) {
      errors.businessDocuments = 'Files must be less than 5MB each';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Calculate discount tier based on business metrics
 * (Future: can be based on order history, payment terms, etc.)
 */
export function calculateDiscountTier(metrics: {
  totalOrders?: number;
  totalRevenue?: number;
  accountAge?: number; // days
}): number {
  // For MVP, default tier is 1
  // Future logic could be:
  // - Tier 0: New accounts
  // - Tier 1: 10+ orders or 5000+ TND revenue
  // - Tier 2: 50+ orders or 20000+ TND revenue
  // - Tier 3: 100+ orders or 50000+ TND revenue
  
  return WHOLESALE_CONFIG.DEFAULT_DISCOUNT_TIER;
}