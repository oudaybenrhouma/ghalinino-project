-- ============================================================================
-- ORDER PROCESSING FUNCTIONS
-- Atomic transaction handling for order creation
-- ============================================================================

-- Function to create an order atomically
-- This ensures stock is checked and updated within the same transaction as order creation
CREATE OR REPLACE FUNCTION create_order(
  p_order_data JSONB,
  p_items JSONB[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_user_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INTEGER;
  v_product_stock INTEGER;
  v_product_active BOOLEAN;
  v_total_amount DECIMAL;
  v_item_total DECIMAL;
  v_current_total DECIMAL := 0;
BEGIN
  -- 1. Extract basic info
  v_user_id := auth.uid();
  
  -- 2. Generate order number
  v_order_number := generate_order_number();
  
  -- 3. Insert Order
  INSERT INTO orders (
    order_number,
    user_id,
    guest_email,
    guest_phone,
    customer_name,
    status,
    payment_method,
    payment_status,
    subtotal,
    shipping_cost,
    discount_amount,
    tax_amount,
    total,
    shipping_address,
    billing_address,
    notes,
    is_wholesale_order
  ) VALUES (
    v_order_number,
    CASE WHEN p_order_data->>'user_id' IS NOT NULL THEN (p_order_data->>'user_id')::UUID ELSE v_user_id END,
    p_order_data->>'guest_email',
    p_order_data->>'guest_phone',
    p_order_data->>'customer_name',
    (p_order_data->>'status')::order_status,
    (p_order_data->>'payment_method')::payment_method,
    (p_order_data->>'payment_status')::payment_status,
    (p_order_data->>'subtotal')::DECIMAL,
    (p_order_data->>'shipping_cost')::DECIMAL,
    COALESCE((p_order_data->>'discount_amount')::DECIMAL, 0),
    COALESCE((p_order_data->>'tax_amount')::DECIMAL, 0),
    (p_order_data->>'total')::DECIMAL,
    p_order_data->'shipping_address',
    p_order_data->'billing_address',
    p_order_data->>'notes',
    COALESCE((p_order_data->>'is_wholesale_order')::BOOLEAN, false)
  )
  RETURNING id INTO v_order_id;

  -- 4. Process Items
  FOREACH v_item IN ARRAY p_items
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;
    
    -- Lock product row for update to prevent race conditions
    SELECT quantity, is_active INTO v_product_stock, v_product_active
    FROM products
    WHERE id = v_product_id
    FOR UPDATE;
    
    -- Validation
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found', v_product_id;
    END IF;
    
    IF NOT v_product_active THEN
      RAISE EXCEPTION 'Product % is not active', v_product_id;
    END IF;
    
    IF v_product_stock < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product %. Requested: %, Available: %', v_product_id, v_quantity, v_product_stock;
    END IF;
    
    -- Calculate item total for verification (optional, but good practice)
    v_item_total := (v_item->>'unit_price')::DECIMAL * v_quantity;
    v_current_total := v_current_total + v_item_total;
    
    -- Insert Order Item
    INSERT INTO order_items (
      order_id,
      product_id,
      product_snapshot,
      quantity,
      unit_price,
      total_price,
      is_wholesale_price
    ) VALUES (
      v_order_id,
      v_product_id,
      v_item->'product_snapshot',
      v_quantity,
      (v_item->>'unit_price')::DECIMAL,
      v_item_total,
      COALESCE((v_item->>'is_wholesale_price')::BOOLEAN, false)
    );
    
    -- Update Stock (this will be committed only if the transaction succeeds)
    UPDATE products
    SET quantity = quantity - v_quantity
    WHERE id = v_product_id;
    
  END LOOP;

  -- 5. Clear Cart (if user is authenticated)
  IF v_user_id IS NOT NULL THEN
    DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = v_user_id);
  END IF;

  -- 6. Return success
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number
  );

EXCEPTION WHEN OTHERS THEN
  -- Re-raise exception to be handled by the client
  RAISE;
END;
$$;

-- Grant execute permission to authenticated users and anon (for guest checkout)
GRANT EXECUTE ON FUNCTION create_order TO authenticated, anon;

-- ============================================================================
-- STORAGE BUCKET FOR PAYMENT PROOFS
-- ============================================================================

-- Create policy for payment-proofs bucket (assuming bucket created via dashboard)
-- Policy: Users can upload proofs for their own orders
-- Note: Requires row-level security on storage.objects

-- We need a way to link the file to the order. Typically done via folder structure: {order_id}/{filename}
-- But checking order ownership in storage policy is complex without joins.
-- Simpler approach: Allow authenticated users to upload to 'payment-proofs' folder matching their user ID or public upload for guests if needed.
-- For now, let's assume authenticated upload to their own folder.

-- (Policies would go here, similar to previous migration)
