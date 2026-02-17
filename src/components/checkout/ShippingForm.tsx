/**
 * Shipping Form Component
 * Ghalinino - Tunisia E-commerce
 * 
 * Shipping address form with Tunisia governorates.
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn, GOVERNORATES } from '@/lib/utils';
import { useLanguage } from '@/hooks';
import { useAuthContext } from '@/contexts/AuthContext';
import { isValidTunisianPhone, type ShippingAddress } from '@/lib/checkout';
import { Button } from '@/components/common';
import type { Governorate } from '@/types';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const shippingSchema = z.object({
  fullName: z.string().min(2, 'Name is too short'),
  phone: z.string().refine(isValidTunisianPhone, 'Invalid phone number'),
  addressLine1: z.string().min(5, 'Address is too short'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  governorate: z.string().min(1, 'Governorate is required'),
  postalCode: z.string().optional(),
  saveToProfile: z.boolean().optional(),
});

type ShippingFormData = z.infer<typeof shippingSchema>;

// ============================================================================
// TYPES
// ============================================================================

interface ShippingFormProps {
  initialData?: Partial<ShippingAddress>;
  onSubmit: (data: ShippingAddress, saveToProfile: boolean) => void;
  onBack?: () => void;
  isLoading?: boolean;
}

// ============================================================================
// TRANSLATIONS
// ============================================================================

const t = {
  title: { ar: 'عنوان التوصيل', fr: 'Adresse de livraison' },
  useSavedAddress: { ar: 'استخدم العنوان المحفوظ', fr: 'Utiliser l\'adresse enregistrée' },
  fullName: { ar: 'الاسم الكامل', fr: 'Nom complet' },
  phone: { ar: 'رقم الهاتف', fr: 'Téléphone' },
  phonePlaceholder: { ar: '+216 XX XXX XXX', fr: '+216 XX XXX XXX' },
  addressLine1: { ar: 'العنوان (السطر 1)', fr: 'Adresse (ligne 1)' },
  addressLine1Placeholder: { ar: 'الشارع، رقم المبنى', fr: 'Rue, numéro' },
  addressLine2: { ar: 'العنوان (السطر 2) - اختياري', fr: 'Adresse (ligne 2) - optionnel' },
  addressLine2Placeholder: { ar: 'الطابق، الشقة', fr: 'Étage, appartement' },
  city: { ar: 'المدينة', fr: 'Ville' },
  governorate: { ar: 'الولاية', fr: 'Gouvernorat' },
  selectGovernorate: { ar: 'اختر الولاية', fr: 'Sélectionnez le gouvernorat' },
  postalCode: { ar: 'الرمز البريدي (اختياري)', fr: 'Code postal (optionnel)' },
  saveToProfile: { ar: 'حفظ العنوان في حسابي', fr: 'Enregistrer dans mon profil' },
  continue: { ar: 'متابعة', fr: 'Continuer' },
  back: { ar: 'رجوع', fr: 'Retour' },
  errors: {
    nameTooShort: { ar: 'الاسم قصير جداً', fr: 'Nom trop court' },
    invalidPhone: { ar: 'رقم الهاتف غير صالح (يجب أن يكون تونسي)', fr: 'Téléphone invalide (doit être tunisien)' },
    addressTooShort: { ar: 'العنوان قصير جداً', fr: 'Adresse trop courte' },
    cityRequired: { ar: 'المدينة مطلوبة', fr: 'Ville requise' },
    governorateRequired: { ar: 'الولاية مطلوبة', fr: 'Gouvernorat requis' },
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ShippingForm({
  initialData,
  onSubmit,
  onBack,
  isLoading = false,
}: ShippingFormProps) {
  const { language, isRTL } = useLanguage();
  const { isAuthenticated, profile } = useAuthContext();

  const form = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      fullName: initialData?.fullName || '',
      phone: initialData?.phone || '',
      addressLine1: initialData?.addressLine1 || '',
      addressLine2: initialData?.addressLine2 || '',
      city: initialData?.city || '',
      governorate: initialData?.governorate || '',
      postalCode: initialData?.postalCode || '',
      saveToProfile: false,
    },
  });

  // Check if user has saved address
  const hasSavedAddress = isAuthenticated && profile?.default_address;

  // Load saved address from profile
  const loadSavedAddress = () => {
    if (profile) {
      form.setValue('fullName', profile.full_name || '');
      form.setValue('phone', profile.phone || '');
      form.setValue('addressLine1', profile.default_address || '');
      form.setValue('city', profile.default_city || '');
      form.setValue('governorate', profile.default_governorate || '');
      form.setValue('postalCode', profile.default_postal_code || '');
    }
  };

  // Pre-fill from profile on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && profile && !initialData?.fullName) {
      form.setValue('fullName', profile.full_name || '');
      form.setValue('phone', profile.phone || '');
    }
  }, [isAuthenticated, profile, initialData, form]);

  const handleSubmit = (data: ShippingFormData) => {
    const address: ShippingAddress = {
      fullName: data.fullName,
      phone: data.phone,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      governorate: data.governorate as Governorate,
      postalCode: data.postalCode,
    };
    onSubmit(address, data.saveToProfile || false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {t.title[language]}
      </h2>

      {/* Use saved address button */}
      {hasSavedAddress && (
        <button
          type="button"
          onClick={loadSavedAddress}
          className={cn(
            'w-full mb-6 p-4 border-2 border-dashed border-slate-300 rounded-xl',
            'text-slate-600 hover:border-red-300 hover:text-red-600 transition-colors',
            'flex items-center justify-center gap-2'
          )}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          {t.useSavedAddress[language]}
        </button>
      )}

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-2">
            {t.fullName[language]} *
          </label>
          <input
            id="fullName"
            type="text"
            {...form.register('fullName')}
            className={cn(
              'w-full px-4 py-3 rounded-lg border border-slate-300',
              'focus:ring-2 focus:ring-red-500 focus:border-red-500',
              'transition-colors duration-200',
              form.formState.errors.fullName && 'border-red-500'
            )}
          />
          {form.formState.errors.fullName && (
            <p className="mt-1 text-sm text-red-600">{t.errors.nameTooShort[language]}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
            {t.phone[language]} *
          </label>
          <input
            id="phone"
            type="tel"
            dir="ltr"
            {...form.register('phone')}
            className={cn(
              'w-full px-4 py-3 rounded-lg border border-slate-300 text-left',
              'focus:ring-2 focus:ring-red-500 focus:border-red-500',
              'transition-colors duration-200',
              form.formState.errors.phone && 'border-red-500'
            )}
            placeholder={t.phonePlaceholder[language]}
          />
          {form.formState.errors.phone && (
            <p className="mt-1 text-sm text-red-600">{t.errors.invalidPhone[language]}</p>
          )}
        </div>

        {/* Address Line 1 */}
        <div>
          <label htmlFor="addressLine1" className="block text-sm font-medium text-slate-700 mb-2">
            {t.addressLine1[language]} *
          </label>
          <input
            id="addressLine1"
            type="text"
            {...form.register('addressLine1')}
            className={cn(
              'w-full px-4 py-3 rounded-lg border border-slate-300',
              'focus:ring-2 focus:ring-red-500 focus:border-red-500',
              'transition-colors duration-200',
              form.formState.errors.addressLine1 && 'border-red-500'
            )}
            placeholder={t.addressLine1Placeholder[language]}
          />
          {form.formState.errors.addressLine1 && (
            <p className="mt-1 text-sm text-red-600">{t.errors.addressTooShort[language]}</p>
          )}
        </div>

        {/* Address Line 2 */}
        <div>
          <label htmlFor="addressLine2" className="block text-sm font-medium text-slate-700 mb-2">
            {t.addressLine2[language]}
          </label>
          <input
            id="addressLine2"
            type="text"
            {...form.register('addressLine2')}
            className={cn(
              'w-full px-4 py-3 rounded-lg border border-slate-300',
              'focus:ring-2 focus:ring-red-500 focus:border-red-500',
              'transition-colors duration-200'
            )}
            placeholder={t.addressLine2Placeholder[language]}
          />
        </div>

        {/* City and Governorate */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* City */}
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-2">
              {t.city[language]} *
            </label>
            <input
              id="city"
              type="text"
              {...form.register('city')}
              className={cn(
                'w-full px-4 py-3 rounded-lg border border-slate-300',
                'focus:ring-2 focus:ring-red-500 focus:border-red-500',
                'transition-colors duration-200',
                form.formState.errors.city && 'border-red-500'
              )}
            />
            {form.formState.errors.city && (
              <p className="mt-1 text-sm text-red-600">{t.errors.cityRequired[language]}</p>
            )}
          </div>

          {/* Governorate */}
          <div>
            <label htmlFor="governorate" className="block text-sm font-medium text-slate-700 mb-2">
              {t.governorate[language]} *
            </label>
            <select
              id="governorate"
              {...form.register('governorate')}
              className={cn(
                'w-full px-4 py-3 rounded-lg border border-slate-300 bg-white',
                'focus:ring-2 focus:ring-red-500 focus:border-red-500',
                'transition-colors duration-200',
                form.formState.errors.governorate && 'border-red-500'
              )}
            >
              <option value="">{t.selectGovernorate[language]}</option>
              {GOVERNORATES.map((gov) => (
                <option key={gov.id} value={gov.id}>
                  {language === 'ar' ? gov.name.ar : gov.name.fr}
                </option>
              ))}
            </select>
            {form.formState.errors.governorate && (
              <p className="mt-1 text-sm text-red-600">{t.errors.governorateRequired[language]}</p>
            )}
          </div>
        </div>

        {/* Postal Code */}
        <div className="sm:w-1/2">
          <label htmlFor="postalCode" className="block text-sm font-medium text-slate-700 mb-2">
            {t.postalCode[language]}
          </label>
          <input
            id="postalCode"
            type="text"
            dir="ltr"
            {...form.register('postalCode')}
            className={cn(
              'w-full px-4 py-3 rounded-lg border border-slate-300 text-left',
              'focus:ring-2 focus:ring-red-500 focus:border-red-500',
              'transition-colors duration-200'
            )}
            placeholder="1000"
          />
        </div>

        {/* Save to profile checkbox */}
        {isAuthenticated && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="saveToProfile"
              {...form.register('saveToProfile')}
              className="rounded text-red-600 focus:ring-red-500"
            />
            <label htmlFor="saveToProfile" className="text-sm text-slate-700">
              {t.saveToProfile[language]}
            </label>
          </div>
        )}

        {/* Actions */}
        <div className={cn('flex gap-4 pt-4', isRTL && 'flex-row-reverse')}>
          {onBack && (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-shrink-0"
            >
              {t.back[language]}
            </Button>
          )}
          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isLoading}
            rightIcon={
              <svg className={cn('w-5 h-5', isRTL && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            }
          >
            {t.continue[language]}
          </Button>
        </div>
      </form>
    </div>
  );
}
