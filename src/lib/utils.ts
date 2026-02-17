/**
 * Utility Functions
 * Tunisia E-commerce SPA
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Language, Governorate, GovernorateInfo, Translation } from '@/types';

// ============================================
// STYLING UTILITIES
// ============================================

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// CURRENCY UTILITIES
// ============================================

/**
 * Format price in TND (Tunisian Dinar)
 * Stores prices in millimes (1 TND = 1000 millimes)
 * @param millimes - Price in millimes
 * @param language - Display language
 */
export function formatPrice(millimes: number, language: Language = 'ar'): string {
  const dinars = millimes / 1000;
  
  // Format with 3 decimal places (Tunisian Dinar has 3 decimal places)
  const formatted = dinars.toLocaleString(language === 'ar' ? 'ar-TN' : 'fr-TN', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
  
  // Add currency symbol
  return language === 'ar' ? `${formatted} د.ت` : `${formatted} TND`;
}

/**
 * Parse price string to millimes
 */
export function parsePrice(priceString: string): number {
  const cleaned = priceString.replace(/[^\d.,]/g, '').replace(',', '.');
  return Math.round(parseFloat(cleaned) * 1000);
}

/**
 * Calculate discount percentage
 */
export function calculateDiscount(originalPrice: number, salePrice: number): number {
  if (originalPrice <= 0 || salePrice >= originalPrice) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

// ============================================
// TRANSLATION UTILITIES
// ============================================

/**
 * Get translated text based on language
 */
export function t(translation: Translation, language: Language): string {
  return translation[language];
}

/**
 * Get bilingual product name
 */
export function getLocalizedName(
  nameAr: string,
  nameFr: string,
  language: Language
): string {
  return language === 'ar' ? nameAr : nameFr;
}

// ============================================
// GOVERNORATE DATA
// ============================================

export const GOVERNORATES: GovernorateInfo[] = [
  // Grand Tunis
  { id: 'tunis', name: { ar: 'تونس', fr: 'Tunis' }, shippingZone: 'grand_tunis' },
  { id: 'ariana', name: { ar: 'أريانة', fr: 'Ariana' }, shippingZone: 'grand_tunis' },
  { id: 'ben_arous', name: { ar: 'بن عروس', fr: 'Ben Arous' }, shippingZone: 'grand_tunis' },
  { id: 'manouba', name: { ar: 'منوبة', fr: 'Manouba' }, shippingZone: 'grand_tunis' },
  
  // North
  { id: 'nabeul', name: { ar: 'نابل', fr: 'Nabeul' }, shippingZone: 'north' },
  { id: 'zaghouan', name: { ar: 'زغوان', fr: 'Zaghouan' }, shippingZone: 'north' },
  { id: 'bizerte', name: { ar: 'بنزرت', fr: 'Bizerte' }, shippingZone: 'north' },
  { id: 'beja', name: { ar: 'باجة', fr: 'Béja' }, shippingZone: 'north' },
  { id: 'jendouba', name: { ar: 'جندوبة', fr: 'Jendouba' }, shippingZone: 'north' },
  { id: 'kef', name: { ar: 'الكاف', fr: 'Le Kef' }, shippingZone: 'north' },
  { id: 'siliana', name: { ar: 'سليانة', fr: 'Siliana' }, shippingZone: 'north' },
  
  // Center
  { id: 'sousse', name: { ar: 'سوسة', fr: 'Sousse' }, shippingZone: 'center' },
  { id: 'monastir', name: { ar: 'المنستير', fr: 'Monastir' }, shippingZone: 'center' },
  { id: 'mahdia', name: { ar: 'المهدية', fr: 'Mahdia' }, shippingZone: 'center' },
  { id: 'sfax', name: { ar: 'صفاقس', fr: 'Sfax' }, shippingZone: 'center' },
  { id: 'kairouan', name: { ar: 'القيروان', fr: 'Kairouan' }, shippingZone: 'center' },
  { id: 'kasserine', name: { ar: 'القصرين', fr: 'Kasserine' }, shippingZone: 'center' },
  { id: 'sidi_bouzid', name: { ar: 'سيدي بوزيد', fr: 'Sidi Bouzid' }, shippingZone: 'center' },
  
  // South
  { id: 'gabes', name: { ar: 'قابس', fr: 'Gabès' }, shippingZone: 'south' },
  { id: 'medenine', name: { ar: 'مدنين', fr: 'Médenine' }, shippingZone: 'south' },
  { id: 'tataouine', name: { ar: 'تطاوين', fr: 'Tataouine' }, shippingZone: 'south' },
  { id: 'gafsa', name: { ar: 'قفصة', fr: 'Gafsa' }, shippingZone: 'south' },
  { id: 'tozeur', name: { ar: 'توزر', fr: 'Tozeur' }, shippingZone: 'south' },
  { id: 'kebili', name: { ar: 'قبلي', fr: 'Kébili' }, shippingZone: 'south' },
];

/**
 * Get governorate info by ID
 */
export function getGovernorate(id: Governorate): GovernorateInfo | undefined {
  return GOVERNORATES.find((g) => g.id === id);
}

/**
 * Get shipping price by zone (in millimes)
 */
export function getShippingPrice(governorate: Governorate): number {
  const gov = getGovernorate(governorate);
  if (!gov) return 8000; // Default 8 TND
  
  switch (gov.shippingZone) {
    case 'grand_tunis':
      return 5000; // 5 TND
    case 'north':
      return 7000; // 7 TND
    case 'center':
      return 8000; // 8 TND
    case 'south':
      return 10000; // 10 TND
    default:
      return 8000;
  }
}

// ============================================
// VALIDATION UTILITIES
// ============================================

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
 * Format Tunisian phone number
 */
export function formatTunisianPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Extract the 8-digit number
  let number = cleaned;
  if (cleaned.startsWith('+216')) number = cleaned.slice(4);
  else if (cleaned.startsWith('216')) number = cleaned.slice(3);
  else if (cleaned.startsWith('0')) number = cleaned.slice(1);
  
  if (number.length !== 8) return phone;
  
  // Format as XX XXX XXX
  return `${number.slice(0, 2)} ${number.slice(2, 5)} ${number.slice(5)}`;
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================
// STRING UTILITIES
// ============================================

/**
 * Generate URL-safe slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================
// DATE UTILITIES
// ============================================

/**
 * Format date for display
 */
export function formatDate(
  date: string | Date,
  language: Language = 'ar',
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const locale = language === 'ar' ? 'ar-TN' : 'fr-TN';
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };
  
  return d.toLocaleDateString(locale, defaultOptions);
}

/**
 * Get relative time (e.g., "2 days ago")
 */
export function getRelativeTime(date: string | Date, language: Language = 'ar'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return language === 'ar' ? 'اليوم' : "Aujourd'hui";
  } else if (diffDays === 1) {
    return language === 'ar' ? 'أمس' : 'Hier';
  } else if (diffDays < 7) {
    return language === 'ar' 
      ? `منذ ${diffDays} أيام`
      : `Il y a ${diffDays} jours`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return language === 'ar'
      ? `منذ ${weeks} ${weeks === 1 ? 'أسبوع' : 'أسابيع'}`
      : `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
  } else {
    return formatDate(d, language);
  }
}

// ============================================
// LOCAL STORAGE UTILITIES
// ============================================

const STORAGE_PREFIX = 'souq_tn_';

/**
 * Get item from localStorage with type safety
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Set item in localStorage
 */
export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

/**
 * Remove item from localStorage
 */
export function removeStorageItem(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
}
