/**
 * useProducts Hook
 * Ghalinino - Tunisia E-commerce
 *
 * PERFORMANCE FIX: FLICKERING ROOT CAUSE
 * ───────────────────────────────────────
 * The flicker was an infinite re-render loop caused by object identity:
 *
 *  1. ProductGrid creates `filters = { categorySlug, ... }` on every render
 *  2. That plain-object reference is passed into useProducts({ filters })
 *  3. useProducts puts `filters` in the useCallback dep array of fetchProducts
 *  4. New object reference → useCallback rebuilds fetchProducts
 *  5. fetchProducts is in the useEffect dep array → effect fires
 *  6. Fetch completes → setProducts / setIsLoading called → re-render
 *  7. ProductGrid re-renders → new `filters` object → back to step 1 ♻️
 *
 * Fix: serialise filter primitives into a stable JSON string with useMemo.
 * useCallback / useEffect only re-run when that key actually changes — i.e.
 * when the user intentionally changes a filter, not on every render.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import type { Product, Category } from '@/types/database';

// ============================================================================
// TYPES
// ============================================================================

export interface ProductFilters {
  categoryId?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  search?: string;
  brand?: string;
}

export type ProductSortOption =
  | 'featured'
  | 'newest'
  | 'price_asc'
  | 'price_desc'
  | 'name_asc'
  | 'name_desc';

export interface UseProductsOptions {
  filters?: ProductFilters;
  sort?: ProductSortOption;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export interface UseProductsReturn {
  products: ProductWithCategory[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export interface ProductWithCategory extends Product {
  category: Category | null;
}

// ============================================================================
// HOOK
// ============================================================================

export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const {
    filters = {},
    sort = 'featured',
    page = 1,
    limit = 12,
    enabled = true,
  } = options;

  // Read auth as primitives and keep in a ref so they never appear in dep
  // arrays (avoids spurious re-fetches on every auth tick).
  const { isWholesale, isAdmin } = useAuthContext();
  const authRef = useRef({ isWholesale, isAdmin });
  useEffect(() => {
    authRef.current = { isWholesale, isAdmin };
  }, [isWholesale, isAdmin]);

  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);

  const totalPages = Math.ceil(totalCount / limit);
  const hasMore = currentPage < totalPages;

  // ── STABILITY KEY ──────────────────────────────────────────────────────────
  // Enumerate every filter primitive individually so useMemo only invalidates
  // when a value genuinely changes, not just because a new object was created.
  const filtersKey = useMemo(
    () =>
      JSON.stringify({
        enabled,
        sort,
        limit,
        categoryId: filters.categoryId,
        categorySlug: filters.categorySlug,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        inStock: filters.inStock,
        isFeatured: filters.isFeatured,
        search: filters.search,
        brand: filters.brand,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      enabled,
      sort,
      limit,
      filters.categoryId,
      filters.categorySlug,
      filters.minPrice,
      filters.maxPrice,
      filters.inStock,
      filters.isFeatured,
      filters.search,
      filters.brand,
    ]
  );

  // =========================================================================
  // FETCH PRODUCTS
  // =========================================================================

  const fetchProducts = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      // Parse the stable string — this is the single source of truth for the
      // current filter state, ensuring no stale closures.
      const parsed = JSON.parse(filtersKey) as {
        enabled: boolean;
        sort: ProductSortOption;
        limit: number;
        categoryId?: string;
        categorySlug?: string;
        minPrice?: number;
        maxPrice?: number;
        inStock?: boolean;
        isFeatured?: boolean;
        search?: string;
        brand?: string;
      };

      if (!parsed.enabled) return;

      const { isWholesale: isWS, isAdmin: isAd } = authRef.current;

      try {
        setIsLoading(true);
        setError(null);

        let query = supabase
          .from('products')
          .select('*, category:categories(*)', { count: 'exact' });

        if (!isAd) query = query.eq('is_active', true);
        if (!isWS && !isAd) query = query.eq('is_wholesale_only', false);

        if (parsed.categoryId) {
          query = query.eq('category_id', parsed.categoryId);
        }

        if (parsed.categorySlug) {
          const { data: catData } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', parsed.categorySlug)
            .single();
          if (catData) {
            query = query.eq('category_id', (catData as { id: string }).id);
          }
        }

        if (parsed.minPrice !== undefined) query = query.gte('price', parsed.minPrice);
        if (parsed.maxPrice !== undefined) query = query.lte('price', parsed.maxPrice);
        if (parsed.inStock) query = query.gt('quantity', 0);
        if (parsed.isFeatured) query = query.eq('is_featured', true);
        if (parsed.brand) query = query.eq('brand', parsed.brand);

        if (parsed.search && parsed.search.trim()) {
          const term = `%${parsed.search.trim()}%`;
          query = query.or(`name_fr.ilike.${term},name_ar.ilike.${term}`);
        }

        switch (parsed.sort) {
          case 'featured':
            query = query
              .order('is_featured', { ascending: false })
              .order('created_at', { ascending: false });
            break;
          case 'newest':
            query = query.order('created_at', { ascending: false });
            break;
          case 'price_asc':
            query = query.order('price', { ascending: true });
            break;
          case 'price_desc':
            query = query.order('price', { ascending: false });
            break;
          case 'name_asc':
            query = query.order('name_fr', { ascending: true });
            break;
          case 'name_desc':
            query = query.order('name_fr', { ascending: false });
            break;
          default:
            query = query.order('created_at', { ascending: false });
        }

        const from = (pageNum - 1) * parsed.limit;
        query = query.range(from, from + parsed.limit - 1);

        const { data, error: queryError, count } = await query;
        if (queryError) throw queryError;

        const typedData = (data || []) as unknown as ProductWithCategory[];

        if (append) {
          setProducts((prev) => [...prev, ...typedData]);
        } else {
          setProducts(typedData);
        }

        setTotalCount(count || 0);
        setCurrentPage(pageNum);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setIsLoading(false);
      }
    },
    // filtersKey is the only dep that matters — it only changes when a filter
    // value truly changes, breaking the infinite re-render loop.
    [filtersKey]
  );

  // =========================================================================
  // EFFECTS
  // =========================================================================

  useEffect(() => {
    setCurrentPage(1);
    fetchProducts(1, false);
  }, [fetchProducts]);

  // =========================================================================
  // ACTIONS
  // =========================================================================

  const refetch = useCallback(async () => {
    await fetchProducts(1, false);
  }, [fetchProducts]);

  const loadMore = useCallback(async () => {
    if (hasMore && !isLoading) {
      await fetchProducts(currentPage + 1, true);
    }
  }, [fetchProducts, currentPage, hasMore, isLoading]);

  return {
    products,
    isLoading,
    error,
    totalCount,
    totalPages,
    hasMore,
    refetch,
    loadMore,
  };
}

// ============================================================================
// CATEGORIES HOOK
// ============================================================================

export interface UseCategoriesReturn {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
}

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: queryError } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (queryError) throw queryError;

        setCategories((data || []) as Category[]);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err instanceof Error ? err.message : 'Failed to load categories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, isLoading, error };
}

// ============================================================================
// BRANDS HOOK
// ============================================================================

export function useBrands(): { brands: string[]; isLoading: boolean } {
  const [brands, setBrands] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const { data } = await supabase
          .from('products')
          .select('brand')
          .eq('is_active', true)
          .not('brand', 'is', null);

        if (data) {
          const typedData = data as unknown as Array<{ brand: string | null }>;
          const uniqueBrands = [
            ...new Set(typedData.map((p) => p.brand).filter(Boolean)),
          ] as string[];
          setBrands(uniqueBrands.sort());
        }
      } catch (err) {
        console.error('Error fetching brands:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrands();
  }, []);

  return { brands, isLoading };
}