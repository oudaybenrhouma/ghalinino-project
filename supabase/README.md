# 🗄️ Supabase Database Setup Guide

## Tunisia E-commerce Platform - Database Schema

This guide explains how to set up the complete database schema for the dual-tier (retail/wholesale) Tunisia e-commerce platform.

---

## 📋 Table of Contents

1. [Quick Setup](#quick-setup)
2. [Schema Overview](#schema-overview)
3. [Tables Explained](#tables-explained)
4. [RLS Policies](#rls-policies)
5. [Triggers & Functions](#triggers--functions)
6. [Verification Queries](#verification-queries)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Setup

### Step 1: Access Supabase SQL Editor

1. Go to [supabase.com](https://supabase.com) and sign in
2. Select your project (or create a new one)
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Run the Migration

1. Open the file `supabase/migrations/001_initial_schema.sql`
2. Copy the entire contents
3. Paste into the SQL Editor
4. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify the Setup

Run this query to confirm all tables were created:

```sql
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Expected output: 9 tables (addresses, cart_items, carts, categories, order_items, orders, payment_verifications, products, profiles)

---

## 📊 Schema Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    auth.users   │────▶│    profiles     │     │   categories    │
│   (Supabase)    │     │ (extended user) │     │   (bilingual)   │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
         │                       │                       │
         │                       │                       ▼
         │              ┌────────┴────────┐     ┌─────────────────┐
         │              │    addresses    │     │    products     │
         │              │  (saved addr)   │     │ (dual pricing)  │
         │              └─────────────────┘     └────────┬────────┘
         │                       │                       │
         ▼                       │                       │
┌─────────────────┐              │              ┌────────┴────────┐
│      carts      │◀─────────────┘              │   cart_items    │
│  (user/guest)   │◀────────────────────────────│                 │
└─────────────────┘                             └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     orders      │────▶│   order_items   │     │    payment_     │
│ (full lifecycle)│     │  (snapshots)    │     │  verifications  │
└─────────────────┘     └─────────────────┘     │  (admin audit)  │
                                                └─────────────────┘
```

---

## 📑 Tables Explained

### 1. **profiles** (extends auth.users)
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | References auth.users(id) |
| `email` | TEXT | User email |
| `full_name` | TEXT | Display name |
| `phone` | TEXT | Tunisian phone (+216...) |
| `role` | ENUM | customer, wholesale, admin, moderator |
| `wholesale_status` | ENUM | none, pending, approved, rejected |
| `business_name` | TEXT | Company name (for wholesale) |
| `business_tax_id` | TEXT | Matricule fiscal |
| `preferred_language` | ENUM | ar, fr |

**Key Features:**
- Auto-created on user signup via trigger
- Supports wholesale application workflow
- Default shipping address storage

---

### 2. **products** (dual pricing)
| Column | Type | Description |
|--------|------|-------------|
| `name_ar` / `name_fr` | TEXT | Bilingual names |
| `description_ar` / `description_fr` | TEXT | Bilingual descriptions |
| `price` | DECIMAL(10,2) | Retail price in TND |
| `wholesale_price` | DECIMAL(10,2) | Wholesale price (null = no wholesale) |
| `wholesale_min_quantity` | INTEGER | Min qty for wholesale (default: 10) |
| `quantity` | INTEGER | Stock (must be ≥ 0) |
| `is_wholesale_only` | BOOLEAN | Hide from retail customers |

**Key Features:**
- Dual pricing (retail vs wholesale)
- Stock tracking with constraints
- Full-text search indexes (Arabic & French)

---

### 3. **carts** & **cart_items**
| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID | For logged-in users |
| `session_id` | TEXT | For guest carts |

**Key Features:**
- Either `user_id` OR `session_id` (not both)
- Quantity limited to available stock
- Unique constraint on cart_id + product_id

---

### 4. **orders**
| Column | Type | Description |
|--------|------|-------------|
| `order_number` | TEXT | Auto-generated: ORD-YYYYMMDD-XXXX |
| `status` | ENUM | pending → paid → processing → shipped → delivered |
| `payment_method` | ENUM | cod, bank_transfer, flouci |
| `payment_status` | ENUM | pending, paid, failed, refunded |
| `shipping_address` | JSONB | Snapshot of address at order time |
| `is_wholesale_order` | BOOLEAN | Wholesale order flag |

**Order Lifecycle:**
```
pending → paid → processing → shipped → delivered
    ↓                                      
cancelled ←─────────────────────────────────
    ↓
refunded
```

---

### 5. **order_items**
| Column | Type | Description |
|--------|------|-------------|
| `product_snapshot` | JSONB | Product data at order time |
| `unit_price` | DECIMAL | Price paid per unit |
| `is_wholesale_price` | BOOLEAN | Was wholesale price used? |

**Key Features:**
- Denormalized for historical accuracy
- Stock validated before insertion
- Stock decremented after insertion

---

### 6. **payment_verifications** (Admin Audit)
| Column | Type | Description |
|--------|------|-------------|
| `verified_by` | UUID | Admin who verified |
| `action` | TEXT | 'approve' or 'reject' |
| `bank_reference` | TEXT | For bank transfers |
| `flouci_payment_id` | TEXT | For Flouci payments |
| `proof_url` | TEXT | Receipt/screenshot URL |

---

## 🔐 RLS Policies

### Policy Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| **profiles** | Own + Admin | Auto (trigger) | Own + Admin | - |
| **categories** | Public (active) + Admin | Admin | Admin | Admin |
| **products** | Public (active, non-wholesale-only) + Admin | Admin | Admin | Admin |
| **carts** | Own | Own | Own | Own |
| **cart_items** | Own cart | Own cart | Own cart | Own cart |
| **orders** | Own + Admin | Own + Guest | Admin + Cancel own pending | - |
| **order_items** | Own orders + Admin | With order | - | - |
| **payment_verifications** | Admin | Admin | - | - |
| **addresses** | Own | Own | Own | Own |

### Key Policy Explanations

#### Products - Wholesale Visibility
```sql
-- Wholesale-only products are hidden from retail users
USING (
  is_active = true
  AND (
    is_wholesale_only = false
    OR has_wholesale_access()
    OR is_admin()
  )
)
```

#### Orders - User Cancel
```sql
-- Users can only cancel their own PENDING orders
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (status = 'cancelled')
```

---

## ⚙️ Triggers & Functions

### 1. Auto-generate Order Number
```sql
-- Pattern: ORD-YYYYMMDD-0001
-- Resets daily, sequences per day
generate_order_number() → 'ORD-20241215-0001'
```

### 2. Auto-update Timestamps
```sql
-- All tables with updated_at column
update_updated_at_column() → Sets updated_at to NOW()
```

### 3. Stock Validation
```sql
-- Before inserting order_items
validate_order_stock() → Raises exception if:
  - Product is inactive
  - Requested quantity > available stock
```

### 4. Stock Decrement
```sql
-- After inserting order_items
decrease_product_stock() → Reduces product quantity
```

### 5. Stock Restoration on Cancel
```sql
-- After order status changes to cancelled/refunded
restore_stock_on_cancel() → Returns stock to products
```

### 6. Single Default Address
```sql
-- When setting an address as default
ensure_single_default_address() → Unsets other defaults
```

### 7. Auto-create Profile on Signup
```sql
-- After auth.users INSERT
handle_new_user() → Creates matching profile record
```

---

## ✅ Verification Queries

### Check All Tables Exist
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### Check RLS is Enabled
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Count RLS Policies
```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies WHERE schemaname = 'public'
GROUP BY tablename ORDER BY tablename;
```

### Test Order Number Generation
```sql
SELECT generate_order_number();
-- Expected: ORD-YYYYMMDD-0001
```

### Check Admin Function
```sql
-- As an admin user:
SELECT is_admin();
-- Expected: true
```

### Verify Sample Data
```sql
SELECT 'categories' as table_name, COUNT(*) FROM categories
UNION ALL
SELECT 'products', COUNT(*) FROM products;
-- Expected: 5 categories, 5 products
```

---

## 🐛 Troubleshooting

### Error: "permission denied for table profiles"
**Cause:** RLS is enabled but no matching policy
**Fix:** Ensure you're authenticated or check policy conditions

### Error: "Insufficient stock"
**Cause:** `validate_order_stock()` trigger preventing order
**Fix:** Check product quantity before ordering

### Error: "duplicate key value violates unique constraint"
**Cause:** Trying to add same product to cart twice
**Fix:** Use upsert or update quantity instead

### Order number conflicts
**Cause:** High concurrency on same millisecond
**Fix:** The function handles this with sequence counting

### Wholesale prices not showing
**Cause:** User's `wholesale_status` is not 'approved'
**Fix:** Admin must approve the wholesale application

---

## 📦 Sample Data

The migration includes 5 sample categories and 5 sample products for testing:

**Categories:**
- إلكترونيات / Électronique
- ملابس / Vêtements
- منزل ومطبخ / Maison & Cuisine
- جمال وعناية / Beauté & Soins
- رياضة / Sport

**Products:**
- Wireless Bluetooth Earbuds (89.900 TND / 65.000 TND wholesale)
- Men's Cotton Shirt (45.000 TND / 32.000 TND wholesale)
- Ceramic Cookware Set (249.900 TND / 180.000 TND wholesale)
- Face Moisturizing Cream (35.500 TND / 25.000 TND wholesale)
- Professional Football (75.000 TND / 55.000 TND wholesale)

---

## 🔄 Next Steps

After running the migration:

1. **Enable Auth Providers:**
   - Go to Authentication → Providers
   - Enable Email + Magic Link

2. **Configure Storage:**
   - Create `products` bucket for product images
   - Create `documents` bucket for wholesale applications
   - Set appropriate RLS policies

3. **Create Admin User:**
   ```sql
   -- After signing up, promote to admin:
   UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
   ```

4. **Set Environment Variables:**
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

---

Built with ❤️ for Tunisia 🇹🇳
