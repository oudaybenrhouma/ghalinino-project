# 📦 Order History & Tracking Setup

## Overview
The order history system allows customers to view their past orders and track the status of current ones in real-time.

## Features
- **Order History**: List view with status filters (Pending, Processing, Shipped, etc.).
- **Order Details**: Comprehensive view including timeline, items, shipping address, and payment info.
- **Real-time Updates**: Live status updates via Supabase Realtime subscriptions.
- **Payment Proofs**: View uploaded bank transfer receipts securely.

## 🛠️ Components

### `OrderHistoryPage` (`src/pages/account/OrderHistory.tsx`)
- Fetches orders using `useOrders` hook.
- Client-side filtering by status.
- Responsive list layout.

### `OrderDetailPage` (`src/pages/account/OrderDetail.tsx`)
- Fetches single order with items using `useOrderDetail`.
- Subscribes to real-time changes for the specific order ID.
- Displays `OrderTimeline` for visual progress.

### `OrderTimeline` (`src/components/account/OrderTimeline.tsx`)
- Visual stepper showing the order lifecycle:
  `Pending` → `Paid` → `Processing` → `Shipped` → `Delivered`
- Handles cancelled/refunded states with distinct styling.

### `PaymentProofModal` (`src/components/account/PaymentProofModal.tsx`)
- Securely fetches signed URLs for private storage items.
- Displays payment proof images in a modal.

## 🔌 Hooks

### `useOrders`
- Fetches all orders for the authenticated user.
- Sorts by `created_at` descending.

### `useOrderDetail`
- Fetches a single order + order items.
- **Real-time:** Sets up a Supabase subscription to listen for `UPDATE` events on the `orders` table for the specific ID.
- Automatically updates UI when Admin changes status.

## ⚙️ Supabase Configuration

### Real-time Setup
To enable real-time updates for order status, you must enable replication for the `orders` table in Supabase:

1. Go to **Database** → **Replication** in the Supabase Dashboard.
2. Enable replication for the `orders` table.
3. Alternatively, run SQL:
   ```sql
   ALTER TABLE orders REPLICA IDENTITY FULL;
   ```

### Storage RLS
Ensure the `payment-proofs` bucket is private and has proper RLS policies (as set up in previous phases) to allow users to read their own proofs via signed URLs.

## 🧪 Testing

1. **Place an Order**: Go through checkout.
2. **View History**: Navigate to `/account/orders`.
3. **View Details**: Click on the new order.
4. **Test Real-time**:
   - Keep the browser open on the Order Detail page.
   - In Supabase Dashboard (or SQL), update the order status:
     ```sql
     UPDATE orders SET status = 'processing' WHERE order_number = 'ORD-XXXX';
     ```
   - Verify the UI updates instantly without refresh.
