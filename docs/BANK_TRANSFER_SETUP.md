# Bank Transfer Setup & Verification

## Overview
The Bank Transfer payment method allows customers to place an order without immediate payment. The system creates the order with `pending` status and `unpaid` payment status, then directs the user to a page with bank details and a proof upload form.

## Implementation Details

### 1. Order Creation (`src/lib/orderProcessing.ts`)
- **Function:** `createBankTransferOrder`
- **Method:** Calls `createOrder` with `paymentMethod: 'bank_transfer'`
- **Status:** Order created as `pending`
- **Payment Status:** `unpaid` (waiting for customer transfer)
- **Atomicity:** Uses Supabase RPC `create_order` to ensure stock is reserved only if order creation succeeds.

### 2. Database Handling (`supabase/migrations/003_order_processing.sql`)
- The RPC function handles `p_payment_method` dynamically.
- Stock is deducted immediately to reserve items.
- If payment is not received within X days (future feature), a cron job could cancel the order and restore stock.

### 3. User Flow
1. **Checkout:** User selects "Bank Transfer".
2. **Processing:** `createBankTransferOrder` is called.
3. **Success:** User redirected to `/order-bank-transfer/:orderNumber`.
4. **Instructions:** User sees bank details (RIB, etc.).
5. **Proof Upload:** User uploads receipt via `PaymentProofUploader`.
   - Upload goes to `payment-proofs` bucket.
   - (Future) Admin verifies proof -> marks order as `paid`.

## Verification Steps

1. **Add Items to Cart:**
   - Add a product with known stock (e.g., 10).
   - Go to checkout.

2. **Select Bank Transfer:**
   - Choose "Virement Bancaire" / "Bank Transfer".
   - Fill shipping info.
   - Click "Place Order".

3. **Verify Database:**
   - Check `orders` table: New order should exist with `payment_method = 'bank_transfer'` and `payment_status = 'unpaid'`.
   - Check `products` table: Stock should be reduced by quantity bought.
   - Check `cart_items` table: Cart should be empty for that user.

4. **Verify Redirect:**
   - Browser should be on `/order-bank-transfer/ORD-...`.

## Troubleshooting

- **"Insufficient Stock" Error:**
  - Ensure `create_order` RPC logic checks `v_product_stock < v_quantity`.
  
- **Upload Fails:**
  - Check RLS policies on `payment-proofs` bucket.
  - Ensure user is authenticated (or allow public uploads for guest checkout if supported).
