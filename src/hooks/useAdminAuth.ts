import { useAuthContext } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export type AdminRole = 'admin' | 'super_admin' | 'support' | 'inventory_manager';

export const ADMIN_ROLES = ['admin', 'super_admin', 'support', 'inventory_manager'];

export function hasAdminAccess(role?: string): boolean {
  return ADMIN_ROLES.includes(role || '');
}

export function useAdminAuth() {
  const { user, isLoading, isAuthenticated } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate('/admin/login', { state: { from: location.pathname } });
      } else if (!hasAdminAccess(user?.role)) {
        navigate('/'); // Redirect non-admins to home
      }
    }
  }, [isLoading, isAuthenticated, user, navigate, location]);

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin: hasAdminAccess(user?.role),
    role: user?.role as AdminRole,
  };
}
