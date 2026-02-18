import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/types/database';

export interface AdminProduct extends Product {
  category: Category | null;
}

export function useAdminProducts() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data as unknown as AdminProduct[]);
    } catch (err: any) {
      console.error('Error fetching admin products:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      await fetchProducts();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateStock = async (id: string, quantity: number) => {
    try {
      const { error } = await (supabase as any)
        .from('products')
        .update({ quantity })
        .eq('id', id);
      if (error) throw error;
      setProducts(prev => prev.map(p => p.id === id ? { ...p, quantity } : p));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const toggleProductStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('products')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
      await fetchProducts();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { 
    products, 
    isLoading, 
    error, 
    refetch: fetchProducts,
    deleteProduct,
    toggleProductStatus,
    updateStock,
  };
}