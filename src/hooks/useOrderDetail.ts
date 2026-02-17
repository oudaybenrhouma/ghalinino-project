/**
 * useOrderDetail Hook
 * Fetch single order details with real-time updates
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import type { Order, OrderItem } from '@/types/database';

// Extended type to include items
interface OrderWithItems extends Order {
  items: OrderItem[];
}

export function useOrderDetail(orderId: string | undefined) {
  const { user } = useAuthContext();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!user || !orderId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch order with items
      // Note: Supabase JS select joining order_items
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('id', orderId)
        .eq('user_id', user.id) // Security check (RLS handles this too)
        .single();

      if (error) throw error;

      // Ensure proper typing for join
      const orderData = data as unknown as OrderWithItems;
      setOrder(orderData);

    } catch (err: any) {
      console.error('Error fetching order details:', err);
      setError(err.message || 'Failed to load order');
    } finally {
      setIsLoading(false);
    }
  }, [user, orderId]);

  // Initial fetch
  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [fetchOrder, orderId]);

  // Real-time subscription
  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          // Update order status/payment info live
          setOrder((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              ...payload.new,
            } as OrderWithItems;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return { order, isLoading, error, refetch: fetchOrder };
}
