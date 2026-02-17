-- ============================================================================
-- MIGRATION: 006_wholesale_enhancements.sql
-- Add volume discounts and enhance wholesale features
-- ============================================================================

-- ============================================================================
-- SECTION 1: VOLUME DISCOUNT TIERS (Future-Proofing)
-- ============================================================================

-- Global volume discount configuration
CREATE TABLE IF NOT EXISTS volume_discount_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Tier configuration
  name TEXT NOT NULL, -- e.g., "Tier 1", "Bronze", "Silver"
  min_quantity INTEGER NOT NULL CHECK (min_quantity > 0),
  discount_percentage DECIMAL(5,2) NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  
  -- Scope
  applies_to TEXT NOT NULL DEFAULT 'all', -- 'all', 'category', 'product'
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  
  -- Active status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Ensure only one scope is set
  CONSTRAINT valid_scope CHECK (
    (applies_to = 'all' AND category_id IS NULL AND product_id IS NULL) OR
    (applies_to = 'category' AND category_id IS NOT NULL AND product_id IS NULL) OR
    (applies_to = 'product' AND category_id IS NULL AND product_id IS NOT NULL)
  )
);

-- Index for lookups
CREATE INDEX idx_volume_discounts_active ON volume_discount_tiers(is_active) WHERE is_active = true;
CREATE INDEX idx_volume_discounts_category ON volume_discount_tiers(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX idx_volume_discounts_product ON volume_discount_tiers(product_id) WHERE product_id IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER update_volume_discount_tiers_updated_at
  BEFORE UPDATE ON volume_discount_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (read-only for customers, full access for admins)
ALTER TABLE volume_discount_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "volume_discounts_select_all"
  ON volume_discount_tiers FOR SELECT
  USING (is_active = true);

CREATE POLICY "volume_discounts_manage_admin"
  ON volume_discount_tiers FOR ALL
  USING (is_admin());


-- ============================================================================
-- SECTION 2: ENHANCE PROFILES TABLE
-- ============================================================================

-- Add wholesale discount tier to profiles (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'wholesale_discount_tier'
  ) THEN
    ALTER TABLE profiles ADD COLUMN wholesale_discount_tier INTEGER DEFAULT 0 CHECK (wholesale_discount_tier >= 0 AND wholesale_discount_tier <= 3);
  END IF;
END $$;

-- Add approved_by tracking
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE profiles ADD COLUMN approved_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Add rejection notes
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE profiles ADD COLUMN admin_notes TEXT;
  END IF;
END $$;


-- ============================================================================
-- SECTION 3: HELPER FUNCTIONS
-- ============================================================================

-- Function to get applicable volume discount for a product quantity
CREATE OR REPLACE FUNCTION get_volume_discount(
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_discount DECIMAL(5,2) := 0;
  v_category_id UUID;
BEGIN
  -- Get product's category
  SELECT category_id INTO v_category_id
  FROM products
  WHERE id = p_product_id;
  
  -- Check product-specific discount first
  SELECT discount_percentage INTO v_discount
  FROM volume_discount_tiers
  WHERE product_id = p_product_id
    AND is_active = true
    AND p_quantity >= min_quantity
  ORDER BY min_quantity DESC
  LIMIT 1;
  
  -- If no product-specific discount, check category
  IF v_discount IS NULL OR v_discount = 0 THEN
    SELECT discount_percentage INTO v_discount
    FROM volume_discount_tiers
    WHERE category_id = v_category_id
      AND is_active = true
      AND p_quantity >= min_quantity
    ORDER BY min_quantity DESC
    LIMIT 1;
  END IF;
  
  -- If still no discount, check global
  IF v_discount IS NULL OR v_discount = 0 THEN
    SELECT discount_percentage INTO v_discount
    FROM volume_discount_tiers
    WHERE applies_to = 'all'
      AND is_active = true
      AND p_quantity >= min_quantity
    ORDER BY min_quantity DESC
    LIMIT 1;
  END IF;
  
  RETURN COALESCE(v_discount, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to calculate wholesale minimum order value
CREATE OR REPLACE FUNCTION get_wholesale_minimum()
RETURNS DECIMAL(10,2) AS $$
BEGIN
  -- Hardcoded for now, can be moved to settings table later
  RETURN 100.00; -- 100 TND
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get free shipping threshold for wholesale
CREATE OR REPLACE FUNCTION get_wholesale_free_shipping_threshold()
RETURNS DECIMAL(10,2) AS $$
BEGIN
  RETURN 500.00; -- 500 TND
END;
$$ LANGUAGE plpgsql STABLE;


-- ============================================================================
-- SECTION 4: SEED VOLUME DISCOUNTS (Example Data)
-- ============================================================================

-- Global volume discounts (apply to all products)
INSERT INTO volume_discount_tiers (name, min_quantity, discount_percentage, applies_to, is_active)
VALUES 
  ('Volume Tier 1', 10, 5.00, 'all', true),
  ('Volume Tier 2', 20, 10.00, 'all', true),
  ('Volume Tier 3', 50, 15.00, 'all', true),
  ('Volume Tier 4', 100, 20.00, 'all', true)
ON CONFLICT DO NOTHING;

-- Example: Product-specific discount for first product
INSERT INTO volume_discount_tiers (
  name, 
  min_quantity, 
  discount_percentage, 
  applies_to, 
  product_id,
  is_active
)
SELECT 
  'Bulk Electronics Discount',
  30,
  12.00,
  'product',
  id,
  true
FROM products
WHERE slug = 'wireless-bluetooth-earbuds'
LIMIT 1
ON CONFLICT DO NOTHING;


-- ============================================================================
-- SECTION 5: VERIFICATION
-- ============================================================================

-- Verify new tables
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('volume_discount_tiers')
ORDER BY table_name;

-- Verify new columns in profiles
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('wholesale_discount_tier', 'approved_by', 'admin_notes')
ORDER BY column_name;

-- Test volume discount function
SELECT get_volume_discount(
  (SELECT id FROM products LIMIT 1),
  25
) as discount_for_25_units;

-- Test minimum order function
SELECT get_wholesale_minimum() as min_order,
       get_wholesale_free_shipping_threshold() as free_shipping_threshold;