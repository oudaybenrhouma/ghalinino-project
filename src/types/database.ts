/**
 * Supabase Database Types
 * Tunisia E-commerce Platform - Dual Tier (Retail/Wholesale)
 * 
 * This file contains TypeScript types that match the Supabase database schema.
 * Auto-generated schema can be obtained using:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============================================================================
// ENUM TYPES (matching PostgreSQL enums)
// ============================================================================

export type UserRole = 'customer' | 'wholesale' | 'admin' | 'moderator';

export type WholesaleStatus = 'none' | 'pending' | 'approved' | 'rejected';

export type OrderStatus = 
  | 'pending'      // Order placed, awaiting payment/confirmation
  | 'paid'         // Payment received (for non-COD)
  | 'processing'   // Being prepared for shipment
  | 'shipped'      // Handed to carrier
  | 'delivered'    // Received by customer
  | 'cancelled'    // Cancelled before shipment
  | 'refunded';    // Payment returned to customer

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type PaymentMethod = 'cod' | 'bank_transfer' | 'flouci';

export type UserLanguage = 'ar' | 'fr';

// ============================================================================
// SHIPPING ADDRESS TYPE
// ============================================================================

export interface ShippingAddress {
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  governorate: string;
  postal_code?: string;
}

// ============================================================================
// PRODUCT SNAPSHOT TYPE (stored in order_items)
// ============================================================================

export interface ProductSnapshot {
  id: string;
  name_ar: string;
  name_fr: string;
  sku: string | null;
  image: string | null;
  weight_grams?: number;
}

// ============================================================================
// DATABASE SCHEMA
// ============================================================================

export interface Database {
  public: {
    Tables: {
      // ========================================
      // PROFILES TABLE
      // ========================================
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          preferred_language: UserLanguage;
          role: UserRole;
          // Wholesale fields (migration 001)
          wholesale_status: WholesaleStatus;
          wholesale_applied_at: string | null;
          wholesale_approved_at: string | null;
          wholesale_rejected_at: string | null;
          wholesale_rejection_reason: string | null;
          business_name: string | null;
          business_tax_id: string | null;
          business_address: string | null;
          business_phone: string | null;
          business_documents: string[] | null;
          // Wholesale fields (migration 006)
          wholesale_discount_tier: number | null;
          approved_by: string | null;
          admin_notes: string | null;
          // Default shipping
          default_governorate: string | null;
          default_city: string | null;
          default_address: string | null;
          default_postal_code: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          preferred_language?: UserLanguage;
          role?: UserRole;
          wholesale_status?: WholesaleStatus;
          wholesale_applied_at?: string | null;
          wholesale_approved_at?: string | null;
          wholesale_rejected_at?: string | null;
          wholesale_rejection_reason?: string | null;
          business_name?: string | null;
          business_tax_id?: string | null;
          business_address?: string | null;
          business_phone?: string | null;
          business_documents?: string[] | null;
          // Migration 006
          wholesale_discount_tier?: number | null;
          approved_by?: string | null;
          admin_notes?: string | null;
          default_governorate?: string | null;
          default_city?: string | null;
          default_address?: string | null;
          default_postal_code?: string | null;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };

      // ========================================
      // CATEGORIES TABLE
      // ========================================
      categories: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name_ar: string;
          name_fr: string;
          slug: string;
          description_ar: string | null;
          description_fr: string | null;
          parent_id: string | null;
          image_url: string | null;
          icon: string | null;
          sort_order: number;
          is_active: boolean;
        };
        Insert: {
          name_ar: string;
          name_fr: string;
          slug: string;
          description_ar?: string | null;
          description_fr?: string | null;
          parent_id?: string | null;
          image_url?: string | null;
          icon?: string | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
      };

      // ========================================
      // PRODUCTS TABLE
      // ========================================
      products: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name_ar: string;
          name_fr: string;
          description_ar: string | null;
          description_fr: string | null;
          slug: string;
          // Retail pricing (TND)
          price: number;
          compare_at_price: number | null;
          // Wholesale pricing
          wholesale_price: number | null;
          wholesale_min_quantity: number;
          // Inventory
          sku: string | null;
          barcode: string | null;
          quantity: number;
          low_stock_threshold: number;
          track_inventory: boolean;
          // Organization
          category_id: string | null;
          brand: string | null;
          tags: string[] | null;
          // Media
          images: string[];
          // Status
          is_active: boolean;
          is_featured: boolean;
          is_wholesale_only: boolean;
          // Physical attributes
          weight_grams: number | null;
          length_cm: number | null;
          width_cm: number | null;
          height_cm: number | null;
          // SEO
          meta_title_ar: string | null;
          meta_title_fr: string | null;
          meta_description_ar: string | null;
          meta_description_fr: string | null;
          // Additional data
          attributes: Json;
          meta: Json;
        };
        Insert: {
          name_ar: string;
          name_fr: string;
          slug: string;
          price: number;
          description_ar?: string | null;
          description_fr?: string | null;
          compare_at_price?: number | null;
          wholesale_price?: number | null;
          wholesale_min_quantity?: number;
          sku?: string | null;
          barcode?: string | null;
          quantity?: number;
          low_stock_threshold?: number;
          track_inventory?: boolean;
          category_id?: string | null;
          brand?: string | null;
          tags?: string[] | null;
          images?: string[];
          is_active?: boolean;
          is_featured?: boolean;
          is_wholesale_only?: boolean;
          weight_grams?: number | null;
          length_cm?: number | null;
          width_cm?: number | null;
          height_cm?: number | null;
          meta_title_ar?: string | null;
          meta_title_fr?: string | null;
          meta_description_ar?: string | null;
          meta_description_fr?: string | null;
          attributes?: Json;
          meta?: Json;
        };
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };

      // ========================================
      // CARTS TABLE
      // ========================================
      carts: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string | null;
          session_id: string | null;
        };
        Insert: {
          user_id?: string | null;
          session_id?: string | null;
        };
        Update: Partial<Database['public']['Tables']['carts']['Insert']>;
      };

      // ========================================
      // CART ITEMS TABLE
      // ========================================
      cart_items: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          cart_id: string;
          product_id: string;
          quantity: number;
        };
        Insert: {
          cart_id: string;
          product_id: string;
          quantity?: number;
        };
        Update: Partial<Database['public']['Tables']['cart_items']['Insert']>;
      };

      // ========================================
      // ORDERS TABLE
      // ========================================
      orders: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          order_number: string;
          user_id: string | null;
          guest_email: string | null;
          guest_phone: string | null;
          customer_name: string;
          status: OrderStatus;
          payment_method: PaymentMethod;
          payment_status: PaymentStatus;
          paid_at: string | null;
          // Amounts (TND)
          subtotal: number;
          shipping_cost: number;
          discount_amount: number;
          tax_amount: number;
          total: number;
          coupon_code: string | null;
          // Addresses
          shipping_address: ShippingAddress;
          billing_address: ShippingAddress | null;
          // Fulfillment
          shipped_at: string | null;
          delivered_at: string | null;
          tracking_number: string | null;
          carrier: string | null;
          // Notes
          notes: string | null;
          internal_notes: string | null;
          // Wholesale
          is_wholesale_order: boolean;
          // Payment Proof
          bank_transfer_proof_url: string | null;
          // Meta
          meta: Json;
        };
        Insert: {
          customer_name: string;
          payment_method: PaymentMethod;
          subtotal: number;
          total: number;
          shipping_address: ShippingAddress;
          order_number?: string;
          user_id?: string | null;
          guest_email?: string | null;
          guest_phone?: string | null;
          status?: OrderStatus;
          payment_status?: PaymentStatus;
          paid_at?: string | null;
          shipping_cost?: number;
          discount_amount?: number;
          tax_amount?: number;
          coupon_code?: string | null;
          billing_address?: ShippingAddress | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          tracking_number?: string | null;
          carrier?: string | null;
          notes?: string | null;
          internal_notes?: string | null;
          is_wholesale_order?: boolean;
          bank_transfer_proof_url?: string | null;
          meta?: Json;
        };
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };

      // ========================================
      // ORDER ITEMS TABLE
      // ========================================
      order_items: {
        Row: {
          id: string;
          created_at: string;
          order_id: string;
          product_id: string;
          product_snapshot: ProductSnapshot;
          quantity: number;
          unit_price: number;
          total_price: number;
          is_wholesale_price: boolean;
        };
        Insert: {
          order_id: string;
          product_id: string;
          product_snapshot: ProductSnapshot;
          quantity: number;
          unit_price: number;
          total_price: number;
          is_wholesale_price?: boolean;
        };
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>;
      };

      // ========================================
      // PAYMENT VERIFICATIONS TABLE
      // ========================================
      payment_verifications: {
        Row: {
          id: string;
          created_at: string;
          order_id: string;
          verified_by: string;
          payment_method: PaymentMethod;
          amount_verified: number;
          bank_reference: string | null;
          bank_name: string | null;
          transfer_date: string | null;
          flouci_payment_id: string | null;
          flouci_transaction_id: string | null;
          proof_url: string | null;
          notes: string | null;
          action: 'approve' | 'reject';
          rejection_reason: string | null;
        };
        Insert: {
          order_id: string;
          verified_by: string;
          payment_method: PaymentMethod;
          amount_verified: number;
          action: 'approve' | 'reject';
          bank_reference?: string | null;
          bank_name?: string | null;
          transfer_date?: string | null;
          flouci_payment_id?: string | null;
          flouci_transaction_id?: string | null;
          proof_url?: string | null;
          notes?: string | null;
          rejection_reason?: string | null;
        };
        Update: Partial<Database['public']['Tables']['payment_verifications']['Insert']>;
      };

      // ========================================
      // ADDRESSES TABLE
      // ========================================
      addresses: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          label: string;
          full_name: string;
          phone: string;
          address_line_1: string;
          address_line_2: string | null;
          city: string;
          governorate: string;
          postal_code: string | null;
          is_default: boolean;
        };
        Insert: {
          user_id: string;
          label: string;
          full_name: string;
          phone: string;
          address_line_1: string;
          city: string;
          governorate: string;
          address_line_2?: string | null;
          postal_code?: string | null;
          is_default?: boolean;
        };
        Update: Partial<Database['public']['Tables']['addresses']['Insert']>;
      };
    };

    Views: {
      [_ in never]: never;
    };

    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      has_wholesale_access: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      generate_order_number: {
        Args: Record<string, never>;
        Returns: string;
      };
    };

    Enums: {
      user_role: UserRole;
      wholesale_status: WholesaleStatus;
      order_status: OrderStatus;
      payment_status: PaymentStatus;
      payment_method: PaymentMethod;
      user_language: UserLanguage;
    };
  };
}

// ============================================================================
// CONVENIENCE TYPE ALIASES
// ============================================================================

export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

export type InsertTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert'];

export type UpdateTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update'];

export type Enums<T extends keyof Database['public']['Enums']> = 
  Database['public']['Enums'][T];

// Row type aliases
export type Profile = Tables<'profiles'>;
export type Category = Tables<'categories'>;
export type Product = Tables<'products'>;
export type Cart = Tables<'carts'>;
export type CartItem = Tables<'cart_items'>;
export type Order = Tables<'orders'>;
export type OrderItem = Tables<'order_items'>;
export type PaymentVerification = Tables<'payment_verifications'>;
export type Address = Tables<'addresses'>;

// Insert type aliases
export type ProfileInsert = InsertTables<'profiles'>;
export type CategoryInsert = InsertTables<'categories'>;
export type ProductInsert = InsertTables<'products'>;
export type CartInsert = InsertTables<'carts'>;
export type CartItemInsert = InsertTables<'cart_items'>;
export type OrderInsert = InsertTables<'orders'>;
export type OrderItemInsert = InsertTables<'order_items'>;
export type PaymentVerificationInsert = InsertTables<'payment_verifications'>;
export type AddressInsert = InsertTables<'addresses'>;

// Update type aliases
export type ProfileUpdate = UpdateTables<'profiles'>;
export type CategoryUpdate = UpdateTables<'categories'>;
export type ProductUpdate = UpdateTables<'products'>;
export type CartUpdate = UpdateTables<'carts'>;
export type CartItemUpdate = UpdateTables<'cart_items'>;
export type OrderUpdate = UpdateTables<'orders'>;
export type OrderItemUpdate = UpdateTables<'order_items'>;
export type PaymentVerificationUpdate = UpdateTables<'payment_verifications'>;
export type AddressUpdate = UpdateTables<'addresses'>;

// ============================================================================
// EXTENDED TYPES (with relations)
// ============================================================================

/**
 * Product with category relation
 */
export interface ProductWithCategory extends Product {
  category: Category | null;
}

/**
 * Cart item with product relation
 */
export interface CartItemWithProduct extends CartItem {
  product: Product;
}

/**
 * Order with items and user profile
 */
export interface OrderWithDetails extends Order {
  items: OrderItemWithProduct[];
  profile: Profile | null;
}

/**
 * Order item with product snapshot expanded
 */
export interface OrderItemWithProduct extends OrderItem {
  product: Product | null;
}

/**
 * Profile with wholesale business details
 */
export interface ProfileWithWholesale extends Profile {
  isWholesaleApproved: boolean;
  canViewWholesalePrices: boolean;
}

/**
 * Category with parent and children
 */
export interface CategoryWithHierarchy extends Category {
  parent: Category | null;
  children: Category[];
}