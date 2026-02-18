/**
 * Email Service
 * Ghalinino — Tunisia E-commerce
 *
 * Thin wrapper around the `send-email` Supabase Edge Function.
 * All calls are fire-and-forget — email failures never block the UI.
 *
 * Emails sent:
 *  1. order_confirmed   → customer after any order placement
 *  2. new_order_admin   → admin after any order placement
 *  3. order_shipped     → customer when admin marks order as shipped
 *  4. order_cancelled   → customer when admin cancels order
 *  5. wholesale_approved → customer when admin approves wholesale account
 *  6. wholesale_rejected → customer when admin rejects wholesale account
 */

import { supabase } from '@/lib/supabase';
import type { Language } from '@/types';

// ─── Shared ───────────────────────────────────────────────────────────────────

async function invokeEmailFunction(event: string, payload: Record<string, unknown>): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: { event, payload },
    });
    if (error) {
      console.warn(`[emailService] ${event} failed:`, error.message);
    }
  } catch (err) {
    console.warn(`[emailService] ${event} threw:`, err);
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmailOrderItem {
  name_ar: string;
  name_fr: string;
  quantity: number;
  unit_price: number;
}

export interface EmailOrderTotals {
  subtotal: number;
  shippingFee: number;
  total: number;
}

export interface EmailShippingAddress {
  addressLine1: string;
  city: string;
  governorate: string;
}

// ─── 1. Order confirmed (customer + admin) ────────────────────────────────────

export async function sendOrderConfirmedEmails(opts: {
  customerEmail: string | null | undefined;
  customerName: string;
  orderId: string;
  orderNumber: string;
  paymentMethod: 'cod' | 'bank_transfer' | 'flouci';
  items: EmailOrderItem[];
  totals: EmailOrderTotals;
  shippingAddress: EmailShippingAddress;
  itemCount: number;
  lang?: Language;
}): Promise<void> {
  const {
    customerEmail,
    customerName,
    orderId,
    orderNumber,
    paymentMethod,
    items,
    totals,
    shippingAddress,
    itemCount,
    lang = 'fr',
  } = opts;

  // Customer confirmation
  if (customerEmail) {
    void invokeEmailFunction('order_confirmed', {
      to: customerEmail,
      customerName,
      orderId,
      orderNumber,
      paymentMethod,
      items,
      totals,
      shippingAddress,
      lang,
    });
  }

  // Admin new order alert
  void invokeEmailFunction('new_order_admin', {
    orderNumber,
    orderId,
    customerName,
    customerContact: customerEmail ?? 'N/A',
    paymentMethod,
    total: totals.total,
    itemCount,
  });
}

// ─── 2. Order shipped (customer) ──────────────────────────────────────────────

export async function sendOrderShippedEmail(opts: {
  customerEmail: string | null | undefined;
  customerName: string;
  orderId: string;
  orderNumber: string;
  lang?: Language;
}): Promise<void> {
  if (!opts.customerEmail) return;
  void invokeEmailFunction('order_shipped', {
    to: opts.customerEmail,
    customerName: opts.customerName,
    orderId: opts.orderId,
    orderNumber: opts.orderNumber,
    lang: opts.lang ?? 'fr',
  });
}

// ─── 3. Order cancelled (customer) ───────────────────────────────────────────

export async function sendOrderCancelledEmail(opts: {
  customerEmail: string | null | undefined;
  customerName: string;
  orderId: string;
  orderNumber: string;
  lang?: Language;
}): Promise<void> {
  if (!opts.customerEmail) return;
  void invokeEmailFunction('order_cancelled', {
    to: opts.customerEmail,
    customerName: opts.customerName,
    orderId: opts.orderId,
    orderNumber: opts.orderNumber,
    lang: opts.lang ?? 'fr',
  });
}

// ─── 4. Wholesale approved (customer) ────────────────────────────────────────

export async function sendWholesaleApprovedEmail(opts: {
  customerEmail: string;
  customerName: string;
}): Promise<void> {
  void invokeEmailFunction('wholesale_approved', {
    to: opts.customerEmail,
    customerName: opts.customerName,
  });
}

// ─── 5. Wholesale rejected (customer) ────────────────────────────────────────

export async function sendWholesaleRejectedEmail(opts: {
  customerEmail: string;
  customerName: string;
  reason?: string;
}): Promise<void> {
  void invokeEmailFunction('wholesale_rejected', {
    to: opts.customerEmail,
    customerName: opts.customerName,
    reason: opts.reason,
  });
}