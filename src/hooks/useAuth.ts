/**
 * Authentication Hook
 * Manages Supabase auth state
 */

import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import type { AuthUser, Language, Profile } from '@/types';

export function useAuth() {
  const { user, isLoading, isAuthenticated, setUser, setAuthLoading, logout } = useStore();

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (session?.user) {
          // Fetch user profile
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const profile = data as Profile | null;

          if (profile && mounted) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              fullName: profile.full_name,
              phone: profile.phone,
              avatarUrl: profile.avatar_url,
              preferredLanguage: profile.preferred_language as Language,
              role: profile.role as 'customer' | 'wholesale' | 'admin' | 'moderator',
              wholesaleStatus: (profile.wholesale_status as 'none' | 'pending' | 'approved' | 'rejected') || 'none',
              isWholesaleApproved: profile.wholesale_status === 'approved',
            });
          } else {
            // User exists but no profile - create minimal user object
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              fullName: null,
              phone: null,
              avatarUrl: null,
              preferredLanguage: 'ar',
              role: 'customer',
              wholesaleStatus: 'none',
              isWholesaleApproved: false,
            });
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setUser(null);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          // Fetch or create profile
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const profile = data as Profile | null;

          if (profile) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              fullName: profile.full_name,
              phone: profile.phone,
              avatarUrl: profile.avatar_url,
              preferredLanguage: profile.preferred_language as Language,
              role: profile.role as 'customer' | 'wholesale' | 'admin' | 'moderator',
              wholesaleStatus: (profile.wholesale_status as 'none' | 'pending' | 'approved' | 'rejected') || 'none',
              isWholesaleApproved: profile.wholesale_status === 'approved',
            });
          }
        } else if (event === 'SIGNED_OUT') {
          logout();
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setAuthLoading, logout]);

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    } finally {
      setAuthLoading(false);
    }
  }, [setAuthLoading]);

  // Sign in with magic link
  const signInWithMagicLink = useCallback(async (email: string) => {
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    } finally {
      setAuthLoading(false);
    }
  }, [setAuthLoading]);

  // Sign up
  const signUp = useCallback(async (
    email: string,
    password: string,
    metadata?: { fullName?: string; phone?: string }
  ) => {
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: metadata?.fullName,
            phone: metadata?.phone,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    } finally {
      setAuthLoading(false);
    }
  }, [setAuthLoading]);

  // Sign out
  const signOut = useCallback(async () => {
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      logout();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setAuthLoading(false);
    }
  }, [setAuthLoading, logout]);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }, []);

  // Update password
  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<AuthUser>) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };

    try {
      const updateData: Record<string, unknown> = {
        full_name: updates.fullName,
        phone: updates.phone,
        avatar_url: updates.avatarUrl,
        preferred_language: updates.preferredLanguage,
        updated_at: new Date().toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setUser({
        ...user,
        ...updates,
      });

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }, [user, setUser]);

  return {
    user,
    isLoading,
    isAuthenticated,
    signIn,
    signInWithMagicLink,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
  };
}
