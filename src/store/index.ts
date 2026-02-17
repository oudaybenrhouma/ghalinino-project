/**
 * Global Store using Zustand
 * Tunisia E-commerce SPA
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Language, LocalCartItem, AuthUser, Notification } from '@/types';
import { getCurrentLanguage } from '@/lib/i18n';

// ============================================
// STORE TYPES
// ============================================

interface CartState {
  items: LocalCartItem[];
  isOpen: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface UIState {
  language: Language;
  isMobileMenuOpen: boolean;
  notifications: Notification[];
}

interface AppState extends CartState, AuthState, UIState {
  // Cart actions
  addToCart: (item: LocalCartItem) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setCartOpen: (isOpen: boolean) => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;

  // Auth actions
  setUser: (user: AuthUser | null) => void;
  setAuthLoading: (isLoading: boolean) => void;
  logout: () => void;

  // UI actions
  setLanguage: (language: Language) => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ============================================
      // INITIAL STATE
      // ============================================
      
      // Cart
      items: [],
      isOpen: false,

      // Auth
      user: null,
      isLoading: true,
      isAuthenticated: false,

      // UI
      language: getCurrentLanguage(),
      isMobileMenuOpen: false,
      notifications: [],

      // ============================================
      // CART ACTIONS
      // ============================================

      addToCart: (item) => {
        set((state) => {
          const existingItem = state.items.find(
            (i) => i.productId === item.productId
          );

          if (existingItem) {
            // Update quantity if item exists
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.product.quantity) }
                  : i
              ),
            };
          }

          // Add new item
          return { items: [...state.items, item] };
        });
      },

      removeFromCart: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId
              ? { ...i, quantity: Math.max(0, Math.min(quantity, i.product.quantity)) }
              : i
          ).filter((i) => i.quantity > 0),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      setCartOpen: (isOpen) => {
        set({ isOpen });
      },

      getCartTotal: () => {
        const { items } = get();
        return items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
      },

      getCartItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },

      // ============================================
      // AUTH ACTIONS
      // ============================================

      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        });
      },

      setAuthLoading: (isLoading) => {
        set({ isLoading });
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      // ============================================
      // UI ACTIONS
      // ============================================

      setLanguage: (language) => {
        set({ language });
      },

      toggleMobileMenu: () => {
        set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen }));
      },

      closeMobileMenu: () => {
        set({ isMobileMenuOpen: false });
      },

      addNotification: (notification) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        set((state) => ({
          notifications: [...state.notifications, { ...notification, id }],
        }));

        // Auto-remove after duration (default 5 seconds)
        const duration = notification.duration ?? 5000;
        if (duration > 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, duration);
        }
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },
    }),
    {
      name: 'souq-tunisia-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        items: state.items,
        language: state.language,
      }),
    }
  )
);

// ============================================
// SELECTORS
// ============================================

export const selectCartItems = (state: AppState) => state.items;
export const selectCartItemCount = (state: AppState) => state.getCartItemCount();
export const selectCartTotal = (state: AppState) => state.getCartTotal();
export const selectIsCartOpen = (state: AppState) => state.isOpen;

export const selectUser = (state: AppState) => state.user;
export const selectIsAuthenticated = (state: AppState) => state.isAuthenticated;
export const selectIsAuthLoading = (state: AppState) => state.isLoading;

export const selectLanguage = (state: AppState) => state.language;
export const selectIsMobileMenuOpen = (state: AppState) => state.isMobileMenuOpen;
export const selectNotifications = (state: AppState) => state.notifications;
