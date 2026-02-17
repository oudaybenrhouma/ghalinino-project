/**
 * Order Processing Utilities
 * Ghalinino - Tunisia E-commerce
 *
 * Handles atomic order creation using Supabase RPC.
 * All monetary values are in TND — the same unit used in the database
 * (DECIMAL 10,2) and returned by product queries.
 *
 * payment_status initial value is 'pending' for all payment methods.
 * The DB enum is: pending | paid | failed | refunded.
 */

import { supabase } from '@/lib/supabase';
import type { ShippingAddress, PaymentMethodType, CheckoutTotals } from '@/lib/checkout';
import type { ProductSnapshot } from '@/types/database';

// ============================================================================
// TYPES
// ============================================================================

// Matches the CartItem shape from CartContext (what CheckoutPage actually has)
export interface OrderCartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    nameAr: string;
    nameFr: string;
    price: number;                 // TND — as stored in DB
    wholesalePrice: number | null; // TND — as stored in DB
    compareAtPrice: number | null; // TND — as stored in DB
    images: string[];
    quantity: number;              // stock units
    isActive: boolean;
    wholesaleMinQuantity: number;
  };
}

export interface CreateOrderParams {
  userId?: string;
  guestEmail?: string;
  guestPhone?: string;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethodType;
  totals: CheckoutTotals; // all values in TND
  items: OrderCartItem[];
  isWholesaleOrder: boolean;
  notes?: string;
}

export interface OrderResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  error?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

export function formatOrderNumber(id: string): string {
  return id;
}

/**
 * Convert CartItems to the RPC item format.
 * Prices are already in TND — no conversion needed.
 */
function prepareOrderItems(items: OrderCartItem[], isWholesale: boolean) {
  return items.map((item) => {
    const product = item.product;

    // Pick the applicable unit price (TND)
    const unitPrice =
      isWholesale && product.wholesalePrice
        ? product.wholesalePrice
        : product.price;

    const totalPrice = Math.round(unitPrice * item.quantity * 1000) / 1000;

    const snapshot: ProductSnapshot = {
      id: product.id,
      name_ar: product.nameAr,
      name_fr: product.nameFr,
      sku: null,
      image: product.images[0] || null,
    };

    return {
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: unitPrice,   // TND
      total_price: totalPrice, // TND
      product_snapshot: snapshot,
      is_wholesale_price: isWholesale && !!product.wholesalePrice,
    };
  });
}

// ============================================================================
// CORE ORDER CREATION (RPC)
// ============================================================================

/**
 * Creates an order atomically via the create_order RPC function.
 * All monetary values are in TND, matching DB column types (DECIMAL 10,2).
 */
async function createOrder(
  params: CreateOrderParams,
  initialPaymentStatus: 'paid' | 'pending' = 'pending'
): Promise<OrderResult> {
  const {
    userId,
    guestEmail,
    guestPhone,
    shippingAddress,
    paymentMethod,
    totals,
    items,
    isWholesaleOrder,
    notes,
  } = params;

  try {
    // All totals are already in TND — pass them straight through.
    // Recalculate total from parts to avoid floating-point drift.
    const total = Math.max(
      0,
      Math.round(
        (totals.subtotal + totals.shippingFee + totals.codFee - totals.discount) * 1000
      ) / 1000
    );

    const orderData = {
      user_id: userId || null,
      guest_email: guestEmail || null,
      guest_phone: guestPhone || null,
      customer_name: shippingAddress.fullName,
      status: 'pending',
      payment_method: paymentMethod,
      payment_status: initialPaymentStatus,
      subtotal: totals.subtotal,
      shipping_cost: totals.shippingFee,
      discount_amount: totals.discount,
      tax_amount: 0,
      total,
      shipping_address: shippingAddress,
      billing_address: shippingAddress,
      notes: notes || null,
      is_wholesale_order: isWholesaleOrder,
    };

    const orderItems = prepareOrderItems(items, isWholesaleOrder);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase.rpc('create_order', {
      p_order_data: orderData,
      p_items: orderItems,
    } as any);

    if (error) {
      console.error('RPC create_order error:', error);
      if (error.message?.includes('Insufficient stock')) {
        throw new Error(
          'Some items in your cart are no longer available in the requested quantity.'
        );
      }
      throw new Error(error.message || 'RPC error');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = data as any;

    return {
      success: true,
      orderId: result.order_id,
      orderNumber: result.order_number,
    };
  } catch (error) {
    console.error('Order creation failed:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error occurred during order creation',
    };
  }
}

// ============================================================================
// PAYMENT METHOD SPECIFIC HANDLERS
// ============================================================================

/** Cash on Delivery — payment collected on delivery, status = pending */
export async function createCODOrder(params: CreateOrderParams): Promise<OrderResult> {
  return createOrder({ ...params, paymentMethod: 'cod' }, 'pending');
}

/** Bank Transfer — awaiting manual transfer confirmation, status = pending */
export async function createBankTransferOrder(params: CreateOrderParams): Promise<OrderResult> {
  return createOrder({ ...params, paymentMethod: 'bank_transfer' }, 'pending');
}

/** Flouci — payment initiated online, status = pending until webhook confirms */
export async function createFlouciOrder(params: CreateOrderParams): Promise<OrderResult> {
  return createOrder({ ...params, paymentMethod: 'flouci' }, 'pending');
}