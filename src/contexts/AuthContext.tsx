/**
 * Authentication Context
 * Ghalinino - Tunisia E-commerce
 * 
 * Provides authentication state and methods throughout the app.
 * Handles email/password, magic link, and wholesale registration.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import { migrateGuestCart } from '@/lib/cartMigration';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import type { Language } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

// Profile data from Supabase
interface ProfileData {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  preferred_language: string;
  role: string;
  wholesale_status: string;
  wholesale_applied_at?: string | null;
  wholesale_approved_at?: string | null;
  wholesale_rejected_at?: string | null;
  wholesale_rejection_reason?: string | null;
  wholesale_discount_tier?: number | null;
  business_name: string | null;
  business_tax_id: string | null;
  business_address?: string | null;
  business_phone?: string | null;
  business_documents?: string[] | null;
  // Default shipping address
  default_governorate?: string | null;
  default_city?: string | null;
  default_address?: string | null;
  default_postal_code?: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  preferredLanguage: Language;
  role: 'customer' | 'wholesale' | 'admin' | 'moderator';
  wholesaleStatus: 'none' | 'pending' | 'approved' | 'rejected';
  isWholesaleApproved: boolean;
  businessName: string | null;
  businessTaxId: string | null;
  businessAddress: string | null;
  businessPhone: string | null;
  businessDocuments: string[] | null;
  wholesaleAppliedAt: string | null;
  wholesaleApprovedAt: string | null;
  wholesaleRejectionReason: string | null;
  wholesaleDiscountTier: number | null;
}

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

interface WholesaleSignUpData extends SignUpData {
  businessName: string;
  businessTaxId: string;
  businessAddress: string;
  businessPhone: string;
  businessLicense?: File;
}

interface ProfileUpdates {
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  preferred_language?: string;
  default_governorate?: string | null;
  default_city?: string | null;
  default_address?: string | null;
}

interface AuthContextValue {
  // State
  user: AuthUser | null;
  session: Session | null;
  profile: ProfileData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isWholesale: boolean;
  isPendingWholesale: boolean;

  // Auth Methods
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: AuthError | Error | null }>;
  signUp: (data: SignUpData) => Promise<{ error: AuthError | Error | null }>;
  signUpWholesale: (data: WholesaleSignUpData) => Promise<{ error: AuthError | Error | null }>;
  signOut: () => Promise<{ error: AuthError | Error | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | Error | null }>;

  // Profile Methods
  updateProfile: (updates: ProfileUpdates) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Derived state
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin' || user?.role === 'moderator';
  const isWholesale = user?.wholesaleStatus === 'approved';
  const isPendingWholesale = user?.wholesaleStatus === 'pending';

  // =========================================================================
  // FETCH PROFILE
  // =========================================================================

  const fetchProfile = useCallback(async (userId: string): Promise<ProfileData | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as unknown as ProfileData;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  }, []);

  // =========================================================================
  // CONVERT PROFILE TO AUTH USER
  // =========================================================================

  const profileToAuthUser = useCallback((profileData: ProfileData, authUser: User): AuthUser => {
    return {
      id: profileData.id,
      email: profileData.email || authUser.email || '',
      fullName: profileData.full_name,
      phone: profileData.phone,
      avatarUrl: profileData.avatar_url,
      preferredLanguage: (profileData.preferred_language || 'ar') as Language,
      role: profileData.role as AuthUser['role'],
      wholesaleStatus: (profileData.wholesale_status || 'none') as AuthUser['wholesaleStatus'],
      isWholesaleApproved: profileData.wholesale_status === 'approved',
      businessName: profileData.business_name,
      businessTaxId: profileData.business_tax_id,
      businessAddress: profileData.business_address ?? null,
      businessPhone: profileData.business_phone ?? null,
      businessDocuments: profileData.business_documents ?? null,
      wholesaleAppliedAt: profileData.wholesale_applied_at ?? null,
      wholesaleApprovedAt: profileData.wholesale_approved_at ?? null,
      wholesaleRejectionReason: profileData.wholesale_rejection_reason ?? null,
      wholesaleDiscountTier: profileData.wholesale_discount_tier ?? null,
    };
  }, []);

  // =========================================================================
  // INITIALIZE AUTH
  // =========================================================================

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (!mounted) return;

        if (currentSession?.user) {
          setSession(currentSession);

          // Fetch profile
          const userProfile = await fetchProfile(currentSession.user.id);

          if (userProfile && mounted) {
            setProfile(userProfile);
            setUser(profileToAuthUser(userProfile, currentSession.user));
          } else if (mounted) {
            // Create basic user object if no profile yet
            setUser({
              id: currentSession.user.id,
              email: currentSession.user.email || '',
              fullName: null,
              phone: null,
              avatarUrl: null,
              preferredLanguage: 'ar',
              role: 'customer',
              wholesaleStatus: 'none',
              isWholesaleApproved: false,
              businessName: null,
              businessTaxId: null,
              businessAddress: null,
              businessPhone: null,
              businessDocuments: null,
              wholesaleAppliedAt: null,
              wholesaleApprovedAt: null,
              wholesaleRejectionReason: null,
              wholesaleDiscountTier: null,
            });
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        console.log('Auth state changed:', event);

        if (event === 'SIGNED_IN' && newSession?.user) {
          setSession(newSession);
          setIsLoading(true);

          // Fetch profile
          const userProfile = await fetchProfile(newSession.user.id);

          if (userProfile && mounted) {
            setProfile(userProfile);
            setUser(profileToAuthUser(userProfile, newSession.user));

            // Migrate guest cart to user cart
            await migrateGuestCart(newSession.user.id);
          }

          setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setProfile(null);
          setUser(null);
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          setSession(newSession);
        } else if (event === 'USER_UPDATED' && newSession?.user) {
          // Refresh profile on user update
          const userProfile = await fetchProfile(newSession.user.id);
          if (userProfile && mounted) {
            setProfile(userProfile);
            setUser(profileToAuthUser(userProfile, newSession.user));
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, profileToAuthUser]);

  // =========================================================================
  // SIGN IN WITH EMAIL/PASSWORD
  // =========================================================================

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // =========================================================================
  // SIGN IN WITH MAGIC LINK
  // =========================================================================

  const signInWithMagicLink = useCallback(async (email: string) => {
    try {
      setIsLoading(true);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // =========================================================================
  // SIGN UP (RETAIL)
  // =========================================================================

  const signUp = useCallback(async (data: SignUpData) => {
    try {
      setIsLoading(true);

      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // =========================================================================
  // SIGN UP (WHOLESALE)
  // =========================================================================

  const signUpWholesale = useCallback(async (data: WholesaleSignUpData) => {
    try {
      setIsLoading(true);

      // Step 1: Create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        return { error: authError };
      }

      const userId = authData.user?.id;
      if (!userId) {
        return { error: new Error('User creation failed') };
      }

      // Step 2: Upload business license if provided
      let documentUrls: string[] = [];
      if (data.businessLicense) {
        const fileExt = data.businessLicense.name.split('.').pop();
        const fileName = `${userId}/business-license-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('business-licenses')
          .upload(fileName, data.businessLicense);

        if (uploadError) {
          console.error('Error uploading license:', uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from('business-licenses')
            .getPublicUrl(fileName);
          documentUrls = [urlData.publicUrl];
        }
      }

      // Step 3: Update profile with wholesale application data
      // Note: The profile is auto-created by trigger, so we update it
      // Using type assertion to bypass strict typing
      const updateData = {
        business_name: data.businessName,
        business_tax_id: data.businessTaxId,
        business_address: data.businessAddress,
        business_phone: data.businessPhone,
        business_documents: documentUrls,
        wholesale_status: 'pending',
        wholesale_applied_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData as never)
        .eq('id', userId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        return { error: profileError as unknown as Error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // =========================================================================
  // SIGN OUT
  // =========================================================================

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { error };
      }

      // Clear local state
      setSession(null);
      setProfile(null);
      setUser(null);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // =========================================================================
  // RESET PASSWORD
  // =========================================================================

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  // =========================================================================
  // UPDATE PASSWORD
  // =========================================================================

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  // =========================================================================
  // UPDATE PROFILE
  // =========================================================================

  const updateProfile = useCallback(async (updates: ProfileUpdates) => {
    if (!user) {
      return { error: new Error('Not authenticated') };
    }

    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData as never)
        .eq('id', user.id);

      if (error) {
        return { error: error as unknown as Error };
      }

      // Refresh profile
      const newProfile = await fetchProfile(user.id);
      if (newProfile && session?.user) {
        setProfile(newProfile);
        setUser(profileToAuthUser(newProfile, session.user));
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, [user, session, fetchProfile, profileToAuthUser]);

  // =========================================================================
  // REFRESH PROFILE
  // =========================================================================

  const refreshProfile = useCallback(async () => {
    if (!user || !session?.user) return;

    const newProfile = await fetchProfile(user.id);
    if (newProfile) {
      setProfile(newProfile);
      setUser(profileToAuthUser(newProfile, session.user));
    }
  }, [user, session, fetchProfile, profileToAuthUser]);

  // =========================================================================
  // CONTEXT VALUE
  // =========================================================================

  const value: AuthContextValue = {
    user,
    session,
    profile,
    isLoading,
    isAuthenticated,
    isAdmin,
    isWholesale,
    isPendingWholesale,
    signIn,
    signInWithMagicLink,
    signUp,
    signUpWholesale,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}