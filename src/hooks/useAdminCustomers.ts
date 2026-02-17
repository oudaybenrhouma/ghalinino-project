import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

export function useAdminCustomers() {
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data as Profile[]);
    } catch (err: any) {
      console.error('Error fetching admin customers:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateWholesaleStatus = async (userId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ wholesale_status: status } as any)
        .eq('id', userId);

      if (error) throw error;
      await fetchCustomers();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return { 
    customers, 
    isLoading, 
    error, 
    refetch: fetchCustomers,
    updateWholesaleStatus
  };
}
