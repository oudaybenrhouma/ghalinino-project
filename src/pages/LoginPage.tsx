/**
 * Login Page - MODERNIZED
 * Ghalinino - Tunisia E-commerce
 * 
 * IMPROVEMENTS:
 * - More elegant card design with subtle shadows
 * - Better visual hierarchy with improved spacing
 * - Enhanced form inputs with better focus states
 * - Smoother transitions and micro-interactions
 * - Improved error messaging with better visibility
 * - Modern gradient backgrounds
 * - Better logo presentation
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks';
import { Button } from '@/components/common';
import { cn } from '@/lib/utils';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const magicLinkSchema = z.object({
  email: z.string().email(),
});

type LoginFormData = z.infer<typeof loginSchema>;
type MagicLinkFormData = z.infer<typeof magicLinkSchema>;

// ============================================================================
// TRANSLATIONS
// ============================================================================

const t = {
  title: { ar: 'تسجيل الدخول', fr: 'Connexion' },
  subtitle: { ar: 'أهلاً بعودتك إلى غالينينو', fr: 'Bienvenue sur Ghalinino' },
  email: { ar: 'البريد الإلكتروني', fr: 'Email' },
  password: { ar: 'كلمة المرور', fr: 'Mot de passe' },
  forgotPassword: { ar: 'نسيت كلمة المرور؟', fr: 'Mot de passe oublié ?' },
  signIn: { ar: 'تسجيل الدخول', fr: 'Se connecter' },
  signingIn: { ar: 'جاري تسجيل الدخول...', fr: 'Connexion en cours...' },
  orContinueWith: { ar: 'أو تابع باستخدام', fr: 'Ou continuer avec' },
  magicLink: { ar: 'رابط سحري', fr: 'Lien magique' },
  sendMagicLink: { ar: 'إرسال رابط سحري', fr: 'Envoyer un lien magique' },
  sendingMagicLink: { ar: 'جاري الإرسال...', fr: 'Envoi en cours...' },
  magicLinkSent: { ar: 'تم إرسال الرابط! تحقق من بريدك الإلكتروني', fr: 'Lien envoyé ! Vérifiez votre email' },
  backToPassword: { ar: 'العودة لكلمة المرور', fr: 'Retour au mot de passe' },
  noAccount: { ar: 'ليس لديك حساب؟', fr: "Vous n'avez pas de compte ?" },
  createAccount: { ar: 'إنشاء حساب', fr: 'Créer un compte' },
  wholesaleAccount: { ar: 'حساب تاجر بالجملة؟', fr: 'Compte grossiste ?' },
  registerWholesale: { ar: 'سجل كتاجر', fr: "S'inscrire comme grossiste" },
  errors: {
    invalidCredentials: { ar: 'بيانات الدخول غير صحيحة', fr: 'Identifiants invalides' },
    networkError: { ar: 'خطأ في الشبكة، حاول مجدداً', fr: 'Erreur réseau, réessayez' },
    invalidEmail: { ar: 'بريد إلكتروني غير صالح', fr: 'Email invalide' },
    passwordTooShort: { ar: 'كلمة المرور قصيرة جداً (6 أحرف على الأقل)', fr: 'Mot de passe trop court (min 6 caractères)' },
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function LoginPage() {
  const { signIn, signInWithMagicLink, isLoading } = useAuthContext();
  const { language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: string })?.from || '/';

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const magicLinkForm = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: '' },
  });

  const handleLogin = async (data: LoginFormData) => {
    setError(null);
    const { error: signInError } = await signIn(data.email, data.password);

    if (signInError) {
      if (signInError.message.includes('Invalid login')) {
        setError(t.errors.invalidCredentials[language]);
      } else {
        setError(t.errors.networkError[language]);
      }
      return;
    }

    navigate(from, { replace: true });
  };

  const handleMagicLink = async (data: MagicLinkFormData) => {
    setError(null);
    const { error: magicError } = await signInWithMagicLink(data.email);

    if (magicError) {
      setError(t.errors.networkError[language]);
      return;
    }

    setMagicLinkSent(true);
  };

  return (
    <div className={cn(
      'min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8',
      'bg-gradient-to-br from-slate-50 via-white to-red-50/30',
      'relative overflow-hidden',
      isRTL ? 'font-[Cairo]' : 'font-[Instrument_Sans]'
    )}>
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-100 rounded-full blur-3xl opacity-30" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-100 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo & Title Section */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-4 mb-6 group">
            <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200 group-hover:shadow-xl group-hover:shadow-red-300 transition-all duration-300">
              <span className="text-white font-bold text-2xl">غ</span>
            </div>
            <span className="text-3xl font-bold text-slate-900">
              {language === 'ar' ? 'غالينينو' : 'Ghalinino'}
            </span>
          </Link>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            {t.title[language]}
          </h2>
          <p className="text-slate-600 text-lg">
            {t.subtitle[language]}
          </p>
        </div>

        {/* Form Card - Elevated Design */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-slate-200/50 p-8 border border-white">
          {/* Error Message - Enhanced */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-in slide-in-from-top duration-300">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message - Enhanced */}
          {magicLinkSent && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg animate-in slide-in-from-top duration-300">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-green-700 font-medium">{t.magicLinkSent[language]}</p>
              </div>
            </div>
          )}

          {!useMagicLink ? (
            /* Email/Password Form */
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                  {t.email[language]}
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...loginForm.register('email')}
                  className={cn(
                    'w-full px-4 py-3.5 rounded-xl border-2 bg-slate-50',
                    'transition-all duration-200',
                    'focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-100',
                    'placeholder:text-slate-400',
                    loginForm.formState.errors.email 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                  placeholder={language === 'ar' ? 'example@email.com' : 'exemple@email.com'}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {t.errors.invalidEmail[language]}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                    {t.password[language]}
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                  >
                    {t.forgotPassword[language]}
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...loginForm.register('password')}
                  className={cn(
                    'w-full px-4 py-3.5 rounded-xl border-2 bg-slate-50',
                    'transition-all duration-200',
                    'focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-100',
                    'placeholder:text-slate-400',
                    loginForm.formState.errors.password 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                  placeholder="••••••••"
                />
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {t.errors.passwordTooShort[language]}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                size="lg"
                isLoading={isLoading}
                className="!py-3.5 !rounded-xl !text-base font-semibold shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300 transition-all duration-300"
              >
                {isLoading ? t.signingIn[language] : t.signIn[language]}
              </Button>
            </form>
          ) : (
            /* Magic Link Form */
            <form onSubmit={magicLinkForm.handleSubmit(handleMagicLink)} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="magic-email" className="block text-sm font-semibold text-slate-700">
                  {t.email[language]}
                </label>
                <input
                  id="magic-email"
                  type="email"
                  autoComplete="email"
                  {...magicLinkForm.register('email')}
                  className={cn(
                    'w-full px-4 py-3.5 rounded-xl border-2 bg-slate-50',
                    'transition-all duration-200',
                    'focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-100',
                    'placeholder:text-slate-400',
                    magicLinkForm.formState.errors.email 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                  placeholder={language === 'ar' ? 'example@email.com' : 'exemple@email.com'}
                />
              </div>

              <Button
                type="submit"
                fullWidth
                size="lg"
                isLoading={isLoading}
                className="!py-3.5 !rounded-xl !text-base font-semibold shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300 transition-all duration-300"
              >
                {isLoading ? t.sendingMagicLink[language] : t.sendMagicLink[language]}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setUseMagicLink(false);
                  setMagicLinkSent(false);
                }}
                className="w-full text-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                {t.backToPassword[language]}
              </button>
            </form>
          )}

          {/* Divider */}
          {!useMagicLink && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500 font-medium">
                    {t.orContinueWith[language]}
                  </span>
                </div>
              </div>

              {/* Magic Link Button */}
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => setUseMagicLink(true)}
                className="!py-3.5 !rounded-xl !text-base font-semibold !border-2"
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              >
                {t.magicLink[language]}
              </Button>
            </>
          )}
        </div>

        {/* Footer Links - Enhanced */}
        <div className="text-center space-y-4 mt-8">
          <p className="text-slate-600 font-medium">
            {t.noAccount[language]}{' '}
            <Link 
              to="/register" 
              className="font-bold text-red-600 hover:text-red-700 transition-colors underline decoration-red-600/30 hover:decoration-red-600 underline-offset-2"
            >
              {t.createAccount[language]}
            </Link>
          </p>
          <p className="text-slate-500">
            {t.wholesaleAccount[language]}{' '}
            <Link 
              to="/register/wholesale" 
              className="font-semibold text-red-600 hover:text-red-700 transition-colors underline decoration-red-600/30 hover:decoration-red-600 underline-offset-2"
            >
              {t.registerWholesale[language]}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}