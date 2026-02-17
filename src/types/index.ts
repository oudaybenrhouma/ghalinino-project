/**
 * Application Types
 * Tunisia E-commerce SPA - Dual Tier (Retail/Wholesale)
 */

// Re-export database types
export * from './database';

// ============================================================================
// LANGUAGE TYPES
// ============================================================================

export type Language = 'ar' | 'fr';

export interface Translation {
  ar: string;
  fr: string;
}

// ============================================================================
// CURRENCY CONFIGURATION
// ============================================================================

export interface CurrencyConfig {
  code: 'TND';
  symbol: 'د.ت' | 'TND';
  symbolPosition: 'after';
  decimalSeparator: '.';
  thousandsSeparator: ',';
  decimals: 3; // Tunisian Dinar has 3 decimal places (millimes)
}

// ============================================================================
// TUNISIAN GOVERNORATES (STATES)
// ============================================================================

export type Governorate =
  // Grand Tunis
  | 'tunis'
  | 'ariana'
  | 'ben_arous'
  | 'manouba'
  // North
  | 'nabeul'
  | 'zaghouan'
  | 'bizerte'
  | 'beja'
  | 'jendouba'
  | 'kef'
  | 'siliana'
  // Center
  | 'sousse'
  | 'monastir'
  | 'mahdia'
  | 'sfax'
  | 'kairouan'
  | 'kasserine'
  | 'sidi_bouzid'
  // South
  | 'gabes'
  | 'medenine'
  | 'tataouine'
  | 'gafsa'
  | 'tozeur'
  | 'kebili';

export type ShippingZone = 'grand_tunis' | 'north' | 'center' | 'south';

export interface GovernorateInfo {
  id: Governorate;
  name: Translation;
  shippingZone: ShippingZone;
}

// ============================================================================
// CART TYPES
// ============================================================================

export interface LocalCartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    nameAr: string;
    nameFr: string;
    price: number; // Retail price (TND)
    wholesalePrice: number | null; // Wholesale price (TND)
    compareAtPrice: number | null;
    images: string[];
    quantity: number; // Available stock
    wholesaleMinQuantity: number;
  };
  isWholesalePrice?: boolean;
}

export interface CartSummary {
  items: LocalCartItem[];
  subtotal: number;
  itemCount: number;
  isWholesaleCart: boolean;
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export type PaymentMethodType = 'cod' | 'bank_transfer' | 'flouci';

export interface PaymentMethodInfo {
  id: PaymentMethodType;
  name: Translation;
  description: Translation;
  icon: string;
  isAvailable: boolean;
  additionalFee?: number; // In TND
  processingTime?: Translation; // e.g., "فوري" / "Immédiat"
}

// Bank transfer details for Tunisia
export interface BankTransferDetails {
  bankName: string;
  accountName: string;
  rib: string; // RIB (Relevé d'Identité Bancaire) - 20 digits
  iban?: string;
  swift?: string;
  instructions: Translation;
}

// ============================================================================
// SHIPPING TYPES
// ============================================================================

export interface ShippingOption {
  id: string;
  name: Translation;
  description: Translation;
  estimatedDays: { min: number; max: number };
  price: number; // In TND
  freeAbove?: number; // Free shipping threshold in TND
}

export interface ShippingRate {
  zone: ShippingZone;
  standardPrice: number; // TND
  expressPrice?: number; // TND
  freeAbove?: number; // TND - free shipping threshold
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  preferredLanguage: Language;
  role: 'customer' | 'wholesale' | 'admin' | 'moderator';
  // Wholesale status
  wholesaleStatus: 'none' | 'pending' | 'approved' | 'rejected';
  isWholesaleApproved: boolean;
}

// ============================================================================
// WHOLESALE APPLICATION TYPES
// ============================================================================

export interface WholesaleApplicationData {
  businessName: string;
  businessTaxId: string; // Matricule fiscal
  businessAddress: string;
  businessPhone: string;
  businessDocuments?: File[];
  notes?: string;
}

export interface WholesaleApplication {
  id: string;
  userId: string;
  userEmail: string;
  businessName: string;
  businessTaxId: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  processedAt?: string;
  processedBy?: string;
  rejectionReason?: string;
}

// ============================================================================
// FILTER AND SORT TYPES
// ============================================================================

export interface ProductFilters {
  categoryId?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  brands?: string[];
  tags?: string[];
  inStock?: boolean;
  isFeatured?: boolean;
  isWholesaleOnly?: boolean;
  search?: string;
}

export type ProductSortOption =
  | 'newest'
  | 'oldest'
  | 'price_asc'
  | 'price_desc'
  | 'name_asc'
  | 'name_desc'
  | 'popularity'
  | 'stock_desc';

export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface CheckoutFormData {
  // Contact info
  email: string;
  phone: string;
  
  // Shipping address
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  governorate: Governorate;
  postalCode?: string;
  
  // Order options
  paymentMethod: PaymentMethodType;
  notes?: string;
  
  // Save for later (logged in users)
  saveAddress?: boolean;
  createAccount?: boolean;
  password?: string;
}

export interface AddressFormData {
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  governorate: Governorate;
  postalCode?: string;
  isDefault?: boolean;
}

export interface WholesaleApplicationFormData {
  businessName: string;
  businessTaxId: string;
  businessAddress: string;
  businessPhone: string;
  notes?: string;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: Translation | string;
  message?: Translation | string;
  duration?: number; // ms, 0 for persistent
  action?: {
    label: Translation | string;
    onClick: () => void;
  };
}

// ============================================================================
// ADMIN DASHBOARD TYPES
// ============================================================================

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number; // TND
  totalCustomers: number;
  pendingWholesaleApplications: number;
  lowStockProducts: number;
}

export interface OrderStats {
  date: string;
  orderCount: number;
  revenue: number;
}

export interface TopProduct {
  productId: string;
  productName: Translation;
  totalSold: number;
  revenue: number;
}

// ============================================================================
// REALTIME TYPES
// ============================================================================

export interface RealtimeOrderUpdate {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  orderId: string;
  oldStatus?: string;
  newStatus?: string;
  updatedAt: string;
}

export interface RealtimeStockUpdate {
  productId: string;
  newQuantity: number;
  isLowStock: boolean;
}
