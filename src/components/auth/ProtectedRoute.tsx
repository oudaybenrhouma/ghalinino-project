/**
 * Protected Route Component
 * Ghalinino - Tunisia E-commerce
 * 
 * Wraps routes that require authentication.
 * Redirects to login if not authenticated.
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks';

// ============================================================================
// TYPES
// ============================================================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Require admin role */
  requireAdmin?: boolean;
  /** Require approved wholesale status */
  requireWholesale?: boolean;
  /** Allow pending wholesale users */
  allowPendingWholesale?: boolean;
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function LoadingSkeleton() {
  const { isRTL } = useLanguage();
  
  return (
    <div className={cn(
      'min-h-screen flex items-center justify-center',
      'bg-gradient-to-br from-slate-50 via-white to-red-50',
      isRTL ? 'font-[Cairo]' : 'font-[Inter]'
    )}>
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center animate-pulse">
          <span className="text-white font-bold text-2xl">غ</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5 animate-spin text-red-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-slate-600">
            {isRTL ? 'جاري التحميل...' : 'Chargement...'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ACCESS DENIED
// ============================================================================

interface AccessDeniedProps {
  type: 'admin' | 'wholesale' | 'pending';
}

function AccessDenied({ type }: AccessDeniedProps) {
  const { language, isRTL } = useLanguage();
  
  const messages = {
    admin: {
      title: { ar: 'غير مصرح', fr: 'Non autorisé' },
      message: { ar: 'هذه الصفحة للمسؤولين فقط', fr: 'Cette page est réservée aux administrateurs' },
    },
    wholesale: {
      title: { ar: 'حساب تاجر مطلوب', fr: 'Compte grossiste requis' },
      message: { ar: 'يجب أن يكون لديك حساب تاجر معتمد للوصول لهذه الصفحة', fr: 'Vous devez avoir un compte grossiste approuvé pour accéder à cette page' },
    },
    pending: {
      title: { ar: 'طلبك قيد المراجعة', fr: 'Demande en cours d\'examen' },
      message: { ar: 'سيتم إعلامك عند الموافقة على طلبك', fr: 'Vous serez notifié dès l\'approbation de votre demande' },
    },
  };
  
  const { title, message } = messages[type];
  
  return (
    <div className={cn(
      'min-h-screen flex items-center justify-center py-12 px-4',
      'bg-gradient-to-br from-slate-50 via-white to-red-50',
      isRTL ? 'font-[Cairo]' : 'font-[Inter]'
    )}>
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {title[language]}
        </h2>
        <p className="text-slate-600">
          {message[language]}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProtectedRoute({
  children,
  requireAdmin = false,
  requireWholesale = false,
  allowPendingWholesale = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isAdmin, isWholesale, isPendingWholesale } = useAuthContext();
  const location = useLocation();

  // Show loading state while checking auth
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Check admin access
  if (requireAdmin && !isAdmin) {
    return <AccessDenied type="admin" />;
  }

  // Check wholesale access
  if (requireWholesale) {
    if (isPendingWholesale && !allowPendingWholesale) {
      return <AccessDenied type="pending" />;
    }
    if (!isWholesale && !isPendingWholesale) {
      return <AccessDenied type="wholesale" />;
    }
  }

  return <>{children}</>;
}
