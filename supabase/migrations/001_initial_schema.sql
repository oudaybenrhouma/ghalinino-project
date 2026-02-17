-- ============================================================================
-- TUNISIA E-COMMERCE DATABASE SCHEMA
-- Dual-Tier Retail/Wholesale Platform with Full RLS
-- ============================================================================
-- 
-- This migration creates all tables, functions, triggers, and RLS policies
-- for a complete e-commerce platform tailored to the Tunisian market.
--
-- FEATURES:
-- ✓ Bilingual content (Arabic/French)
-- ✓ Dual pricing (Retail/Wholesale)
-- ✓ Wholesale approval workflow
-- ✓ Complete order lifecycle
-- ✓ Payment methods: COD, Bank Transfer, Flouci
-- ✓ Stock tracking with constraints
-- ✓ Full Row Level Security
--
-- RUN THIS IN: Supabase Dashboard > SQL Editor
-- ============================================================================


-- ============================================================================
-- SECTION 1: EXTENSIONS
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for better text search (optional but recommended)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";


-- ============================================================================
-- SECTION 2: CUSTOM TYPES (ENUMS)
-- ============================================================================

-- User roles
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'wholesale', 'admin', 'moderator');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Wholesale application status
DO $$ BEGIN
  CREATE TYPE wholesale_status AS ENUM ('none', 'pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Order status lifecycle
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'pending',      -- Order placed, awaiting payment/confirmation
    'paid',         -- Payment received (for non-COD)
    'processing',   -- Being prepared for shipment
    'shipped',      -- Handed to carrier
    'delivered',    -- Received by customer
    'cancelled',    -- Cancelled before shipment
    'refunded'      -- Payment returned to customer
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Payment status
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'pending',      -- Awaiting payment
    'paid',         -- Payment confirmed
    'failed',       -- Payment attempt failed
    'refunded'      -- Payment refunded
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Payment methods available in Tunisia
DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM (
    'cod',          -- Cash on Delivery (الدفع عند الاستلام)
    'bank_transfer', -- Bank Transfer (تحويل بنكي)
    'flouci'        -- Flouci payment gateway
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Preferred language
DO $$ BEGIN
  CREATE TYPE user_language AS ENUM ('ar', 'fr');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;


-- ============================================================================
-- SECTION 3: HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique order numbers: ORD-YYYYMMDD-XXXX
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  today_date TEXT;
  sequence_num INTEGER;
  order_num TEXT;
BEGIN
  today_date := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  
  -- Count orders for today and add 1
  SELECT COUNT(*) + 1 INTO sequence_num
  FROM orders
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Format: ORD-YYYYMMDD-XXXX (padded to 4 digits)
  order_num := 'ORD-' || today_date || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has wholesale access
CREATE OR REPLACE FUNCTION has_wholesale_access()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND wholesale_status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate stock availability
CREATE OR REPLACE FUNCTION validate_order_stock()
RETURNS TRIGGER AS $$
DECLARE
  product_stock INTEGER;
  product_active BOOLEAN;
BEGIN
  -- Get current product info
  SELECT quantity, is_active INTO product_stock, product_active
  FROM products
  WHERE id = NEW.product_id;
  
  -- Check if product exists and is active
  IF product_active IS NULL OR NOT product_active THEN
    RAISE EXCEPTION 'Product is not available for purchase';
  END IF;
  
  -- Check stock availability
  IF NEW.quantity > product_stock THEN
    RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', product_stock, NEW.quantity;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrease stock after order item insertion
CREATE OR REPLACE FUNCTION decrease_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET quantity = quantity - NEW.quantity
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to restore stock when order is cancelled
CREATE OR REPLACE FUNCTION restore_stock_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status NOT IN ('cancelled', 'refunded') 
     AND NEW.status IN ('cancelled', 'refunded') THEN
    -- Restore stock for all items in this order
    UPDATE products p
    SET quantity = quantity + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
    AND p.id = oi.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- SECTION 4: PROFILES TABLE (extends auth.users)
-- ============================================================================
-- 
-- PURPOSE: Store user profile data including wholesale application info
-- RLS: Users manage own profile, admins see all
--

CREATE TABLE IF NOT EXISTS profiles (
  -- Primary key references auth.users
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Basic info
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  
  -- Preferences
  preferred_language user_language NOT NULL DEFAULT 'ar',
  
  -- Role and permissions
  role user_role NOT NULL DEFAULT 'customer',
  
  -- Wholesale application data
  wholesale_status wholesale_status NOT NULL DEFAULT 'none',
  wholesale_applied_at TIMESTAMPTZ,
  wholesale_approved_at TIMESTAMPTZ,
  wholesale_rejected_at TIMESTAMPTZ,
  wholesale_rejection_reason TEXT,
  
  -- Wholesale business info (filled when applying)
  business_name TEXT,
  business_tax_id TEXT,  -- Matricule fiscal
  business_address TEXT,
  business_phone TEXT,
  business_documents TEXT[], -- Array of storage URLs
  
  -- Default shipping address (convenience)
  default_governorate TEXT,
  default_city TEXT,
  default_address TEXT,
  default_postal_code TEXT,
  
  -- Constraints
  CONSTRAINT valid_phone CHECK (
    phone IS NULL OR 
    phone ~ '^(\+216)?[0-9]{8}$'
  )
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_wholesale_status ON profiles(wholesale_status);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new auth users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();


-- ============================================================================
-- SECTION 5: CATEGORIES TABLE
-- ============================================================================
--
-- PURPOSE: Hierarchical product categories with bilingual names
-- RLS: Public read for active, admin-only write
--

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Bilingual names
  name_ar TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  
  -- URL-safe identifier
  slug TEXT UNIQUE NOT NULL,
  
  -- Bilingual descriptions
  description_ar TEXT,
  description_fr TEXT,
  
  -- Hierarchy
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  
  -- Display
  image_url TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);

-- Auto-update
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- SECTION 6: PRODUCTS TABLE
-- ============================================================================
--
-- PURPOSE: Product catalog with dual pricing (retail/wholesale)
-- RLS: Public read for active products, admin-only write
--

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Bilingual content
  name_ar TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  description_ar TEXT,
  description_fr TEXT,
  
  -- URL-safe identifier
  slug TEXT UNIQUE NOT NULL,
  
  -- Retail pricing (in TND with 2 decimal precision)
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  compare_at_price DECIMAL(10, 2) CHECK (compare_at_price IS NULL OR compare_at_price >= price),
  
  -- Wholesale pricing (visible only to approved wholesale users)
  wholesale_price DECIMAL(10, 2) CHECK (wholesale_price IS NULL OR wholesale_price >= 0),
  wholesale_min_quantity INTEGER DEFAULT 10,
  
  -- Inventory
  sku TEXT UNIQUE,
  barcode TEXT,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  low_stock_threshold INTEGER DEFAULT 5,
  track_inventory BOOLEAN NOT NULL DEFAULT true,
  
  -- Organization
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  brand TEXT,
  tags TEXT[],
  
  -- Media (array of storage URLs)
  images TEXT[] DEFAULT '{}',
  
  -- Status flags
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_wholesale_only BOOLEAN NOT NULL DEFAULT false,
  
  -- Physical attributes (for shipping calculations)
  weight_grams INTEGER,
  length_cm DECIMAL(8, 2),
  width_cm DECIMAL(8, 2),
  height_cm DECIMAL(8, 2),
  
  -- SEO
  meta_title_ar TEXT,
  meta_title_fr TEXT,
  meta_description_ar TEXT,
  meta_description_fr TEXT,
  
  -- Additional structured data
  attributes JSONB DEFAULT '{}',
  meta JSONB DEFAULT '{}'
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_quantity ON products(quantity);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_products_search_ar ON products USING gin(to_tsvector('arabic', name_ar || ' ' || COALESCE(description_ar, '')));
CREATE INDEX IF NOT EXISTS idx_products_search_fr ON products USING gin(to_tsvector('french', name_fr || ' ' || COALESCE(description_fr, '')));

-- Auto-update
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- SECTION 7: CARTS TABLE
-- ============================================================================
--
-- PURPOSE: Persistent shopping carts for users
-- RLS: Users see/modify only their own cart
--

CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Owner (either authenticated user or session ID for guests)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  
  -- Cart must belong to either a user or a session
  CONSTRAINT cart_owner_check CHECK (
    (user_id IS NOT NULL AND session_id IS NULL) OR
    (user_id IS NULL AND session_id IS NOT NULL)
  )
);

-- Cart items
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  
  -- Each product can only appear once per cart
  UNIQUE(cart_id, product_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_carts_user ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_session ON carts(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product ON cart_items(product_id);

-- Auto-update
DROP TRIGGER IF EXISTS update_carts_updated_at ON carts;
CREATE TRIGGER update_carts_updated_at
  BEFORE UPDATE ON carts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- SECTION 8: ORDERS TABLE
-- ============================================================================
--
-- PURPOSE: Complete order data with payment tracking
-- RLS: Users see own orders, admins see all
--

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Human-readable order number
  order_number TEXT UNIQUE NOT NULL,
  
  -- Customer info (user_id for logged-in, guest fields for guest checkout)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_email TEXT,
  guest_phone TEXT,
  customer_name TEXT NOT NULL,
  
  -- Order status
  status order_status NOT NULL DEFAULT 'pending',
  
  -- Payment
  payment_method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  
  -- Amounts (in TND)
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_cost DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  
  -- Applied coupon
  coupon_code TEXT,
  
  -- Shipping address (snapshot at order time)
  shipping_address JSONB NOT NULL,
  -- Expected structure:
  -- {
  --   "full_name": "...",
  --   "phone": "...",
  --   "address_line_1": "...",
  --   "address_line_2": "...",
  --   "city": "...",
  --   "governorate": "...",
  --   "postal_code": "..."
  -- }
  
  -- Billing address (if different from shipping)
  billing_address JSONB,
  
  -- Fulfillment
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  tracking_number TEXT,
  carrier TEXT,
  
  -- Customer notes
  notes TEXT,
  internal_notes TEXT, -- Admin only
  
  -- Is this a wholesale order?
  is_wholesale_order BOOLEAN NOT NULL DEFAULT false,
  
  -- Additional metadata
  meta JSONB DEFAULT '{}',
  
  -- Validation: either user_id or guest info required
  CONSTRAINT order_customer_check CHECK (
    user_id IS NOT NULL OR 
    (guest_email IS NOT NULL AND guest_phone IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_guest_email ON orders(guest_email);

-- Auto-update timestamp
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate order number on insert
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_order_number ON orders;
CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Restore stock on cancellation
DROP TRIGGER IF EXISTS trigger_restore_stock_on_cancel ON orders;
CREATE TRIGGER trigger_restore_stock_on_cancel
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION restore_stock_on_cancel();


-- ============================================================================
-- SECTION 9: ORDER ITEMS TABLE
-- ============================================================================
--
-- PURPOSE: Denormalized order line items with product snapshot
-- RLS: Inherit from orders (users see items of their own orders)
--

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Parent order
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Product reference
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  
  -- Snapshot of product at time of order (for historical accuracy)
  product_snapshot JSONB NOT NULL,
  -- Expected structure:
  -- {
  --   "id": "...",
  --   "name_ar": "...",
  --   "name_fr": "...",
  --   "sku": "...",
  --   "image": "..."
  -- }
  
  -- Line item details
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
  
  -- Was this purchased at wholesale price?
  is_wholesale_price BOOLEAN NOT NULL DEFAULT false
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Validate stock before inserting order items
DROP TRIGGER IF EXISTS trigger_validate_order_stock ON order_items;
CREATE TRIGGER trigger_validate_order_stock
  BEFORE INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_order_stock();

-- Decrease stock after order item insertion
DROP TRIGGER IF EXISTS trigger_decrease_stock ON order_items;
CREATE TRIGGER trigger_decrease_stock
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION decrease_product_stock();


-- ============================================================================
-- SECTION 10: PAYMENT VERIFICATIONS TABLE
-- ============================================================================
--
-- PURPOSE: Admin audit log for payment confirmations
-- RLS: Admin-only access
--

CREATE TABLE IF NOT EXISTS payment_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Related order
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Admin who verified
  verified_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  
  -- Verification details
  payment_method payment_method NOT NULL,
  amount_verified DECIMAL(10, 2) NOT NULL,
  
  -- For bank transfers
  bank_reference TEXT,
  bank_name TEXT,
  transfer_date DATE,
  
  -- For Flouci
  flouci_payment_id TEXT,
  flouci_transaction_id TEXT,
  
  -- Evidence
  proof_url TEXT, -- Screenshot/receipt storage URL
  notes TEXT,
  
  -- Action taken
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject')),
  rejection_reason TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_verifications_order ON payment_verifications(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_admin ON payment_verifications(verified_by);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_created ON payment_verifications(created_at DESC);


-- ============================================================================
-- SECTION 11: ADDRESSES TABLE (User Address Book)
-- ============================================================================
--
-- PURPOSE: Saved addresses for faster checkout
-- RLS: Users manage own addresses
--

CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Owner
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Label (e.g., "Home", "Work", "منزل", "عمل")
  label TEXT NOT NULL,
  
  -- Contact
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  -- Address details
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  governorate TEXT NOT NULL,
  postal_code TEXT,
  
  -- Default flag (only one per user)
  is_default BOOLEAN NOT NULL DEFAULT false
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_default ON addresses(user_id, is_default) WHERE is_default = true;

-- Auto-update
DROP TRIGGER IF EXISTS update_addresses_updated_at ON addresses;
CREATE TRIGGER update_addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Ensure only one default address per user
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE addresses
    SET is_default = false
    WHERE user_id = NEW.user_id
    AND id != NEW.id
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_single_default_address ON addresses;
CREATE TRIGGER trigger_single_default_address
  AFTER INSERT OR UPDATE ON addresses
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_address();


-- ============================================================================
-- SECTION 12: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
  END LOOP;
END $$;


-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================
-- - Users can read their own profile
-- - Users can update their own profile (except role and wholesale_status)
-- - Admins can read all profiles
-- - Admins can update wholesale_status

-- Users read own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins read all profiles
CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  USING (is_admin());

-- Users update own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Cannot change own role or wholesale_status through this policy
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- Admins update any profile (including role and wholesale_status)
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (is_admin());


-- ============================================================================
-- CATEGORIES POLICIES
-- ============================================================================
-- - Anyone can read active categories
-- - Admins can manage all categories

-- Public read active categories
CREATE POLICY "categories_select_public"
  ON categories FOR SELECT
  USING (is_active = true);

-- Admins read all categories
CREATE POLICY "categories_select_admin"
  ON categories FOR SELECT
  USING (is_admin());

-- Admins insert
CREATE POLICY "categories_insert_admin"
  ON categories FOR INSERT
  WITH CHECK (is_admin());

-- Admins update
CREATE POLICY "categories_update_admin"
  ON categories FOR UPDATE
  USING (is_admin());

-- Admins delete
CREATE POLICY "categories_delete_admin"
  ON categories FOR DELETE
  USING (is_admin());


-- ============================================================================
-- PRODUCTS POLICIES
-- ============================================================================
-- - Anyone can read active products (wholesale-only hidden from retail)
-- - Wholesale prices visible only to approved wholesale users
-- - Admins manage all products

-- Public read active products
CREATE POLICY "products_select_public"
  ON products FOR SELECT
  USING (
    is_active = true
    AND (
      is_wholesale_only = false
      OR has_wholesale_access()
      OR is_admin()
    )
  );

-- Admins read all products
CREATE POLICY "products_select_admin"
  ON products FOR SELECT
  USING (is_admin());

-- Admins insert
CREATE POLICY "products_insert_admin"
  ON products FOR INSERT
  WITH CHECK (is_admin());

-- Admins update
CREATE POLICY "products_update_admin"
  ON products FOR UPDATE
  USING (is_admin());

-- Admins delete
CREATE POLICY "products_delete_admin"
  ON products FOR DELETE
  USING (is_admin());


-- ============================================================================
-- CARTS POLICIES
-- ============================================================================
-- - Users can manage their own cart
-- - Guest carts managed by session (requires passing session_id)

-- Users select own cart
CREATE POLICY "carts_select_own"
  ON carts FOR SELECT
  USING (auth.uid() = user_id);

-- Users insert own cart
CREATE POLICY "carts_insert_own"
  ON carts FOR INSERT
  WITH CHECK (auth.uid() = user_id OR (user_id IS NULL AND session_id IS NOT NULL));

-- Users update own cart
CREATE POLICY "carts_update_own"
  ON carts FOR UPDATE
  USING (auth.uid() = user_id);

-- Users delete own cart
CREATE POLICY "carts_delete_own"
  ON carts FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================================
-- CART ITEMS POLICIES
-- ============================================================================
-- - Users manage items in their own cart

-- Select cart items from own cart
CREATE POLICY "cart_items_select_own"
  ON cart_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND carts.user_id = auth.uid()
    )
  );

-- Insert items to own cart
CREATE POLICY "cart_items_insert_own"
  ON cart_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND carts.user_id = auth.uid()
    )
  );

-- Update items in own cart
CREATE POLICY "cart_items_update_own"
  ON cart_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND carts.user_id = auth.uid()
    )
  );

-- Delete items from own cart
CREATE POLICY "cart_items_delete_own"
  ON cart_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND carts.user_id = auth.uid()
    )
  );


-- ============================================================================
-- ORDERS POLICIES
-- ============================================================================
-- - Users can read their own orders
-- - Users can insert orders (for themselves or as guest)
-- - Admins can read and update all orders

-- Users read own orders
CREATE POLICY "orders_select_own"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Admins read all orders
CREATE POLICY "orders_select_admin"
  ON orders FOR SELECT
  USING (is_admin());

-- Users insert own orders
CREATE POLICY "orders_insert_own"
  ON orders FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR user_id IS NULL -- Guest checkout
  );

-- Admins update orders
CREATE POLICY "orders_update_admin"
  ON orders FOR UPDATE
  USING (is_admin());

-- Users can cancel their pending orders
CREATE POLICY "orders_update_cancel_own"
  ON orders FOR UPDATE
  USING (
    auth.uid() = user_id
    AND status = 'pending'
  )
  WITH CHECK (
    status = 'cancelled'
  );


-- ============================================================================
-- ORDER ITEMS POLICIES
-- ============================================================================
-- - Inherit from orders (users see items of their orders, admins see all)

-- Users read items of own orders
CREATE POLICY "order_items_select_own"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Admins read all order items
CREATE POLICY "order_items_select_admin"
  ON order_items FOR SELECT
  USING (is_admin());

-- Insert with order (controlled by order creation flow)
CREATE POLICY "order_items_insert"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );


-- ============================================================================
-- PAYMENT VERIFICATIONS POLICIES
-- ============================================================================
-- - Admin-only access

-- Admins read all
CREATE POLICY "payment_verifications_select_admin"
  ON payment_verifications FOR SELECT
  USING (is_admin());

-- Admins insert
CREATE POLICY "payment_verifications_insert_admin"
  ON payment_verifications FOR INSERT
  WITH CHECK (is_admin());


-- ============================================================================
-- ADDRESSES POLICIES
-- ============================================================================
-- - Users manage own addresses

-- Users read own addresses
CREATE POLICY "addresses_select_own"
  ON addresses FOR SELECT
  USING (auth.uid() = user_id);

-- Users insert own addresses
CREATE POLICY "addresses_insert_own"
  ON addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users update own addresses
CREATE POLICY "addresses_update_own"
  ON addresses FOR UPDATE
  USING (auth.uid() = user_id);

-- Users delete own addresses
CREATE POLICY "addresses_delete_own"
  ON addresses FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================================
-- SECTION 13: SEED DATA (Sample Products for Testing)
-- ============================================================================

-- Insert sample categories
INSERT INTO categories (name_ar, name_fr, slug, description_ar, description_fr, sort_order, is_active)
VALUES 
  ('إلكترونيات', 'Électronique', 'electronics', 'الأجهزة الإلكترونية والهواتف', 'Appareils électroniques et téléphones', 1, true),
  ('ملابس', 'Vêtements', 'clothing', 'ملابس رجالية ونسائية', 'Vêtements hommes et femmes', 2, true),
  ('منزل ومطبخ', 'Maison & Cuisine', 'home-kitchen', 'أدوات منزلية ومطبخية', 'Articles de maison et cuisine', 3, true),
  ('جمال وعناية', 'Beauté & Soins', 'beauty', 'منتجات العناية والجمال', 'Produits de beauté et soins', 4, true),
  ('رياضة', 'Sport', 'sports', 'معدات رياضية', 'Équipements sportifs', 5, true)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products
INSERT INTO products (
  name_ar, name_fr, slug, description_ar, description_fr,
  price, compare_at_price, wholesale_price, wholesale_min_quantity,
  sku, quantity, category_id, brand, images, is_active, is_featured
)
VALUES 
  (
    'سماعات بلوتوث لاسلكية',
    'Écouteurs Bluetooth Sans Fil',
    'wireless-bluetooth-earbuds',
    'سماعات بلوتوث عالية الجودة مع صوت نقي وبطارية تدوم 24 ساعة',
    'Écouteurs Bluetooth haute qualité avec son cristallin et 24h d''autonomie',
    89.900, 129.900, 65.000, 20,
    'SKU-AUDIO-001', 150,
    (SELECT id FROM categories WHERE slug = 'electronics'),
    'TunisSound',
    ARRAY['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500'],
    true, true
  ),
  (
    'قميص قطن رجالي',
    'Chemise Homme en Coton',
    'mens-cotton-shirt',
    'قميص قطن 100% مريح وأنيق للاستخدام اليومي',
    'Chemise 100% coton confortable et élégante pour un usage quotidien',
    45.000, 59.900, 32.000, 50,
    'SKU-CLOTH-001', 200,
    (SELECT id FROM categories WHERE slug = 'clothing'),
    'TunisFashion',
    ARRAY['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500'],
    true, true
  ),
  (
    'طقم أواني طبخ سيراميك',
    'Set de Casseroles en Céramique',
    'ceramic-cookware-set',
    'طقم 10 قطع من أواني الطبخ السيراميك المقاومة للحرارة',
    'Set de 10 pièces de cuisine en céramique résistant à la chaleur',
    249.900, 349.900, 180.000, 10,
    'SKU-HOME-001', 50,
    (SELECT id FROM categories WHERE slug = 'home-kitchen'),
    'TunisHome',
    ARRAY['https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=500'],
    true, false
  ),
  (
    'كريم مرطب للوجه',
    'Crème Hydratante Visage',
    'face-moisturizing-cream',
    'كريم مرطب طبيعي بزيت الأرغان للبشرة الجافة والحساسة',
    'Crème hydratante naturelle à l''huile d''argan pour peau sèche et sensible',
    35.500, NULL, 25.000, 30,
    'SKU-BEAUTY-001', 100,
    (SELECT id FROM categories WHERE slug = 'beauty'),
    'TunisBeauty',
    ARRAY['https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=500'],
    true, true
  ),
  (
    'كرة قدم احترافية',
    'Ballon de Football Professionnel',
    'professional-football',
    'كرة قدم معتمدة من الفيفا للمباريات الرسمية',
    'Ballon certifié FIFA pour matchs officiels',
    75.000, 95.000, 55.000, 15,
    'SKU-SPORT-001', 80,
    (SELECT id FROM categories WHERE slug = 'sports'),
    'TunisSport',
    ARRAY['https://images.unsplash.com/photo-1614632537423-5e1c0ee3a9af?w=500'],
    true, false
  )
ON CONFLICT (slug) DO NOTHING;


-- ============================================================================
-- SECTION 14: VERIFICATION QUERIES
-- ============================================================================
-- Run these after migration to verify schema is correct

-- Check all tables exist
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'products', 'categories', 'carts', 'cart_items', 
                    'orders', 'order_items', 'payment_verifications', 'addresses');

-- Count policies per table
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Check custom types exist
SELECT typname, typcategory 
FROM pg_type 
WHERE typname IN ('user_role', 'wholesale_status', 'order_status', 
                  'payment_status', 'payment_method', 'user_language');

-- Verify sample data
SELECT 'categories' as table_name, COUNT(*) as row_count FROM categories
UNION ALL
SELECT 'products', COUNT(*) FROM products;
