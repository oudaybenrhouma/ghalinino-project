/**
 * Cart Context
 * Ghalinino - Tunisia E-commerce
 * 
 * Provides cart state and methods throughout the app.
 * Handles hybrid localStorage/Supabase cart with automatic migration.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from './AuthContext';
import { useStore } from '@/store';
import {
  getGuestCartItems,
  addToGuestCartStorage,
  updateGuestCartItemQuantity,
  removeFromGuestCartStorage,
  clearGuestCartStorage,
} from '@/lib/cartStorage';
import type { Product } from '@/types/database';

// ============================================================================
// TYPES
// ============================================================================

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    nameAr: string;
    nameFr: string;
    slug: string;
    price: number;
    wholesalePrice: number | null;
    compareAtPrice: number | null;
    images: string[];
    quantity: number; // available stock
    isActive: boolean;
    wholesaleMinQuantity: number;
  };
}

interface CartContextValue {
  // State
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  isCartOpen: boolean;

  // Computed
  itemCount: number;
  subtotal: number;
  isEmpty: boolean;

  // UI Actions
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Cart Actions
  addToCart: (productId: string, quantity?: number) => Promise<{ success: boolean; error?: string }>;
  updateQuantity: (productId: string, quantity: number) => Promise<{ success: boolean; error?: string }>;
  removeFromCart: (productId: string) => Promise<{ success: boolean }>;
  clearCart: () => Promise<{ success: boolean }>;
  refreshCart: () => Promise<void>;

  // Helpers
  getItemQuantity: (productId: string) => number;
  isInCart: (productId: string) => boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

const CartContext = createContext<CartContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const { user, isAuthenticated, isWholesale } = useAuthContext();
  const addNotification = useStore((state) => state.addNotification);
  const language = useStore((state) => state.language);

  // ── Seed guest cart immediately from localStorage (synchronous, no network) ──
  // Guests see their cart count instantly; no spinner needed.
  // For authenticated users we start empty and fill after auth resolves.
  const [items, setItems] = useState<CartItem[]>(() => {
    if (isAuthenticated) return [];
    // Read the raw IDs/quantities — we don't have product details yet,
    // so the full CartItem objects are loaded lazily in the background.
    // The count badge will be 0 until the first loadCart resolves, which
    // is fine and consistent with a fresh page load.
    return [];
  });
  // isLoading starts false: guest pages render immediately; for auth users
  // the cart loads in the background and populates without blocking content.
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Track user's cart ID in Supabase
  const cartIdRef = useRef<string | null>(null);

  // Computed values
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => {
    const price = isWholesale && item.product.wholesalePrice
      ? item.product.wholesalePrice
      : item.product.price;
    return sum + (price * item.quantity);
  }, 0);
  const isEmpty = items.length === 0;

  // UI Actions
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen(prev => !prev), []);

  // =========================================================================
  // CONVERT PRODUCT TO CART ITEM
  // =========================================================================

  const productToCartItem = useCallback((
    product: Product,
    quantity: number,
    itemId?: string
  ): CartItem => ({
    id: itemId || `local-${product.id}`,
    productId: product.id,
    quantity,
    product: {
      id: product.id,
      nameAr: product.name_ar,
      nameFr: product.name_fr,
      slug: product.slug,
      price: product.price,
      wholesalePrice: product.wholesale_price,
      compareAtPrice: product.compare_at_price,
      images: product.images,
      quantity: product.quantity,
      isActive: product.is_active,
      wholesaleMinQuantity: product.wholesale_min_quantity,
    },
  }), []);

  // =========================================================================
  // FETCH PRODUCT DETAILS
  // =========================================================================

  const fetchProductDetails = useCallback(async (
    productIds: string[]
  ): Promise<Map<string, Product>> => {
    if (productIds.length === 0) return new Map();

    try {
      const { data, error: queryError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds)
        .eq('is_active', true);

      if (queryError) throw queryError;

      const productMap = new Map<string, Product>();
      const products = data as unknown as Product[] | null;
      (products || []).forEach((product) => {
        productMap.set(product.id, product);
      });

      return productMap;
    } catch (err) {
      console.error('Error fetching product details:', err);
      return new Map();
    }
  }, []);

  // =========================================================================
  // LOAD GUEST CART
  // =========================================================================

  const loadGuestCart = useCallback(async (): Promise<CartItem[]> => {
    const guestItems = getGuestCartItems();
    
    if (guestItems.length === 0) {
      return [];
    }

    const productIds = guestItems.map(item => item.productId);
    const productMap = await fetchProductDetails(productIds);

    const cartItems: CartItem[] = [];
    
    for (const guestItem of guestItems) {
      const product = productMap.get(guestItem.productId);
      if (product) {
        // Ensure quantity doesn't exceed stock
        const quantity = Math.min(guestItem.quantity, product.quantity);
        if (quantity > 0) {
          cartItems.push(productToCartItem(product, quantity));
        }
      }
    }

    return cartItems;
  }, [fetchProductDetails, productToCartItem]);

  // =========================================================================
  // LOAD SUPABASE CART
  // =========================================================================

  const loadSupabaseCart = useCallback(async (): Promise<CartItem[]> => {
    if (!user) return [];

    try {
      // Get or create user's cart
      const { data: existingCart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let cartId: string;

      if (!existingCart) {
        // Create new cart
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert({ user_id: user.id } as never)
          .select('id')
          .single();

        if (createError) throw createError;
        const newCartData = newCart as unknown as { id: string } | null;
        if (!newCartData) throw new Error('Failed to create cart');
        cartId = newCartData.id;
      } else {
        const existingCartData = existingCart as unknown as { id: string };
        cartId = existingCartData.id;
      }

      cartIdRef.current = cartId;

      // Fetch cart items
      const { data: itemsData, error: itemsError } = await supabase
        .from('cart_items')
        .select('id, product_id, quantity')
        .eq('cart_id', cartId);

      if (itemsError) throw itemsError;

      interface CartItemRow {
        id: string;
        product_id: string;
        quantity: number;
      }

      const typedItems = (itemsData || []) as unknown as CartItemRow[];

      if (typedItems.length === 0) {
        return [];
      }

      // Fetch product details
      const productIds = typedItems.map(item => item.product_id);
      const productMap = await fetchProductDetails(productIds);

      const cartItems: CartItem[] = [];

      for (const item of typedItems) {
        const product = productMap.get(item.product_id);
        if (product && product.is_active) {
          // Ensure quantity doesn't exceed stock
          const quantity = Math.min(item.quantity, product.quantity);
          if (quantity > 0) {
            cartItems.push(productToCartItem(product, quantity, item.id));
            
            // Update if quantity was adjusted
            if (quantity !== item.quantity) {
              await supabase
                .from('cart_items')
                .update({ quantity } as never)
                .eq('id', item.id);
            }
          } else {
            // Remove out of stock item
            await supabase
              .from('cart_items')
              .delete()
              .eq('id', item.id);
          }
        }
      }

      return cartItems;
    } catch (err) {
      console.error('Error loading Supabase cart:', err);
      return [];
    }
  }, [user, fetchProductDetails, productToCartItem]);

  // =========================================================================
  // LOAD CART (MAIN)
  // =========================================================================

  // Keep latest loaders in refs so loadCart's identity only changes when the
  // user's identity changes — not on every render. This prevents the effect
  // from firing twice (once on mount, once when loadSupabaseCart rebuilds).
  const loadSupabaseCartRef = useRef(loadSupabaseCart);
  const loadGuestCartRef    = useRef(loadGuestCart);
  useEffect(() => { loadSupabaseCartRef.current = loadSupabaseCart; }, [loadSupabaseCart]);
  useEffect(() => { loadGuestCartRef.current    = loadGuestCart;    }, [loadGuestCart]);

  const loadCart = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let cartItems: CartItem[];

      if (isAuthenticated && user) {
        cartItems = await loadSupabaseCartRef.current();
      } else {
        cartItems = await loadGuestCartRef.current();
      }

      setItems(cartItems);
    } catch (err) {
      console.error('Error loading cart:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cart');
    } finally {
      setIsLoading(false);
    }
  // Only rebuild when identity actually changes, not when function refs do.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  // =========================================================================
  // VALIDATE STOCK
  // =========================================================================

  const validateStock = useCallback(async (
    productId: string,
    quantity: number
  ): Promise<{ valid: boolean; availableStock: number }> => {
    try {
      const { data, error: queryError } = await supabase
        .from('products')
        .select('quantity, is_active')
        .eq('id', productId)
        .single();

      if (queryError || !data) {
        return { valid: false, availableStock: 0 };
      }

      const product = data as unknown as { quantity: number; is_active: boolean };

      if (!product.is_active) {
        return { valid: false, availableStock: 0 };
      }

      return {
        valid: quantity <= product.quantity,
        availableStock: product.quantity,
      };
    } catch {
      return { valid: false, availableStock: 0 };
    }
  }, []);

  // =========================================================================
  // ADD TO CART
  // =========================================================================

  const addToCart = useCallback(async (
    productId: string,
    quantity: number = 1
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // First validate stock
      const { valid, availableStock } = await validateStock(productId, quantity);
      
      if (!valid && availableStock === 0) {
        return { 
          success: false, 
          error: language === 'ar' ? 'المنتج غير متوفر' : 'Produit non disponible' 
        };
      }

      // Get current quantity in cart
      const existingItem = items.find(item => item.productId === productId);
      const currentQuantity = existingItem?.quantity || 0;
      const newTotalQuantity = currentQuantity + quantity;

      if (newTotalQuantity > availableStock) {
        const msg = language === 'ar' 
          ? `متاح فقط ${availableStock} (${currentQuantity} في السلة)`
          : `Seulement ${availableStock} disponibles (${currentQuantity} dans le panier)`;
        return { success: false, error: msg };
      }

      if (isAuthenticated && user && cartIdRef.current) {
        // Supabase cart
        if (existingItem) {
          // Update existing item
          await supabase
            .from('cart_items')
            .update({ quantity: newTotalQuantity } as never)
            .eq('cart_id', cartIdRef.current)
            .eq('product_id', productId);
        } else {
          // Insert new item
          await supabase
            .from('cart_items')
            .insert({
              cart_id: cartIdRef.current,
              product_id: productId,
              quantity,
            } as never);
        }
      } else {
        // Guest cart (localStorage)
        addToGuestCartStorage(productId, quantity, availableStock);
      }

      // Refresh cart
      await loadCart();

      return { success: true };
    } catch (err) {
      console.error('Error adding to cart:', err);
      return { 
        success: false, 
        error: language === 'ar' ? 'فشل في إضافة المنتج' : 'Échec de l\'ajout' 
      };
    }
  }, [items, isAuthenticated, user, validateStock, loadCart, language]);

  // =========================================================================
  // UPDATE QUANTITY
  // =========================================================================

  const updateQuantity = useCallback(async (
    productId: string,
    quantity: number
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (quantity < 1) {
        await removeFromCart(productId);
        return { success: true };
      }

      // Validate stock
      const { valid, availableStock } = await validateStock(productId, quantity);
      
      if (!valid) {
        const adjustedQuantity = Math.min(quantity, availableStock);
        if (adjustedQuantity === 0) {
          return { 
            success: false, 
            error: language === 'ar' ? 'المنتج نفذ من المخزون' : 'Produit épuisé' 
          };
        }
        
        // Use adjusted quantity
        quantity = adjustedQuantity;
        
        addNotification({
          type: 'warning',
          title: language === 'ar' ? 'تم تعديل الكمية' : 'Quantité ajustée',
          message: language === 'ar' 
            ? `متاح فقط ${availableStock}` 
            : `Seulement ${availableStock} disponibles`,
          duration: 3000,
        });
      }

      if (isAuthenticated && user && cartIdRef.current) {
        // Supabase cart
        await supabase
          .from('cart_items')
          .update({ quantity } as never)
          .eq('cart_id', cartIdRef.current)
          .eq('product_id', productId);
      } else {
        // Guest cart
        updateGuestCartItemQuantity(productId, quantity, availableStock);
      }

      // Refresh cart
      await loadCart();

      return { success: true };
    } catch (err) {
      console.error('Error updating quantity:', err);
      return { 
        success: false, 
        error: language === 'ar' ? 'فشل في تحديث الكمية' : 'Échec de la mise à jour' 
      };
    }
  }, [isAuthenticated, user, validateStock, loadCart, addNotification, language]);

  // =========================================================================
  // REMOVE FROM CART
  // =========================================================================

  const removeFromCart = useCallback(async (
    productId: string
  ): Promise<{ success: boolean }> => {
    try {
      if (isAuthenticated && user && cartIdRef.current) {
        // Supabase cart
        await supabase
          .from('cart_items')
          .delete()
          .eq('cart_id', cartIdRef.current)
          .eq('product_id', productId);
      } else {
        // Guest cart
        removeFromGuestCartStorage(productId);
      }

      // Update local state immediately
      setItems(prev => prev.filter(item => item.productId !== productId));

      return { success: true };
    } catch (err) {
      console.error('Error removing from cart:', err);
      return { success: false };
    }
  }, [isAuthenticated, user]);

  // =========================================================================
  // CLEAR CART
  // =========================================================================

  const clearCart = useCallback(async (): Promise<{ success: boolean }> => {
    try {
      if (isAuthenticated && user && cartIdRef.current) {
        // Supabase cart
        await supabase
          .from('cart_items')
          .delete()
          .eq('cart_id', cartIdRef.current);
      } else {
        // Guest cart
        clearGuestCartStorage();
      }

      setItems([]);
      return { success: true };
    } catch (err) {
      console.error('Error clearing cart:', err);
      return { success: false };
    }
  }, [isAuthenticated, user]);

  // =========================================================================
  // HELPERS
  // =========================================================================

  const getItemQuantity = useCallback((productId: string): number => {
    const item = items.find(i => i.productId === productId);
    return item?.quantity || 0;
  }, [items]);

  const isInCart = useCallback((productId: string): boolean => {
    return items.some(i => i.productId === productId);
  }, [items]);

  // =========================================================================
  // EFFECTS
  // =========================================================================

  // Load cart on mount and auth change
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Subscribe to real-time cart updates (for authenticated users)
  useEffect(() => {
    if (!isAuthenticated || !cartIdRef.current) return;

    const cartId = cartIdRef.current;

    const channel = supabase
      .channel(`cart-changes-${cartId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_items',
          filter: `cart_id=eq.${cartId}`,
        },
        () => {
          // Reload cart on any change
          loadCart();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, loadCart]);

  // =========================================================================
  // CONTEXT VALUE
  // =========================================================================

  const value: CartContextValue = {
    items,
    isLoading,
    error,
    isCartOpen,
    itemCount,
    subtotal,
    isEmpty,
    openCart,
    closeCart,
    toggleCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart: loadCart,
    getItemQuantity,
    isInCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useCartContext() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
}