/**
 * Retail Registration Page
 * Ghalinino - Tunisia E-commerce
 * 
 * Simple registration for retail customers.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks';
import { Button } from '@/components/common';
import { cn, isValidTunisianPhone } from '@/lib/utils';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().refine(isValidTunisianPhone, {
    message: 'Invalid phone number',
  }),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

// ============================================================================
// TRANSLATIONS
// ============================================================================

const t = {
  title: { ar: 'إنشاء حساب', fr: 'Créer un compte' },
  subtitle: { ar: 'انضم إلى عائلة غالينينو', fr: 'Rejoignez la famille Ghalinino' },
  fullName: { ar: 'الاسم الكامل', fr: 'Nom complet' },
  email: { ar: 'البريد الإلكتروني', fr: 'Email' },
  phone: { ar: 'رقم الهاتف', fr: 'Numéro de téléphone' },
  password: { ar: 'كلمة المرور', fr: 'Mot de passe' },
  confirmPassword: { ar: 'تأكيد كلمة المرور', fr: 'Confirmer le mot de passe' },
  createAccount: { ar: 'إنشاء الحساب', fr: 'Créer le compte' },
  creating: { ar: 'جاري الإنشاء...', fr: 'Création en cours...' },
  hasAccount: { ar: 'لديك حساب بالفعل؟', fr: 'Vous avez déjà un compte ?' },
  signIn: { ar: 'تسجيل الدخول', fr: 'Se connecter' },
  wholesaleAccount: { ar: 'تريد حساب تاجر بالجملة؟', fr: 'Vous voulez un compte grossiste ?' },
  registerWholesale: { ar: 'سجل كتاجر', fr: "S'inscrire comme grossiste" },
  success: {
    title: { ar: 'تم إنشاء حسابك بنجاح!', fr: 'Compte créé avec succès !' },
    message: { ar: 'تحقق من بريدك الإلكتروني لتأكيد حسابك', fr: 'Vérifiez votre email pour confirmer votre compte' },
  },
  errors: {
    nameTooShort: { ar: 'الاسم قصير جداً', fr: 'Nom trop court' },
    invalidEmail: { ar: 'بريد إلكتروني غير صالح', fr: 'Email invalide' },
    invalidPhone: { ar: 'رقم هاتف غير صالح (يجب أن يكون تونسي)', fr: 'Numéro de téléphone invalide (doit être tunisien)' },
    passwordTooShort: { ar: 'كلمة المرور قصيرة جداً (6 أحرف على الأقل)', fr: 'Mot de passe trop court (min 6 caractères)' },
    passwordsNotMatch: { ar: 'كلمات المرور غير متطابقة', fr: 'Les mots de passe ne correspondent pas' },
    emailExists: { ar: 'هذا البريد الإلكتروني مسجل مسبقاً', fr: 'Cet email est déjà utilisé' },
    networkError: { ar: 'خطأ في الشبكة، حاول مجدداً', fr: 'Erreur réseau, réessayez' },
  },
  phonePlaceholder: { ar: '+216 XX XXX XXX', fr: '+216 XX XXX XXX' },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function RegisterPage() {
  const { signUp, isLoading } = useAuthContext();
  const { language, isRTL } = useLanguage();
  const navigate = useNavigate();
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleSubmit = async (data: RegisterFormData) => {
    setError(null);

    const { error: signUpError } = await signUp({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      phone: data.phone,
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError(t.errors.emailExists[language]);
      } else {
        setError(t.errors.networkError[language]);
      }
      return;
    }

    setSuccess(true);
  };

  // Success state
  if (success) {
    return (
      <div className={cn(
        'min-h-screen flex items-center justify-center py-12 px-4',
        'bg-gradient-to-br from-slate-50 via-white to-red-50',
        isRTL ? 'font-[Cairo]' : 'font-[Inter]'
      )}>
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {t.success.title[language]}
          </h2>
          <p className="text-slate-600 mb-8">
            {t.success.message[language]}
          </p>
          <Button onClick={() => navigate('/login')} fullWidth>
            {t.signIn[language]}
          </Button>
        </div>
      </div>
    );
  }

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

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-2">
                {t.fullName[language]}
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                {...form.register('fullName')}
                className={cn(
                  'w-full px-4 py-3 rounded-lg border border-slate-300',
                  'focus:ring-2 focus:ring-red-500 focus:border-red-500',
                  'transition-colors duration-200',
                  form.formState.errors.fullName && 'border-red-500'
                )}
                placeholder={language === 'ar' ? 'أحمد بن علي' : 'Ahmed Ben Ali'}
              />
              {form.formState.errors.fullName && (
                <p className="mt-1 text-sm text-red-600">
                  {t.errors.nameTooShort[language]}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                {t.email[language]}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...form.register('email')}
                className={cn(
                  'w-full px-4 py-3 rounded-lg border border-slate-300',
                  'focus:ring-2 focus:ring-red-500 focus:border-red-500',
                  'transition-colors duration-200',
                  form.formState.errors.email && 'border-red-500'
                )}
                placeholder="example@email.com"
              />
              {form.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {t.errors.invalidEmail[language]}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                {t.phone[language]}
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                dir="ltr"
                {...form.register('phone')}
                className={cn(
                  'w-full px-4 py-3 rounded-lg border border-slate-300',
                  'focus:ring-2 focus:ring-red-500 focus:border-red-500',
                  'transition-colors duration-200 text-left',
                  form.formState.errors.phone && 'border-red-500'
                )}
                placeholder={t.phonePlaceholder[language]}
              />
              {form.formState.errors.phone && (
                <p className="mt-1 text-sm text-red-600">
                  {t.errors.invalidPhone[language]}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                {t.password[language]}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                {...form.register('password')}
                className={cn(
                  'w-full px-4 py-3 rounded-lg border border-slate-300',
                  'focus:ring-2 focus:ring-red-500 focus:border-red-500',
                  'transition-colors duration-200',
                  form.formState.errors.password && 'border-red-500'
                )}
                placeholder="••••••••"
              />
              {form.formState.errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {t.errors.passwordTooShort[language]}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                {t.confirmPassword[language]}
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...form.register('confirmPassword')}
                className={cn(
                  'w-full px-4 py-3 rounded-lg border border-slate-300',
                  'focus:ring-2 focus:ring-red-500 focus:border-red-500',
                  'transition-colors duration-200',
                  form.formState.errors.confirmPassword && 'border-red-500'
                )}
                placeholder="••••••••"
              />
              {form.formState.errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {t.errors.passwordsNotMatch[language]}
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
              {isLoading ? t.creating[language] : t.createAccount[language]}
            </Button>
          </form>
        </div>

        {/* Footer Links */}
        <div className="text-center space-y-3">
          <p className="text-slate-600">
            {t.hasAccount[language]}{' '}
            <Link to="/login" className="font-semibold text-red-600 hover:text-red-700">
              {t.signIn[language]}
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
