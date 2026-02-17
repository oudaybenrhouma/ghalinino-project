/**
 * useProductDetail Hook
 * Ghalinino - Tunisia E-commerce
 * 
 * Fetches a single product with real-time stock updates
 * using Supabase real-time subscriptions.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { useStore } from '@/store';
import type { Product, Category } from '@/types/database';

// ============================================================================
// TYPES
// ============================================================================

export interface ProductDetail extends Product {
  category: Category | null;
}

export interface UseProductDetailOptions {
  /** Product ID or slug */
  productId?: string;
  productSlug?: string;
  /** Enable real-time stock updates */
  realtime?: boolean;
}

export interface UseProductDetailReturn {
  product: ProductDetail | null;
  isLoading: boolean;
  error: string | null;
  /** Real-time stock update event */
  stockChanged: boolean;
  /** Previous stock quantity (before update) */
  previousStock: number | null;
  /** Clear the stock changed flag */
  clearStockChanged: () => void;
  /** Refetch product data */
  refetch: () => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useProductDetail(options: UseProductDetailOptions): UseProductDetailReturn {
  const { productId, productSlug, realtime = true } = options;

  const { isAdmin } = useAuthContext();
  const addNotification = useStore((state) => state.addNotification);

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stockChanged, setStockChanged] = useState(false);
  const [previousStock, setPreviousStock] = useState<number | null>(null);

  // Track current product ID for real-time subscription
  const currentProductId = useRef<string | null>(null);

  // =========================================================================
  // FETCH PRODUCT
  // =========================================================================

  const fetchProduct = useCallback(async () => {
    if (!productId && !productSlug) {
      setError('No product ID or slug provided');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `);

      // Query by ID or slug
      if (productId) {
        query = query.eq('id', productId);
      } else if (productSlug) {
        query = query.eq('slug', productSlug);
      }

      // Only active products for non-admins
      if (!isAdmin) {
        query = query.eq('is_active', true);
      }

      const { data, error: queryError } = await query.single();

      if (queryError) {
        if (queryError.code === 'PGRST116') {
          throw new Error('Product not found');
        }
        throw queryError;
      }

      const typedProduct = data as unknown as ProductDetail;
      setProduct(typedProduct);
      currentProductId.current = typedProduct.id;

    } catch (err) {
      console.error('Error fetching product:', err);
      setError(err instanceof Error ? err.message : 'Failed to load product');
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  }, [productId, productSlug, isAdmin]);

  // =========================================================================
  // INITIAL FETCH
  // =========================================================================

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // =========================================================================
  // REAL-TIME STOCK SUBSCRIPTION
  // =========================================================================

  useEffect(() => {
    if (!realtime || !currentProductId.current) return;

    const productIdToWatch = currentProductId.current;

    // Subscribe to product changes
    const channel = supabase
      .channel(`product-stock-${productIdToWatch}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `id=eq.${productIdToWatch}`,
        },
        (payload) => {
          const newProduct = payload.new as Product;
          const oldProduct = payload.old as Product;

          // Check if stock changed
          if (newProduct.quantity !== oldProduct.quantity) {
            setPreviousStock(oldProduct.quantity);
            setStockChanged(true);

            // Update local state
            setProduct((prev) => {
              if (!prev) return prev;
              return { ...prev, quantity: newProduct.quantity };
            });

            // Show notification
            const stockDiff = newProduct.quantity - oldProduct.quantity;
            if (stockDiff < 0) {
              addNotification({
                type: 'warning',
                title: typeof window !== 'undefined' && document.documentElement.lang === 'ar'
                  ? 'تحديث المخزون'
                  : 'Stock mis à jour',
                message: typeof window !== 'undefined' && document.documentElement.lang === 'ar'
                  ? `الكمية المتاحة: ${newProduct.quantity}`
                  : `Quantité disponible: ${newProduct.quantity}`,
                duration: 5000,
              });
            }
          }

          // Update other fields that might have changed
          setProduct((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              ...newProduct,
              category: prev.category, // Keep the category relation
            };
          });
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [realtime, addNotification]);

  // =========================================================================
  // ACTIONS
  // =========================================================================

  const clearStockChanged = useCallback(() => {
    setStockChanged(false);
    setPreviousStock(null);
  }, []);

  const refetch = useCallback(async () => {
    await fetchProduct();
    clearStockChanged();
  }, [fetchProduct, clearStockChanged]);

  // =========================================================================
  // RETURN
  // =========================================================================

  return {
    product,
    isLoading,
    error,
    stockChanged,
    previousStock,
    clearStockChanged,
    refetch,
  };
}

// ============================================================================
// RELATED PRODUCTS HOOK
// ============================================================================

export function useRelatedProducts(
  categoryId: string | null,
  currentProductId: string | null,
  limit: number = 4
) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!categoryId || !currentProductId) {
      setIsLoading(false);
      return;
    }

    const fetchRelated = async () => {
      try {
        setIsLoading(true);

        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('category_id', categoryId)
          .eq('is_active', true)
          .neq('id', currentProductId)
          .limit(limit);

        setProducts((data || []) as unknown as Product[]);
      } catch (err) {
        console.error('Error fetching related products:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelated();
  }, [categoryId, currentProductId, limit]);

  return { products, isLoading };
}
