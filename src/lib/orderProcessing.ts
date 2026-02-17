/**
 * Order Processing Utilities
 * Ghalinino - Tunisia E-commerce
 *
 * Handles atomic order creation using Supabase RPC.
 *
 * ─── BUG FIXES ────────────────────────────────────────────────────────────────
 *
 * 1. payment_status: 'unpaid' → 'pending'
 *    The DB enum is: pending | paid | failed | refunded
 *    'unpaid' does not exist → Postgres returns 400 immediately.
 *    All three payment handlers now pass 'pending' as the initial status.
 *
 * 2. Millimes → TND conversion on all monetary values sent to the RPC
 *    - The codebase stores prices in millimes (7000 = 7 TND).
 *    - DB columns are DECIMAL(10,2), meaning Postgres expects TND (7.000).
 *    - orderProcessing.ts was forwarding raw millime values directly into the
 *      RPC payload:  subtotal, shipping_cost, total, unit_price, total_price.
 *    - Fix: divide every monetary value by 1000 before the RPC call.
 *    - checkout.ts's calculateCheckoutTotals also uses millimes internally,
 *      so totals.subtotal, totals.shippingFee, totals.total all need /1000.
 *
 * 3. Shipping recalculation removed from orderProcessing
 *    - orderProcessing was importing calculateShipping() from shipping.ts
 *      (which returns millimes) and overriding the shipping value already
 *      calculated by the checkout page. This introduced a second source of
 *      truth and the wrong unit. Now we trust totals.shippingFee directly
 *      (converted from millimes to TND), which is what the user saw on screen.
 *
 * 4. items type: CartContext.CartItem vs useCart.CartItemWithProduct
 *    Both types have the same runtime shape. The CreateOrderParams.items type
 *    is now typed as the CartContext CartItem to match what CheckoutPage passes.
 * ─────────────────────────────────────────────────────────────────────────────
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
    price: number;          // millimes
    wholesalePrice: number | null; // millimes
    compareAtPrice: number | null; // millimes
    images: string[];
    quantity: number;       // stock
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
  totals: CheckoutTotals;    // all values in millimes
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

/** Convert millimes to TND for DB storage */
const toTND = (millimes: number): number =>
  Math.round((millimes / 1000) * 1000) / 1000; // keep 3 decimal places

export function formatOrderNumber(id: string): string {
  return id;
}

/**
 * Convert CartItems to the RPC item format.
 * unit_price and total_price are converted from millimes → TND.
 */
function prepareOrderItems(items: OrderCartItem[], isWholesale: boolean) {
  return items.map((item) => {
    const product = item.product;

    // Determine which price applies (still in millimes here)
    const unitPriceMillimes =
      isWholesale && product.wholesalePrice
        ? product.wholesalePrice
        : product.price;

    // Convert to TND for the DB
    const unitPrice = toTND(unitPriceMillimes);
    const totalPrice = unitPrice * item.quantity;

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
      unit_price: unitPrice,       // TND
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
 *
 * payment_status must be one of: pending | paid | failed | refunded
 * All monetary values sent to the RPC must be in TND (not millimes).
 */
async function createOrder(
  params: CreateOrderParams,
  // FIX: 'unpaid' does not exist in the DB enum — use 'pending' for all
  // pre-payment states. The admin panel updates to 'paid' once confirmed.
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
    // FIX: convert all monetary totals from millimes → TND
    // totals.subtotal, totals.shippingFee, totals.codFee, totals.total
    // are all produced by calculateCheckoutTotals() which works in millimes.
    const subtotalTND   = toTND(totals.subtotal);
    const shippingTND   = toTND(totals.shippingFee);
    const codFeeTND     = toTND(totals.codFee);
    const discountTND   = toTND(totals.discount);
    // total = subtotal + shipping + codFee - discount (recalculate in TND to avoid rounding drift)
    const totalTND      = Math.max(0, subtotalTND + shippingTND + codFeeTND - discountTND);

    const orderData = {
      user_id: userId || null,
      guest_email: guestEmail || null,
      guest_phone: guestPhone || null,
      customer_name: shippingAddress.fullName,
      status: 'pending',
      payment_method: paymentMethod,
      payment_status: initialPaymentStatus,  // FIX: 'pending' not 'unpaid'
      subtotal: subtotalTND,                 // FIX: TND not millimes
      shipping_cost: shippingTND,            // FIX: TND not millimes
      discount_amount: discountTND,          // FIX: TND not millimes
      tax_amount: 0,
      total: totalTND,                       // FIX: TND not millimes
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
      // Surface the actual Postgres error message so it's visible in the console
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