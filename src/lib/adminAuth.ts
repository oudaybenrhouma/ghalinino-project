
export type AdminRole = 'admin' | 'super_admin' | 'support' | 'inventory_manager';

export const ADMIN_ROLES = ['admin', 'super_admin', 'support', 'inventory_manager'];

export function hasAdminAccess(role?: string): boolean {
  return ADMIN_ROLES.includes(role || '');
}

export function canManageOrders(role?: string): boolean {
  return ['admin', 'super_admin', 'support'].includes(role || '');
}

export function canManageProducts(role?: string): boolean {
  return ['admin', 'super_admin', 'inventory_manager'].includes(role || '');
}

export function canManageCustomers(role?: string): boolean {
  return ['admin', 'super_admin', 'support'].includes(role || '');
}

export function canApproveWholesale(role?: string): boolean {
  return ['admin', 'super_admin'].includes(role || '');
}
