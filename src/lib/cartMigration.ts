/**
 * Guest Cart Migration Utility
 * Ghalinino - Tunisia E-commerce
 * 
 * Migrates guest cart items from localStorage to Supabase on user login.
 * Handles duplicates by keeping the maximum quantity.
 */

import { supabase } from '@/lib/supabase';
import { 
  getGuestCartItems, 
  clearGuestCartStorage,
  type GuestCartItem,
} from '@/lib/cartStorage';

// ============================================================================
// TYPES
// ============================================================================

interface CartRow {
  id: string;
}

interface CartItemRow {
  product_id: string;
  quantity: number;
}

// ============================================================================
// MIGRATE GUEST CART TO USER CART
// ============================================================================

/**
 * Migrates guest cart items from localStorage to Supabase.
 * Called after successful login.
 * 
 * Strategy:
 * 1. Get guest cart from localStorage
 * 2. Get or create user's cart in Supabase
 * 3. For each guest item:
 *    - If product already in cart: keep maximum quantity
 *    - If product not in cart: add it
 * 4. Clear guest cart from localStorage
 * 
 * @param userId - The authenticated user's ID
 * @returns Number of items migrated
 */
export async function migrateGuestCart(userId: string): Promise<number> {
  try {
    // Step 1: Get guest cart
    const guestItems = getGuestCartItems();
    
    if (guestItems.length === 0) {
      console.log('No guest cart items to migrate');
      return 0;
    }
    
    console.log(`Migrating ${guestItems.length} guest cart items...`);
    
    // Step 2: Get or create user's cart
    let cartId: string;
    
    // Check for existing cart
    const { data: existingCart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    const existingCartData = existingCart as unknown as CartRow | null;
    
    if (existingCartData) {
      cartId = existingCartData.id;
    } else {
      // Create new cart
      const insertData = { user_id: userId };
      const { data: newCart, error: cartError } = await supabase
        .from('carts')
        .insert(insertData as never)
        .select('id')
        .single();
      
      if (cartError || !newCart) {
        console.error('Error creating cart:', cartError);
        return 0;
      }
      
      const newCartData = newCart as unknown as CartRow;
      cartId = newCartData.id;
    }
    
    // Step 3: Get existing cart items
    const { data: existingItems } = await supabase
      .from('cart_items')
      .select('product_id, quantity')
      .eq('cart_id', cartId);
    
    const existingItemsData = existingItems as unknown as CartItemRow[] | null;
    
    const existingItemsMap = new Map<string, number>(
      existingItemsData?.map(item => [item.product_id, item.quantity]) || []
    );
    
    // Step 4: Merge items
    let migratedCount = 0;
    
    for (const guestItem of guestItems) {
      const existingQuantity = existingItemsMap.get(guestItem.productId);
      
      if (existingQuantity !== undefined) {
        // Update with maximum quantity
        const newQuantity = Math.max(existingQuantity, guestItem.quantity);
        
        if (newQuantity !== existingQuantity) {
          const updateData = { quantity: newQuantity };
          await supabase
            .from('cart_items')
            .update(updateData as never)
            .eq('cart_id', cartId)
            .eq('product_id', guestItem.productId);
          migratedCount++;
        }
      } else {
        // Insert new item
        const insertData = {
          cart_id: cartId,
          product_id: guestItem.productId,
          quantity: guestItem.quantity,
        };
        const { error } = await supabase
          .from('cart_items')
          .insert(insertData as never);
        
        if (!error) {
          migratedCount++;
        }
      }
    }
    
    // Step 5: Clear guest cart
    clearGuestCartStorage();
    
    console.log(`Guest cart migration complete: ${migratedCount} items migrated`);
    return migratedCount;
  } catch (error) {
    console.error('Error migrating guest cart:', error);
    return 0;
  }
}

// ============================================================================
// EXPORT GUEST CART FUNCTIONS (re-export from cartStorage)
// ============================================================================

export {
  getGuestCartItems,
  clearGuestCartStorage,
  type GuestCartItem,
} from '@/lib/cartStorage';

// ============================================================================
// HELPER: Convert local cart items to Supabase format
// ============================================================================

export function localCartItemsToSupabase(
  items: GuestCartItem[],
  cartId: string
): Array<{ cart_id: string; product_id: string; quantity: number }> {
  return items.map(item => ({
    cart_id: cartId,
    product_id: item.productId,
    quantity: item.quantity,
  }));
}
