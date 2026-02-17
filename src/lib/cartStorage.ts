/**
 * Cart Storage Utilities
 * Ghalinino - Tunisia E-commerce
 * 
 * Handles guest cart storage in localStorage with a versioned key.
 * Provides utilities for CRUD operations on the guest cart.
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const GUEST_CART_KEY = 'ghalinino_guest_cart_v1';

// ============================================================================
// TYPES
// ============================================================================

export interface GuestCartItem {
  productId: string;
  quantity: number;
  addedAt: number; // timestamp for sorting
}

export interface GuestCart {
  items: GuestCartItem[];
  updatedAt: number;
}

// ============================================================================
// STORAGE HELPERS
// ============================================================================

/**
 * Get the guest cart from localStorage
 */
export function getGuestCartFromStorage(): GuestCart {
  if (typeof window === 'undefined') {
    return { items: [], updatedAt: Date.now() };
  }

  try {
    const stored = localStorage.getItem(GUEST_CART_KEY);
    if (!stored) {
      return { items: [], updatedAt: Date.now() };
    }

    const parsed = JSON.parse(stored) as GuestCart;
    
    // Validate structure
    if (!Array.isArray(parsed.items)) {
      return { items: [], updatedAt: Date.now() };
    }

    return parsed;
  } catch (error) {
    console.error('Error reading guest cart:', error);
    return { items: [], updatedAt: Date.now() };
  }
}

/**
 * Save the guest cart to localStorage
 */
export function saveGuestCartToStorage(cart: GuestCart): void {
  if (typeof window === 'undefined') return;

  try {
    cart.updatedAt = Date.now();
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving guest cart:', error);
  }
}

/**
 * Clear the guest cart from localStorage
 */
export function clearGuestCartStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch (error) {
    console.error('Error clearing guest cart:', error);
  }
}

// ============================================================================
// CART OPERATIONS
// ============================================================================

/**
 * Get all items from the guest cart
 */
export function getGuestCartItems(): GuestCartItem[] {
  const cart = getGuestCartFromStorage();
  return cart.items;
}

/**
 * Add an item to the guest cart
 * If item exists, adds to quantity (up to maxQuantity if provided)
 */
export function addToGuestCartStorage(
  productId: string,
  quantity: number = 1,
  maxQuantity?: number
): GuestCartItem[] {
  const cart = getGuestCartFromStorage();
  const existingIndex = cart.items.findIndex(item => item.productId === productId);

  if (existingIndex >= 0) {
    // Update existing item
    const newQuantity = cart.items[existingIndex].quantity + quantity;
    cart.items[existingIndex].quantity = maxQuantity 
      ? Math.min(newQuantity, maxQuantity) 
      : newQuantity;
  } else {
    // Add new item
    cart.items.push({
      productId,
      quantity: maxQuantity ? Math.min(quantity, maxQuantity) : quantity,
      addedAt: Date.now(),
    });
  }

  saveGuestCartToStorage(cart);
  return cart.items;
}

/**
 * Update the quantity of an item in the guest cart
 */
export function updateGuestCartItemQuantity(
  productId: string,
  quantity: number,
  maxQuantity?: number
): GuestCartItem[] {
  const cart = getGuestCartFromStorage();
  const existingIndex = cart.items.findIndex(item => item.productId === productId);

  if (existingIndex >= 0) {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      cart.items.splice(existingIndex, 1);
    } else {
      // Update quantity
      cart.items[existingIndex].quantity = maxQuantity 
        ? Math.min(quantity, maxQuantity) 
        : quantity;
    }
    saveGuestCartToStorage(cart);
  }

  return cart.items;
}

/**
 * Remove an item from the guest cart
 */
export function removeFromGuestCartStorage(productId: string): GuestCartItem[] {
  const cart = getGuestCartFromStorage();
  cart.items = cart.items.filter(item => item.productId !== productId);
  saveGuestCartToStorage(cart);
  return cart.items;
}

/**
 * Get the total number of items in the guest cart
 */
export function getGuestCartItemCount(): number {
  const items = getGuestCartItems();
  return items.reduce((total, item) => total + item.quantity, 0);
}

/**
 * Check if a product is in the guest cart
 */
export function isProductInGuestCart(productId: string): boolean {
  const items = getGuestCartItems();
  return items.some(item => item.productId === productId);
}

/**
 * Get the quantity of a product in the guest cart
 */
export function getGuestCartProductQuantity(productId: string): number {
  const items = getGuestCartItems();
  const item = items.find(i => i.productId === productId);
  return item?.quantity || 0;
}
