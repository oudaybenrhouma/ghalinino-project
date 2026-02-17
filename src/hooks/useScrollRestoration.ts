/**
 * Scroll Restoration Hook
 * Ghalinino - Tunisia E-commerce
 * 
 * PURPOSE:
 * ========
 * Preserves and restores scroll position when navigating between pages.
 * Solves the problem where users lose their position when viewing a product
 * and then navigating back to the products list.
 * 
 * FEATURES:
 * =========
 * - Automatic scroll position saving
 * - Restoration on back navigation
 * - Per-route scroll memory
 * - Configurable restoration behavior
 * 
 * USAGE:
 * ======
 * Add to any page that needs scroll restoration:
 * 
 * function ProductsPage() {
 *   useScrollRestoration();
 *   // Rest of component
 * }
 * 
 * Or with custom key:
 * 
 * function ProductsPage() {
 *   const { categorySlug } = useParams();
 *   useScrollRestoration(`products-${categorySlug}`);
 * }
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// ============================================================================
// SCROLL POSITION STORAGE
// ============================================================================

/**
 * In-memory storage for scroll positions
 * Using a Map provides O(1) lookup/insertion
 */
const scrollPositions = new Map<string, number>();

/**
 * Session storage key prefix for persistence across refreshes
 */
const STORAGE_KEY = 'scroll-positions';

// ============================================================================
// STORAGE HELPERS
// ============================================================================

/**
 * Load scroll positions from sessionStorage
 * Called once on app mount
 */
function loadScrollPositions(): void {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const positions: Record<string, number> = JSON.parse(stored);
      Object.entries(positions).forEach(([key, value]) => {
        scrollPositions.set(key, value);
      });
    }
  } catch (error) {
    console.warn('Failed to load scroll positions:', error);
  }
}

/**
 * Save scroll positions to sessionStorage
 * Called on navigation and before unload
 */
function saveScrollPositions(): void {
  try {
    const positions: Record<string, number> = {};
    scrollPositions.forEach((value, key) => {
      positions[key] = value;
    });
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch (error) {
    console.warn('Failed to save scroll positions:', error);
  }
}

// ============================================================================
// MAIN HOOK
// ============================================================================

interface UseScrollRestorationOptions {
  /** Delay before restoring scroll (ms) - allows content to render */
  delay?: number;
  /** Whether to restore scroll (useful for disabling on specific pages) */
  enabled?: boolean;
  /** Custom scroll behavior */
  behavior?: ScrollBehavior;
}

/**
 * Hook that automatically saves and restores scroll position
 * 
 * @param key - Optional custom key for this route (default: pathname)
 * @param options - Configuration options
 */
export function useScrollRestoration(
  key?: string,
  options: UseScrollRestorationOptions = {}
) {
  const location = useLocation();
  const {
    delay = 0,
    enabled = true,
    behavior = 'auto',
  } = options;

  // Use custom key or pathname
  const storageKey = key || location.pathname;
  
  // Track if we've restored on this mount
  const hasRestoredRef = useRef(false);
  
  // Track previous pathname to detect navigation
  const prevPathnameRef = useRef(location.pathname);

  useEffect(() => {
    if (!enabled) return;

    // Load positions from sessionStorage on first mount
    if (scrollPositions.size === 0) {
      loadScrollPositions();
    }

    // Save current scroll position when navigating away
    const saveCurrentPosition = () => {
      const currentScrollY = window.scrollY;
      scrollPositions.set(storageKey, currentScrollY);
      saveScrollPositions();
    };

    // Check if we navigated to a new page
    const didNavigate = prevPathnameRef.current !== location.pathname;
    prevPathnameRef.current = location.pathname;

    // Restore scroll position
    if (!hasRestoredRef.current && didNavigate) {
      const savedPosition = scrollPositions.get(storageKey);
      
      if (savedPosition !== undefined) {
        // Delay restoration to allow content to render
        const timeoutId = setTimeout(() => {
          window.scrollTo({
            top: savedPosition,
            left: 0,
            behavior,
          });
          hasRestoredRef.current = true;
        }, delay);

        return () => clearTimeout(timeoutId);
      } else {
        // No saved position, scroll to top
        window.scrollTo({
          top: 0,
          left: 0,
          behavior,
        });
        hasRestoredRef.current = true;
      }
    }

    // Save position on scroll (debounced)
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(saveCurrentPosition, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Save position before unmounting
    return () => {
      clearTimeout(scrollTimeout);
      window.removeEventListener('scroll', handleScroll);
      saveCurrentPosition();
    };
  }, [location.pathname, storageKey, delay, behavior, enabled]);

  // Save all positions before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveScrollPositions();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);
}

// ============================================================================
// MANUAL CONTROL HOOK
// ============================================================================

/**
 * Hook that provides manual control over scroll position
 * Useful for custom scroll behaviors
 */
export function useScrollControl(key?: string) {
  const location = useLocation();
  const storageKey = key || location.pathname;

  const savePosition = (position?: number) => {
    const scrollY = position ?? window.scrollY;
    scrollPositions.set(storageKey, scrollY);
    saveScrollPositions();
  };

  const restorePosition = (behavior: ScrollBehavior = 'auto') => {
    const savedPosition = scrollPositions.get(storageKey);
    if (savedPosition !== undefined) {
      window.scrollTo({
        top: savedPosition,
        left: 0,
        behavior,
      });
      return true;
    }
    return false;
  };

  const clearPosition = () => {
    scrollPositions.delete(storageKey);
    saveScrollPositions();
  };

  const getPosition = (): number | undefined => {
    return scrollPositions.get(storageKey);
  };

  return {
    savePosition,
    restorePosition,
    clearPosition,
    getPosition,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Clear all saved scroll positions
 * Useful for logout or data reset
 */
export function clearAllScrollPositions(): void {
  scrollPositions.clear();
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear scroll positions:', error);
  }
}

/**
 * Get all saved scroll positions (for debugging)
 */
export function getAllScrollPositions(): Map<string, number> {
  return new Map(scrollPositions);
}