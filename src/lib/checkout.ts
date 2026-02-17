/**
 * Checkout Utilities
 * Ghalinino - Tunisia E-commerce
 * 
 * Shipping and total calculations for Tunisia.
 */

import type { Governorate, Language } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export type PaymentMethodType = 'cod' | 'bank_transfer' | 'flouci';

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  governorate: Governorate;
  postalCode?: string;
}

export interface CheckoutTotals {
  subtotal: number;
  shippingFee: number;
  codFee: number;
  discount: number;
  total: number;
}

export interface PaymentMethodInfo {
  id: PaymentMethodType;
  nameAr: string;
  nameFr: string;
  descriptionAr: string;
  descriptionFr: string;
  icon: string;
  additionalFee: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Shipping fees by governorate zone (in TND)
export const SHIPPING_ZONES = {
  grand_tunis: ['tunis', 'ariana', 'ben_arous', 'manouba'],
  north: ['nabeul', 'zaghouan', 'bizerte', 'beja', 'jendouba', 'kef', 'siliana'],
  center: ['sousse', 'monastir', 'mahdia', 'sfax', 'kairouan', 'kasserine', 'sidi_bouzid'],
  south: ['gabes', 'medenine', 'tataouine', 'gafsa', 'tozeur', 'kebili'],
} as const;

export const SHIPPING_FEES = {
  grand_tunis: 5,
  north: 7,
  center: 8,
  south: 10,
} as const;

// Wholesale shipping
export const WHOLESALE_SHIPPING_FEES = {
  grand_tunis: 4,
  north: 5,
  center: 6,
  south: 8,
} as const;

// Free shipping threshold for wholesale (in TND)
export const WHOLESALE_FREE_SHIPPING_THRESHOLD = 500;

// COD fee (in TND)
export const COD_FEE = 2;

// Payment methods configuration
export const PAYMENT_METHODS: PaymentMethodInfo[] = [
  {
    id: 'cod',
    nameAr: 'الدفع عند الاستلام',
    nameFr: 'Paiement à la livraison',
    descriptionAr: 'ادفع نقداً عند استلام طلبك (+2 د.ت رسوم إضافية)',
    descriptionFr: 'Payez en espèces à la réception (+2 TND frais)',
    icon: 'cash',
    additionalFee: COD_FEE,
  },
  {
    id: 'bank_transfer',
    nameAr: 'التحويل البنكي',
    nameFr: 'Virement bancaire',
    descriptionAr: 'حول المبلغ إلى حسابنا البنكي قبل الشحن',
    descriptionFr: 'Transférez le montant sur notre compte avant expédition',
    icon: 'bank',
    additionalFee: 0,
  },
  {
    id: 'flouci',
    nameAr: 'الدفع الإلكتروني (فلوسي)',
    nameFr: 'Paiement en ligne (Flouci)',
    descriptionAr: 'ادفع بالبطاقة أو محفظة فلوسي أو الدينار الإلكتروني',
    descriptionFr: 'Payez par carte, portefeuille Flouci ou E-Dinar',
    icon: 'card',
    additionalFee: 0,
  },
];

// Bank transfer details (for display)
export const BANK_DETAILS = {
  bankName: 'البنك الوطني الفلاحي | BNA',
  accountName: 'غالينينو للتجارة | Ghalinino Commerce',
  rib: '03 000 0001 0000 1234 5678 90',
  agency: 'فرع تونس العاصمة | Agence Tunis Centre',
};

// ============================================================================
// SHIPPING CALCULATIONS
// ============================================================================

/**
 * Get shipping zone for a governorate
 */
export function getShippingZone(governorate: Governorate): keyof typeof SHIPPING_FEES {
  for (const [zone, governorates] of Object.entries(SHIPPING_ZONES)) {
    if (governorates.includes(governorate as never)) {
      return zone as keyof typeof SHIPPING_FEES;
    }
  }
  return 'center'; // Default fallback
}

/**
 * Calculate shipping fee
 */
export function calculateShippingFee(
  governorate: Governorate,
  isWholesale: boolean,
  subtotal: number
): number {
  const zone = getShippingZone(governorate);
  
  if (isWholesale) {
    // Free shipping for wholesale orders over threshold
    if (subtotal >= WHOLESALE_FREE_SHIPPING_THRESHOLD) {
      return 0;
    }
    return WHOLESALE_SHIPPING_FEES[zone];
  }
  
  return SHIPPING_FEES[zone];
}

/**
 * Calculate all checkout totals
 */
export function calculateCheckoutTotals(
  subtotal: number,
  governorate: Governorate | null,
  paymentMethod: PaymentMethodType,
  isWholesale: boolean,
  discountAmount: number = 0
): CheckoutTotals {
  // Shipping fee (0 if no governorate selected)
  const shippingFee = governorate
    ? calculateShippingFee(governorate, isWholesale, subtotal)
    : 0;
  
  // COD fee
  const codFee = paymentMethod === 'cod' ? COD_FEE : 0;
  
  // Total
  const total = subtotal + shippingFee + codFee - discountAmount;
  
  return {
    subtotal,
    shippingFee,
    codFee,
    discount: discountAmount,
    total: Math.max(0, total),
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate Tunisian phone number
 * Formats: +216XXXXXXXX, 216XXXXXXXX, 0XXXXXXXX, XXXXXXXX
 */
export function isValidTunisianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  const patterns = [
    /^\+216[2-9]\d{7}$/, // +216 format
    /^216[2-9]\d{7}$/, // 216 format
    /^0[2-9]\d{7}$/, // 0X format
    /^[2-9]\d{7}$/, // 8 digits
  ];
  return patterns.some((p) => p.test(cleaned));
}

/**
 * Format phone for display
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Extract 8 digits
  let number = cleaned;
  if (cleaned.startsWith('+216')) number = cleaned.slice(4);
  else if (cleaned.startsWith('216')) number = cleaned.slice(3);
  else if (cleaned.startsWith('0')) number = cleaned.slice(1);
  
  if (number.length !== 8) return phone;
  
  return `+216 ${number.slice(0, 2)} ${number.slice(2, 5)} ${number.slice(5)}`;
}

// ============================================================================
// FORMATTING
// ============================================================================

/**
 * Get payment method display info
 */
export function getPaymentMethodInfo(
  methodId: PaymentMethodType,
  language: Language
): { name: string; description: string } {
  const method = PAYMENT_METHODS.find((m) => m.id === methodId);
  if (!method) {
    return { name: '', description: '' };
  }
  
  return {
    name: language === 'ar' ? method.nameAr : method.nameFr,
    description: language === 'ar' ? method.descriptionAr : method.descriptionFr,
  };
}

/**
 * Get shipping zone display name
 */
export function getShippingZoneName(
  governorate: Governorate,
  language: Language
): string {
  const zone = getShippingZone(governorate);
  
  const names = {
    grand_tunis: { ar: 'تونس الكبرى', fr: 'Grand Tunis' },
    north: { ar: 'الشمال', fr: 'Nord' },
    center: { ar: 'الوسط', fr: 'Centre' },
    south: { ar: 'الجنوب', fr: 'Sud' },
  };
  
  return names[zone][language];
}
