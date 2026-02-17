/**
 * Login Page
 * Ghalinino - Tunisia E-commerce
 * 
 * Supports email/password and magic link authentication.
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
    emailRequired: { ar: 'البريد الإلكتروني مطلوب', fr: 'Email requis' },
    invalidEmail: { ar: 'بريد إلكتروني غير صالح', fr: 'Email invalide' },
    passwordRequired: { ar: 'كلمة المرور مطلوبة', fr: 'Mot de passe requis' },
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

  // Get redirect URL from location state
  const from = (location.state as { from?: string })?.from || '/';

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Magic link form
  const magicLinkForm = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: '',
    },
  });

  // Handle login
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

  // Handle magic link
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
      'bg-gradient-to-br from-slate-50 via-white to-red-50',
      isRTL ? 'font-[Cairo]' : 'font-[Inter]'
    )}>
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
              <span className="text-white font-bold text-xl">غ</span>
            </div>
            <span className="text-2xl font-bold text-slate-900">
              {language === 'ar' ? 'غالينينو' : 'Ghalinino'}
            </span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-slate-900">
            {t.title[language]}
          </h2>
          <p className="mt-2 text-slate-600">
            {t.subtitle[language]}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Magic Link Sent Message */}
          {magicLinkSent && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">{t.magicLinkSent[language]}</p>
            </div>
          )}

          {!useMagicLink ? (
            /* Email/Password Form */
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  {t.email[language]}
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...loginForm.register('email')}
                  className={cn(
                    'w-full px-4 py-3 rounded-lg border border-slate-300',
                    'focus:ring-2 focus:ring-red-500 focus:border-red-500',
                    'transition-colors duration-200',
                    loginForm.formState.errors.email && 'border-red-500'
                  )}
                  placeholder={language === 'ar' ? 'example@email.com' : 'exemple@email.com'}
                />
                {loginForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {t.errors.invalidEmail[language]}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    {t.password[language]}
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-red-600 hover:text-red-700"
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
                    'w-full px-4 py-3 rounded-lg border border-slate-300',
                    'focus:ring-2 focus:ring-red-500 focus:border-red-500',
                    'transition-colors duration-200',
                    loginForm.formState.errors.password && 'border-red-500'
                  )}
                  placeholder="••••••••"
                />
                {loginForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600">
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
              >
                {isLoading ? t.signingIn[language] : t.signIn[language]}
              </Button>
            </form>
          ) : (
            /* Magic Link Form */
            <form onSubmit={magicLinkForm.handleSubmit(handleMagicLink)} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="magic-email" className="block text-sm font-medium text-slate-700 mb-2">
                  {t.email[language]}
                </label>
                <input
                  id="magic-email"
                  type="email"
                  autoComplete="email"
                  {...magicLinkForm.register('email')}
                  className={cn(
                    'w-full px-4 py-3 rounded-lg border border-slate-300',
                    'focus:ring-2 focus:ring-red-500 focus:border-red-500',
                    'transition-colors duration-200',
                    magicLinkForm.formState.errors.email && 'border-red-500'
                  )}
                  placeholder={language === 'ar' ? 'example@email.com' : 'exemple@email.com'}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                size="lg"
                isLoading={isLoading}
              >
                {isLoading ? t.sendingMagicLink[language] : t.sendMagicLink[language]}
              </Button>

              {/* Back to Password */}
              <button
                type="button"
                onClick={() => {
                  setUseMagicLink(false);
                  setMagicLinkSent(false);
                }}
                className="w-full text-center text-sm text-slate-600 hover:text-slate-900"
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
                  <span className="px-4 bg-white text-slate-500">
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

        {/* Footer Links */}
        <div className="text-center space-y-3">
          <p className="text-slate-600">
            {t.noAccount[language]}{' '}
            <Link to="/register" className="font-semibold text-red-600 hover:text-red-700">
              {t.createAccount[language]}
            </Link>
          </p>
          <p className="text-slate-500 text-sm">
            {t.wholesaleAccount[language]}{' '}
            <Link to="/register/wholesale" className="font-semibold text-red-600 hover:text-red-700">
              {t.registerWholesale[language]}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
