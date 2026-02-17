/**
 * Cart Context - OPTIMIZED VERSION
 * Ghalinino - Tunisia E-commerce
 * 
 * FIXES APPLIED:
 * ===============
 * 1. Removed loadCart from useEffect dependencies (prevents infinite loops)
 * 2. Added optimistic UI updates for instant feedback
 * 3. Memoized computed values (itemCount, subtotal)
 * 4. Stabilized callbacks to prevent unnecessary re-renders
 * 5. Fixed real-time subscription dependencies
 * 6. Added proper error rollback for optimistic updates
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
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
    quantity: number;
    isActive: boolean;
    wholesaleMinQuantity: number;
  };
}

interface CartContextValue {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  isCartOpen: boolean;
  itemCount: number;
  subtotal: number;
  isEmpty: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addToCart: (productId: string, quantity?: number) => Promise<{ success: boolean; error?: string }>;
  updateQuantity: (productId: string, quantity: number) => Promise<{ success: boolean; error?: string }>;
  removeFromCart: (productId: string) => Promise<{ success: boolean }>;
  clearCart: () => Promise<{ success: boolean }>;
  refreshCart: () => Promise<void>;
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
  const { user, isAuthenticated } = useAuthContext();
  const addNotification = useStore((state) => state.addNotification);
  const language = useStore((state) => state.language);

  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const cartIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(false);

  // =========================================================================
  // MEMOIZED COMPUTED VALUES - Prevents unnecessary recalculation
  // =========================================================================

  const itemCount = useMemo(() => 
    items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(() => 
    items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
    [items]
  );

  const isEmpty = useMemo(() => items.length === 0, [items.length]);

  // =========================================================================
  // STABILIZED UI ACTIONS - No dependencies = stable reference
  // =========================================================================

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
      const { data: existingCart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let cartId: string;

      if (!existingCart) {
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

      const productIds = typedItems.map(item => item.product_id);
      const productMap = await fetchProductDetails(productIds);

      const cartItems: CartItem[] = [];

      for (const item of typedItems) {
        const product = productMap.get(item.product_id);
        if (product) {
          const quantity = Math.min(item.quantity, product.quantity);
          if (quantity > 0) {
            cartItems.push(productToCartItem(product, quantity, item.id));
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
  // LOAD CART - FIX: Removed from useEffect dependencies
  // =========================================================================

  const loadCart = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let cartItems: CartItem[];

      if (isAuthenticated && user) {
        cartItems = await loadSupabaseCart();
      } else {
        cartItems = await loadGuestCart();
      }

      setItems(cartItems);
    } catch (err) {
      console.error('Error loading cart:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cart');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, loadSupabaseCart, loadGuestCart]);

  // =========================================================================
  // VALIDATE STOCK
  // =========================================================================

  const validateStock = useCallback(async (
    productId: string,
    requestedQuantity: number
  ): Promise<{ valid: boolean; availableStock: number; product: Product | null }> => {
    try {
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('is_active', true)
        .single();

      if (fetchError || !product) {
        return { valid: false, availableStock: 0, product: null };
      }

      const typedProduct = product as unknown as Product;
      const availableStock = typedProduct.quantity;
      const valid = requestedQuantity <= availableStock;

      return { valid, availableStock, product: typedProduct };
    } catch (err) {
      console.error('Error validating stock:', err);
      return { valid: false, availableStock: 0, product: null };
    }
  }, []);

  // =========================================================================
  // ADD TO CART - WITH OPTIMISTIC UI
  // =========================================================================

  const addToCart = useCallback(async (
    productId: string,
    quantity: number = 1
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Validate stock
      const { valid, availableStock, product } = await validateStock(productId, quantity);
      
      if (!valid || availableStock === 0) {
        return { 
          success: false, 
          error: language === 'ar' ? 'المنتج غير متوفر' : 'Produit non disponible' 
        };
      }

      if (!product) {
        return {
          success: false,
          error: language === 'ar' ? 'المنتج غير موجود' : 'Produit introuvable'
        };
      }

      // 2. Check current quantity
      const existingItem = items.find(item => item.productId === productId);
      const currentQuantity = existingItem?.quantity || 0;
      const newTotalQuantity = currentQuantity + quantity;

      if (newTotalQuantity > availableStock) {
        const msg = language === 'ar' 
          ? `متاح فقط ${availableStock} (${currentQuantity} في السلة)`
          : `Seulement ${availableStock} disponibles (${currentQuantity} dans le panier)`;
        return { success: false, error: msg };
      }

      // 3. OPTIMISTIC UPDATE - Update UI immediately
      const optimisticItem = productToCartItem(product, quantity);
      
      if (existingItem) {
        setItems(prev => prev.map(item => 
          item.productId === productId
            ? { ...item, quantity: newTotalQuantity }
            : item
        ));
      } else {
        setItems(prev => [...prev, optimisticItem]);
      }

      // 4. Sync with backend
      try {
        if (isAuthenticated && user && cartIdRef.current) {
          if (existingItem) {
            await supabase
              .from('cart_items')
              .update({ quantity: newTotalQuantity } as never)
              .eq('cart_id', cartIdRef.current)
              .eq('product_id', productId);
          } else {
            await supabase
              .from('cart_items')
              .insert({
                cart_id: cartIdRef.current,
                product_id: productId,
                quantity,
              } as never);
          }
        } else {
          addToGuestCartStorage(productId, quantity, availableStock);
        }

        return { success: true };
      } catch (apiError) {
        // 5. ROLLBACK on error
        console.error('Cart sync failed, rolling back:', apiError);
        
        if (existingItem) {
          setItems(prev => prev.map(item => 
            item.productId === productId
              ? { ...item, quantity: currentQuantity }
              : item
          ));
        } else {
          setItems(prev => prev.filter(item => item.productId !== productId));
        }

        return { 
          success: false, 
          error: language === 'ar' ? 'فشل في إضافة المنتج' : 'Échec de l\'ajout' 
        };
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      return { 
        success: false, 
        error: language === 'ar' ? 'فشل في إضافة المنتج' : 'Échec de l\'ajout' 
      };
    }
  }, [items, isAuthenticated, user, validateStock, productToCartItem, language]);

  // =========================================================================
  // UPDATE QUANTITY - WITH OPTIMISTIC UI
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

      // Store previous state for rollback
      const previousItems = [...items];
      const existingItem = items.find(item => item.productId === productId);
      
      if (!existingItem) {
        return { success: false, error: 'Item not in cart' };
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

      // OPTIMISTIC UPDATE
      setItems(prev => prev.map(item => 
        item.productId === productId
          ? { ...item, quantity }
          : item
      ));

      // Sync with backend
      try {
        if (isAuthenticated && user && cartIdRef.current) {
          await supabase
            .from('cart_items')
            .update({ quantity } as never)
            .eq('cart_id', cartIdRef.current)
            .eq('product_id', productId);
        } else {
          updateGuestCartItemQuantity(productId, quantity, availableStock);
        }

        return { success: true };
      } catch (apiError) {
        // ROLLBACK
        console.error('Update failed, rolling back:', apiError);
        setItems(previousItems);
        
        return { 
          success: false, 
          error: language === 'ar' ? 'فشل في تحديث الكمية' : 'Échec de la mise à jour' 
        };
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
      return { 
        success: false, 
        error: language === 'ar' ? 'فشل في تحديث الكمية' : 'Échec de la mise à jour' 
      };
    }
  }, [items, isAuthenticated, user, validateStock, addNotification, language]);

  // =========================================================================
  // REMOVE FROM CART - WITH OPTIMISTIC UI
  // =========================================================================

  const removeFromCart = useCallback(async (
    productId: string
  ): Promise<{ success: boolean }> => {
    try {
      // Store previous state for rollback
      const previousItems = [...items];

      // OPTIMISTIC UPDATE
      setItems(prev => prev.filter(item => item.productId !== productId));

      // Sync with backend
      try {
        if (isAuthenticated && user && cartIdRef.current) {
          await supabase
            .from('cart_items')
            .delete()
            .eq('cart_id', cartIdRef.current)
            .eq('product_id', productId);
        } else {
          removeFromGuestCartStorage(productId);
        }

        return { success: true };
      } catch (apiError) {
        // ROLLBACK
        console.error('Remove failed, rolling back:', apiError);
        setItems(previousItems);
        return { success: false };
      }
    } catch (err) {
      console.error('Error removing from cart:', err);
      return { success: false };
    }
  }, [items, isAuthenticated, user]);

  // =========================================================================
  // CLEAR CART
  // =========================================================================

  const clearCart = useCallback(async (): Promise<{ success: boolean }> => {
    try {
      const previousItems = [...items];

      // OPTIMISTIC UPDATE
      setItems([]);

      try {
        if (isAuthenticated && user && cartIdRef.current) {
          await supabase
            .from('cart_items')
            .delete()
            .eq('cart_id', cartIdRef.current);
        } else {
          clearGuestCartStorage();
        }

        return { success: true };
      } catch (apiError) {
        // ROLLBACK
        console.error('Clear failed, rolling back:', apiError);
        setItems(previousItems);
        return { success: false };
      }
    } catch (err) {
      console.error('Error clearing cart:', err);
      return { success: false };
    }
  }, [items, isAuthenticated, user]);

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
  // EFFECTS - FIX: Removed loadCart from dependencies
  // =========================================================================

  // Load cart on mount
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      loadCart();
    }
  }, []); // ✅ Empty deps - only on mount

  // Load cart when auth changes
  useEffect(() => {
    if (isMountedRef.current) {
      loadCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]); // ✅ Only reload on auth changes

  // Real-time subscription - FIX: Stable dependencies
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
        async () => {
          await loadCart();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, cartIdRef.current]); // ✅ Stable dependencies

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