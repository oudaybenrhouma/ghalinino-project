/**
 * Custom Hooks
 * Re-export all hooks from a single entry point
 */

export { useAuth } from './useAuth';
export { useLanguage } from './useLanguage';
export { useProducts, useCategories, useBrands } from './useProducts';
export { useProductDetail, useRelatedProducts } from './useProductDetail';
export { useCart } from './useCart';

export type { ProductFilters, ProductSortOption, UseProductsOptions, ProductWithCategory } from './useProducts';
export type { ProductDetail, UseProductDetailOptions } from './useProductDetail';
export type { CartItemWithProduct, CartSummary as CartSummaryType, UseCartReturn } from './useCart';
export { useScrollRestoration, useScrollControl, clearAllScrollPositions } from './useScrollRestoration';

