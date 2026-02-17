/**
 * Auth Callback Page
 * Ghalinino - Tunisia E-commerce
 * 
 * Handles OAuth and magic link redirects.
 * Displays loading state while processing authentication.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/hooks';
import { cn } from '@/lib/utils';

// ============================================================================
// TRANSLATIONS
// ============================================================================

const t = {
  verifying: { ar: 'جاري التحقق...', fr: 'Vérification en cours...' },
  success: { ar: 'تم تسجيل الدخول بنجاح!', fr: 'Connexion réussie !' },
  redirecting: { ar: 'جاري التحويل...', fr: 'Redirection...' },
  error: { ar: 'حدث خطأ في التحقق', fr: 'Erreur lors de la vérification' },
  tryAgain: { ar: 'حاول مجدداً', fr: 'Réessayer' },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function AuthCallbackPage() {
  const { language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get session from URL hash (for magic links)
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          setStatus('error');
          setErrorMessage(error.message);
          return;
        }

        if (data.session) {
          setStatus('success');
          // Wait a moment to show success message
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 1500);
        } else {
          // No session - check URL for error
          const params = new URLSearchParams(window.location.hash.slice(1));
          const errorDescription = params.get('error_description');
          
          if (errorDescription) {
            setStatus('error');
            setErrorMessage(errorDescription);
          } else {
            // Redirect to login
            navigate('/login', { replace: true });
          }
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('error');
        setErrorMessage('An unexpected error occurred');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className={cn(
      'min-h-screen flex items-center justify-center',
      'bg-gradient-to-br from-slate-50 via-white to-red-50',
      isRTL ? 'font-[Cairo]' : 'font-[Inter]'
    )}>
      <div className="text-center">
        {/* Logo */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
          <span className="text-white font-bold text-2xl">غ</span>
        </div>

        {/* Verifying State */}
        {status === 'verifying' && (
          <>
            <div className="flex items-center justify-center gap-3 mb-4">
              <svg className="w-6 h-6 animate-spin text-red-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-lg text-slate-700">{t.verifying[language]}</span>
            </div>
          </>
        )}

        {/* Success State */}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {t.success[language]}
            </h2>
            <p className="text-slate-600">
              {t.redirecting[language]}
            </p>
          </>
        )}

        {/* Error State */}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {t.error[language]}
            </h2>
            {errorMessage && (
              <p className="text-slate-600 text-sm mb-4">
                {errorMessage}
              </p>
            )}
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              {t.tryAgain[language]}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
