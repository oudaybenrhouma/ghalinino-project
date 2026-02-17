/**
 * Wholesale Registration Page
 * Ghalinino - Tunisia E-commerce
 * 
 * Extended registration for wholesale/business customers.
 * Includes business license upload to Supabase Storage.
 */

import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { validateWholesaleAccount } from '@/lib/wholesaleValidation';
import { supabase } from '@/lib/supabase';

import { Button } from '@/components/common';
import { cn, isValidTunisianPhone } from '@/lib/utils';
import { useLanguage } from '@/hooks';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const wholesaleSchema = z.object({
  fullName: z.string().min(2, { message: "Le nom est trop court" }),
  email: z.string().email({ message: "Email invalide" }),
  phone: z.string().refine(isValidTunisianPhone, { message: "Numéro de téléphone invalide" }),
  password: z.string().min(6, { message: "Mot de passe trop court" }),
  confirmPassword: z.string().min(6),
  businessName: z.string().min(2, { message: "Nom de l'entreprise requis" }),
  businessTaxId: z.string().min(5, { message: "Matricule fiscal requis" }),
  businessAddress: z.string().min(10, { message: "Adresse trop courte" }),
  businessPhone: z.string().refine(isValidTunisianPhone, { message: "Numéro de téléphone invalide" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ['confirmPassword'],
});

type WholesaleFormData = z.infer<typeof wholesaleSchema>;

// ============================================================================
// TRANSLATIONS
// ============================================================================

const t = {
  title: { ar: 'تسجيل حساب تاجر', fr: 'Inscription Grossiste' },
  subtitle: { ar: 'احصل على أسعار الجملة الحصرية', fr: 'Accédez aux prix de gros exclusifs' },
  
  step1: { ar: 'المعلومات الشخصية', fr: 'Informations personnelles' },
  step2: { ar: 'معلومات الشركة', fr: 'Informations entreprise' },
  
  fullName: { ar: 'الاسم الكامل', fr: 'Nom complet' },
  email: { ar: 'البريد الإلكتروني', fr: 'Email' },
  phone: { ar: 'رقم الهاتف الشخصي', fr: 'Téléphone personnel' },
  password: { ar: 'كلمة المرور', fr: 'Mot de passe' },
  confirmPassword: { ar: 'تأكيد كلمة المرور', fr: 'Confirmer le mot de passe' },
  
  businessName: { ar: 'اسم الشركة', fr: 'Nom de l\'entreprise' },
  businessTaxId: { ar: 'المعرف الجبائي', fr: 'Matricule fiscal' },
  businessAddress: { ar: 'عنوان الشركة', fr: 'Adresse de l\'entreprise' },
  businessPhone: { ar: 'هاتف الشركة', fr: 'Téléphone entreprise' },
  businessLicense: { ar: 'رخصة التجارة (يمكن إضافة عدة ملفات)', fr: 'Patente / Documents (plusieurs fichiers possibles)' },
  
  uploadFile: { ar: 'اختر ملف', fr: 'Choisir un fichier' },
  noFileSelected: { ar: 'لم يتم اختيار ملف', fr: 'Aucun fichier sélectionné' },
  maxFileSize: { ar: 'الحجم الأقصى: 5 ميجا', fr: 'Taille max: 5 Mo' },
  acceptedFormats: { ar: 'PDF، JPG، PNG', fr: 'PDF, JPG, PNG' },
  
  next: { ar: 'التالي', fr: 'Suivant' },
  back: { ar: 'رجوع', fr: 'Retour' },
  submit: { ar: 'إرسال الطلب', fr: 'Soumettre la demande' },
  submitting: { ar: 'جاري الإرسال...', fr: 'Envoi en cours...' },
  
  hasAccount: { ar: 'لديك حساب بالفعل؟', fr: 'Vous avez déjà un compte ?' },
  signIn: { ar: 'تسجيل الدخول', fr: 'Se connecter' },
  retailAccount: { ar: 'تريد حساب عادي؟', fr: 'Vous voulez un compte normal ?' },
  registerRetail: { ar: 'سجل هنا', fr: 'Inscrivez-vous ici' },
  
  success: {
    title: { ar: 'تم إرسال طلبك بنجاح!', fr: 'Demande envoyée avec succès !' },
    message: { ar: 'سنراجع طلبك خلال 24-48 ساعة. ستتلقى بريداً إلكترونياً عند الموافقة.', fr: 'Nous examinerons votre demande dans 24-48h. Vous recevrez un email après approbation.' },
    pending: { ar: 'حالة الطلب: قيد المراجعة', fr: 'Statut: En cours d\'examen' },
  },
  
  errors: {
    nameTooShort: { ar: 'الاسم قصير جداً', fr: 'Nom trop court' },
    invalidEmail: { ar: 'بريد إلكتروني غير صالح', fr: 'Email invalide' },
    invalidPhone: { ar: 'رقم هاتف غير صالح', fr: 'Téléphone invalide' },
    passwordTooShort: { ar: 'كلمة المرور قصيرة جداً', fr: 'Mot de passe trop court' },
    passwordsNotMatch: { ar: 'كلمات المرور غير متطابقة', fr: 'Mots de passe différents' },
    businessNameRequired: { ar: 'اسم الشركة مطلوب', fr: 'Nom d\'entreprise requis' },
    taxIdRequired: { ar: 'المعرف الجبائي مطلوب', fr: 'Matricule fiscal requis' },
    addressTooShort: { ar: 'العنوان قصير جداً', fr: 'Adresse trop courte' },
    fileTooLarge: { ar: 'الملف كبير جداً (الحد الأقصى 5 ميجا)', fr: 'Fichier trop volumineux (max 5 Mo)' },
    invalidFileType: { ar: 'نوع ملف غير مدعوم', fr: 'Type de fichier non supporté' },
    emailExists: { ar: 'هذا البريد الإلكتروني مسجل مسبقاً', fr: 'Cet email est déjà utilisé' },
    networkError: { ar: 'خطأ في الشبكة، حاول مجدداً', fr: 'Erreur réseau, réessayez' },
  },
  
  whyWholesale: { ar: 'لماذا حساب تاجر؟', fr: 'Pourquoi un compte grossiste ?' },
  benefits: {
    prices: { ar: 'أسعار جملة حصرية تصل إلى 40% أقل', fr: 'Prix de gros exclusifs jusqu\'à 40% moins cher' },
    priority: { ar: 'أولوية في التوصيل والدعم', fr: 'Priorité de livraison et support' },
    credit: { ar: 'إمكانية الدفع الآجل بعد الموافقة', fr: 'Possibilité de paiement différé après approbation' },
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function WholesaleRegisterPage() {
  const { language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [serverError, setServerError] = useState<string | null>(null);
  const [customErrors, setCustomErrors] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const form = useForm<WholesaleFormData>({
    resolver: zodResolver(wholesaleSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      businessName: '',
      businessTaxId: '',
      businessAddress: '',
      businessPhone: '',
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  // Handle file selection (multiple allowed)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    let hasError = false;

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        setServerError(t.errors.fileTooLarge[language]);
        hasError = true;
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        setServerError(t.errors.invalidFileType[language]);
        hasError = true;
        return false;
      }
      return true;
    });

    if (!hasError) {
      setServerError(null);
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Next step validation
  const handleNextStep = async () => {
    const isValid = await form.trigger(['fullName', 'email', 'phone', 'password', 'confirmPassword']);
    if (isValid) setStep(2);
  };

  // Form submission with your requested logic
  const onSubmit = async (data: WholesaleFormData) => {
    setServerError(null);
    setCustomErrors({});

    // 1. Custom wholesale validation
    const validation = validateWholesaleAccount({
      businessName: data.businessName,
      businessTaxId: data.businessTaxId,
      businessDocuments: selectedFiles,
    });

    if (!validation.isValid) {
      setCustomErrors(validation.errors);
      toast.error(
        language === 'ar'
          ? 'يرجى تصحيح الأخطاء في بيانات الشركة'
          : 'Veuillez corriger les erreurs dans les informations de l’entreprise'
      );
      return;
    }

    try {
      // 2. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned after sign up');

      const userId = authData.user.id;

      // 3. Upload documents
      const documentUrls: string[] = [];

      for (const file of selectedFiles) {
        const fileName = `${userId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('business-licenses')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        if (uploadData?.path) {
          documentUrls.push(uploadData.path);
        }
      }

      // 4. Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: data.email,
          full_name: data.fullName,
          phone: data.phone,
          role: 'wholesale',
          wholesale_status: 'pending',
          wholesale_applied_at: new Date().toISOString(),
          business_name: data.businessName,
          business_tax_id: data.businessTaxId.toUpperCase(),
          business_address: data.businessAddress,
          business_phone: data.businessPhone,
          business_documents: documentUrls,
        });

      if (profileError) throw profileError;

      // Success
      toast.success(
        language === 'ar'
          ? 'تم إرسال طلبك بنجاح. سنراجعه قريباً.'
          : 'Demande envoyée avec succès. Nous l\'examinerons bientôt.'
      );

      navigate('/login?wholesale=pending');

    } catch (err: any) {
      console.error('Wholesale registration error:', err);
      const message = err.message?.includes('duplicate key')
        ? t.errors.emailExists[language]
        : (language === 'ar' ? 'حدث خطأ. حاول مرة أخرى.' : 'Une erreur s\'est produite. Réessayez.');

      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <div className={cn(
      'min-h-screen py-12 px-4 sm:px-6 lg:px-8',
      'bg-gradient-to-br from-slate-50 via-white to-red-50',
      isRTL ? 'font-[Cairo]' : 'font-[Inter]'
    )}>
      <div className="max-w-2xl mx-auto">
        {/* Logo & Title */}
        <div className="text-center mb-8">
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

        {/* Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className={cn(
              'flex items-center gap-2',
              step >= 1 ? 'text-red-600' : 'text-slate-400'
            )}>
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                step >= 1 ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-500'
              )}>
                1
              </div>
              <span className="hidden sm:inline text-sm font-medium">{t.step1[language]}</span>
            </div>
            <div className={cn('w-12 h-0.5', step >= 2 ? 'bg-red-600' : 'bg-slate-200')}></div>
            <div className={cn(
              'flex items-center gap-2',
              step >= 2 ? 'text-red-600' : 'text-slate-400'
            )}>
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                step >= 2 ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-500'
              )}>
                2
              </div>
              <span className="hidden sm:inline text-sm font-medium">{t.step2[language]}</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8">
            {serverError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{serverError}</p>
              </div>
            )}

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {step === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t.fullName[language]}
                    </label>
                    <input
                      type="text"
                      {...form.register('fullName')}
                      className={cn(
                        'w-full px-4 py-3 rounded-lg border border-slate-300',
                        'focus:ring-2 focus:ring-red-500 focus:border-red-500',
                        form.formState.errors.fullName && 'border-red-500'
                      )}
                    />
                    {form.formState.errors.fullName && (
                      <p className="mt-1 text-sm text-red-600">
                        {form.formState.errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t.email[language]}
                    </label>
                    <input
                      type="email"
                      {...form.register('email')}
                      className={cn(
                        'w-full px-4 py-3 rounded-lg border border-slate-300',
                        'focus:ring-2 focus:ring-red-500 focus:border-red-500',
                        form.formState.errors.email && 'border-red-500'
                      )}
                    />
                    {form.formState.errors.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t.phone[language]}
                    </label>
                    <input
                      type="tel"
                      dir="ltr"
                      {...form.register('phone')}
                      className={cn(
                        'w-full px-4 py-3 rounded-lg border border-slate-300 text-left',
                        'focus:ring-2 focus:ring-red-500 focus:border-red-500',
                        form.formState.errors.phone && 'border-red-500'
                      )}
                      placeholder="+216 XX XXX XXX"
                    />
                    {form.formState.errors.phone && (
                      <p className="mt-1 text-sm text-red-600">
                        {form.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t.password[language]}
                      </label>
                      <input
                        type="password"
                        {...form.register('password')}
                        className={cn(
                          'w-full px-4 py-3 rounded-lg border border-slate-300',
                          'focus:ring-2 focus:ring-red-500 focus:border-red-500',
                          form.formState.errors.password && 'border-red-500'
                        )}
                      />
                      {form.formState.errors.password && (
                        <p className="mt-1 text-sm text-red-600">
                          {form.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t.confirmPassword[language]}
                      </label>
                      <input
                        type="password"
                        {...form.register('confirmPassword')}
                        className={cn(
                          'w-full px-4 py-3 rounded-lg border border-slate-300',
                          'focus:ring-2 focus:ring-red-500 focus:border-red-500',
                          form.formState.errors.confirmPassword && 'border-red-500'
                        )}
                      />
                      {form.formState.errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">
                          {form.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleNextStep}
                    fullWidth
                    size="lg"
                    rightIcon={
                      <svg className={cn('w-5 h-5', isRTL && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    }
                  >
                    {t.next[language]}
                  </Button>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t.businessName[language]}
                    </label>
                    <input
                      type="text"
                      {...form.register('businessName')}
                      className={cn(
                        'w-full px-4 py-3 rounded-lg border border-slate-300',
                        'focus:ring-2 focus:ring-red-500 focus:border-red-500',
                        (form.formState.errors.businessName || customErrors.businessName) && 'border-red-500'
                      )}
                    />
                    {(form.formState.errors.businessName || customErrors.businessName) && (
                      <p className="mt-1 text-sm text-red-600">
                        {form.formState.errors.businessName?.message || customErrors.businessName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t.businessTaxId[language]}
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      {...form.register('businessTaxId')}
                      className={cn(
                        'w-full px-4 py-3 rounded-lg border border-slate-300 text-left',
                        'focus:ring-2 focus:ring-red-500 focus:border-red-500',
                        (form.formState.errors.businessTaxId || customErrors.businessTaxId) && 'border-red-500'
                      )}
                      placeholder="XXXXXXX/X/X/X/XXX"
                    />
                    {(form.formState.errors.businessTaxId || customErrors.businessTaxId) && (
                      <p className="mt-1 text-sm text-red-600">
                        {form.formState.errors.businessTaxId?.message || customErrors.businessTaxId}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t.businessAddress[language]}
                    </label>
                    <textarea
                      {...form.register('businessAddress')}
                      rows={3}
                      className={cn(
                        'w-full px-4 py-3 rounded-lg border border-slate-300',
                        'focus:ring-2 focus:ring-red-500 focus:border-red-500',
                        form.formState.errors.businessAddress && 'border-red-500'
                      )}
                    />
                    {form.formState.errors.businessAddress && (
                      <p className="mt-1 text-sm text-red-600">
                        {form.formState.errors.businessAddress.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t.businessPhone[language]}
                    </label>
                    <input
                      type="tel"
                      dir="ltr"
                      {...form.register('businessPhone')}
                      className={cn(
                        'w-full px-4 py-3 rounded-lg border border-slate-300 text-left',
                        'focus:ring-2 focus:ring-red-500 focus:border-red-500',
                        form.formState.errors.businessPhone && 'border-red-500'
                      )}
                      placeholder="+216 XX XXX XXX"
                    />
                    {form.formState.errors.businessPhone && (
                      <p className="mt-1 text-sm text-red-600">
                        {form.formState.errors.businessPhone.message}
                      </p>
                    )}
                  </div>

                  {/* File Upload - Multiple */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t.businessLicense[language]}
                    </label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-red-400 transition-colors">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png"
                        multiple
                        className="hidden"
                      />

                      {selectedFiles.length > 0 ? (
                        <div className="space-y-3">
                          {selectedFiles.map((file, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between bg-slate-50 p-3 rounded-lg"
                            >
                              <div className="flex items-center gap-3 truncate">
                                <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="truncate">
                                  <p className="font-medium truncate">{file.name}</p>
                                  <p className="text-xs text-slate-500">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(idx)}
                                className="text-red-600 hover:text-red-800 flex-shrink-0"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-4"
                          >
                            {language === 'ar' ? 'إضافة ملف آخر' : 'Ajouter un autre fichier'}
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <svg className="w-12 h-12 mx-auto text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            {t.uploadFile[language]}
                          </Button>
                          <p className="mt-3 text-sm text-slate-500">
                            {t.acceptedFormats[language]} • {t.maxFileSize[language]}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      leftIcon={
                        <svg className={cn('w-5 h-5', isRTL && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                        </svg>
                      }
                    >
                      {t.back[language]}
                    </Button>

                    <Button
                      type="submit"
                      fullWidth
                      size="lg"
                      disabled={isSubmitting}
                      isLoading={isSubmitting}
                    >
                      {isSubmitting ? t.submitting[language] : t.submit[language]}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block">
            <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 text-white sticky top-8">
              <h3 className="font-bold text-lg mb-4">
                {t.whyWholesale[language]}
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-red-100">{t.benefits.prices[language]}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-red-100">{t.benefits.priority[language]}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-red-100">{t.benefits.credit[language]}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer links */}
        <div className="text-center mt-10 space-y-3">
          <p className="text-slate-600">
            {t.hasAccount[language]}{' '}
            <Link to="/login" className="font-semibold text-red-600 hover:text-red-700">
              {t.signIn[language]}
            </Link>
          </p>
          <p className="text-slate-500 text-sm">
            {t.retailAccount[language]}{' '}
            <Link to="/register" className="font-semibold text-red-600 hover:text-red-700">
              {t.registerRetail[language]}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}