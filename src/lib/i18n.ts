/**
 * Internationalization (i18n) Configuration
 * Arabic/French bilingual support for Tunisia
 */

import type { Language, Translation } from '@/types';
import { getStorageItem, setStorageItem } from './utils';

// ============================================
// TRANSLATION STRINGS
// ============================================

export const translations = {
  // Common
  common: {
    loading: { ar: 'جاري التحميل...', fr: 'Chargement...' },
    error: { ar: 'حدث خطأ', fr: 'Une erreur est survenue' },
    retry: { ar: 'إعادة المحاولة', fr: 'Réessayer' },
    save: { ar: 'حفظ', fr: 'Enregistrer' },
    cancel: { ar: 'إلغاء', fr: 'Annuler' },
    delete: { ar: 'حذف', fr: 'Supprimer' },
    edit: { ar: 'تعديل', fr: 'Modifier' },
    confirm: { ar: 'تأكيد', fr: 'Confirmer' },
    back: { ar: 'رجوع', fr: 'Retour' },
    next: { ar: 'التالي', fr: 'Suivant' },
    search: { ar: 'بحث', fr: 'Rechercher' },
    filter: { ar: 'تصفية', fr: 'Filtrer' },
    sort: { ar: 'ترتيب', fr: 'Trier' },
    clear: { ar: 'مسح', fr: 'Effacer' },
    all: { ar: 'الكل', fr: 'Tout' },
    none: { ar: 'لا شيء', fr: 'Aucun' },
    yes: { ar: 'نعم', fr: 'Oui' },
    no: { ar: 'لا', fr: 'Non' },
    or: { ar: 'أو', fr: 'ou' },
    and: { ar: 'و', fr: 'et' },
  },
  
  // Navigation
  nav: {
    home: { ar: 'الرئيسية', fr: 'Accueil' },
    products: { ar: 'المنتجات', fr: 'Produits' },
    categories: { ar: 'الفئات', fr: 'Catégories' },
    cart: { ar: 'السلة', fr: 'Panier' },
    account: { ar: 'حسابي', fr: 'Mon compte' },
    orders: { ar: 'طلباتي', fr: 'Mes commandes' },
    wishlist: { ar: 'المفضلة', fr: 'Favoris' },
    login: { ar: 'تسجيل الدخول', fr: 'Connexion' },
    register: { ar: 'إنشاء حساب', fr: 'Inscription' },
    logout: { ar: 'تسجيل الخروج', fr: 'Déconnexion' },
  },
  
  // Products
  products: {
    addToCart: { ar: 'أضف إلى السلة', fr: 'Ajouter au panier' },
    addedToCart: { ar: 'تمت الإضافة', fr: 'Ajouté' },
    outOfStock: { ar: 'نفذ المخزون', fr: 'Rupture de stock' },
    inStock: { ar: 'متوفر', fr: 'En stock' },
    lowStock: { ar: 'كمية محدودة', fr: 'Stock limité' },
    price: { ar: 'السعر', fr: 'Prix' },
    quantity: { ar: 'الكمية', fr: 'Quantité' },
    description: { ar: 'الوصف', fr: 'Description' },
    specifications: { ar: 'المواصفات', fr: 'Spécifications' },
    reviews: { ar: 'التقييمات', fr: 'Avis' },
    relatedProducts: { ar: 'منتجات مشابهة', fr: 'Produits similaires' },
    featured: { ar: 'منتجات مميزة', fr: 'Produits vedettes' },
    newArrivals: { ar: 'وصل حديثاً', fr: 'Nouveautés' },
    bestSellers: { ar: 'الأكثر مبيعاً', fr: 'Meilleures ventes' },
    onSale: { ar: 'تخفيضات', fr: 'Promotions' },
    discount: { ar: 'تخفيض', fr: 'Réduction' },
    noProducts: { ar: 'لا توجد منتجات', fr: 'Aucun produit' },
  },
  
  // Cart
  cart: {
    title: { ar: 'سلة التسوق', fr: 'Panier' },
    empty: { ar: 'سلتك فارغة', fr: 'Votre panier est vide' },
    continueShopping: { ar: 'متابعة التسوق', fr: 'Continuer vos achats' },
    subtotal: { ar: 'المجموع الفرعي', fr: 'Sous-total' },
    shipping: { ar: 'التوصيل', fr: 'Livraison' },
    total: { ar: 'المجموع', fr: 'Total' },
    checkout: { ar: 'إتمام الطلب', fr: 'Commander' },
    remove: { ar: 'إزالة', fr: 'Retirer' },
    update: { ar: 'تحديث', fr: 'Mettre à jour' },
    freeShipping: { ar: 'توصيل مجاني', fr: 'Livraison gratuite' },
    shippingCalculated: { ar: 'يحسب عند الدفع', fr: 'Calculé à la caisse' },
  },
  
  // Checkout
  checkout: {
    title: { ar: 'إتمام الطلب', fr: 'Finaliser la commande' },
    contactInfo: { ar: 'معلومات الاتصال', fr: 'Informations de contact' },
    shippingAddress: { ar: 'عنوان التوصيل', fr: 'Adresse de livraison' },
    paymentMethod: { ar: 'طريقة الدفع', fr: 'Mode de paiement' },
    orderSummary: { ar: 'ملخص الطلب', fr: 'Récapitulatif' },
    placeOrder: { ar: 'تأكيد الطلب', fr: 'Confirmer la commande' },
    orderPlaced: { ar: 'تم تأكيد طلبك', fr: 'Commande confirmée' },
    orderNumber: { ar: 'رقم الطلب', fr: 'Numéro de commande' },
    
    // Form fields
    email: { ar: 'البريد الإلكتروني', fr: 'Email' },
    phone: { ar: 'رقم الهاتف', fr: 'Téléphone' },
    fullName: { ar: 'الاسم الكامل', fr: 'Nom complet' },
    address: { ar: 'العنوان', fr: 'Adresse' },
    addressLine1: { ar: 'العنوان (السطر 1)', fr: 'Adresse (ligne 1)' },
    addressLine2: { ar: 'العنوان (السطر 2)', fr: 'Adresse (ligne 2)' },
    city: { ar: 'المدينة', fr: 'Ville' },
    governorate: { ar: 'الولاية', fr: 'Gouvernorat' },
    postalCode: { ar: 'الرمز البريدي', fr: 'Code postal' },
    notes: { ar: 'ملاحظات', fr: 'Notes' },
    
    // Payment methods
    cod: { ar: 'الدفع عند الاستلام', fr: 'Paiement à la livraison' },
    codDesc: { ar: 'ادفع نقداً عند استلام طلبك', fr: 'Payez en espèces à la réception' },
    bankTransfer: { ar: 'التحويل البنكي', fr: 'Virement bancaire' },
    bankTransferDesc: { ar: 'حول المبلغ إلى حسابنا البنكي', fr: 'Transférez le montant sur notre compte' },
    flouci: { ar: 'فلوسي', fr: 'Flouci' },
    flouciDesc: { ar: 'ادفع بسهولة عبر فلوسي', fr: 'Payez facilement via Flouci' },
  },
  
  // Account
  account: {
    title: { ar: 'حسابي', fr: 'Mon compte' },
    profile: { ar: 'الملف الشخصي', fr: 'Profil' },
    addresses: { ar: 'العناوين', fr: 'Adresses' },
    orders: { ar: 'الطلبات', fr: 'Commandes' },
    settings: { ar: 'الإعدادات', fr: 'Paramètres' },
    language: { ar: 'اللغة', fr: 'Langue' },
  },
  
  // Auth
  auth: {
    loginTitle: { ar: 'تسجيل الدخول', fr: 'Connexion' },
    registerTitle: { ar: 'إنشاء حساب جديد', fr: 'Créer un compte' },
    email: { ar: 'البريد الإلكتروني', fr: 'Email' },
    password: { ar: 'كلمة المرور', fr: 'Mot de passe' },
    confirmPassword: { ar: 'تأكيد كلمة المرور', fr: 'Confirmer le mot de passe' },
    forgotPassword: { ar: 'نسيت كلمة المرور؟', fr: 'Mot de passe oublié ?' },
    resetPassword: { ar: 'إعادة تعيين كلمة المرور', fr: 'Réinitialiser le mot de passe' },
    noAccount: { ar: 'ليس لديك حساب؟', fr: "Vous n'avez pas de compte ?" },
    hasAccount: { ar: 'لديك حساب بالفعل؟', fr: 'Vous avez déjà un compte ?' },
    loginWithMagicLink: { ar: 'تسجيل الدخول برابط سحري', fr: 'Connexion par lien magique' },
    checkEmail: { ar: 'تحقق من بريدك الإلكتروني', fr: 'Vérifiez votre email' },
    loginSuccess: { ar: 'تم تسجيل الدخول بنجاح', fr: 'Connexion réussie' },
    logoutSuccess: { ar: 'تم تسجيل الخروج', fr: 'Déconnexion réussie' },
    guestCheckout: { ar: 'المتابعة كضيف', fr: 'Continuer en tant qu\'invité' },
  },
  
  // Order status
  orderStatus: {
    pending: { ar: 'قيد الانتظار', fr: 'En attente' },
    confirmed: { ar: 'مؤكد', fr: 'Confirmé' },
    processing: { ar: 'قيد التحضير', fr: 'En préparation' },
    shipped: { ar: 'تم الشحن', fr: 'Expédié' },
    delivered: { ar: 'تم التوصيل', fr: 'Livré' },
    cancelled: { ar: 'ملغي', fr: 'Annulé' },
    refunded: { ar: 'تم الاسترجاع', fr: 'Remboursé' },
  },
  
  // Validation messages
  validation: {
    required: { ar: 'هذا الحقل مطلوب', fr: 'Ce champ est requis' },
    invalidEmail: { ar: 'البريد الإلكتروني غير صالح', fr: 'Email invalide' },
    invalidPhone: { ar: 'رقم الهاتف غير صالح', fr: 'Numéro de téléphone invalide' },
    passwordTooShort: { ar: 'كلمة المرور قصيرة جداً', fr: 'Mot de passe trop court' },
    passwordsNotMatch: { ar: 'كلمات المرور غير متطابقة', fr: 'Les mots de passe ne correspondent pas' },
  },
  
  // Footer
  footer: {
    aboutUs: { ar: 'من نحن', fr: 'À propos' },
    contactUs: { ar: 'اتصل بنا', fr: 'Contactez-nous' },
    faq: { ar: 'الأسئلة الشائعة', fr: 'FAQ' },
    termsOfService: { ar: 'شروط الخدمة', fr: 'Conditions d\'utilisation' },
    privacyPolicy: { ar: 'سياسة الخصوصية', fr: 'Politique de confidentialité' },
    returnPolicy: { ar: 'سياسة الإرجاع', fr: 'Politique de retour' },
    shippingInfo: { ar: 'معلومات الشحن', fr: 'Informations de livraison' },
    followUs: { ar: 'تابعنا', fr: 'Suivez-nous' },
    newsletter: { ar: 'النشرة الإخبارية', fr: 'Newsletter' },
    subscribeNewsletter: { ar: 'اشترك في نشرتنا', fr: 'Abonnez-vous' },
    allRightsReserved: { ar: 'جميع الحقوق محفوظة', fr: 'Tous droits réservés' },
  },
  
  // Trust badges
  trust: {
    freeShipping: { ar: 'توصيل مجاني فوق 100 دينار', fr: 'Livraison gratuite dès 100 TND' },
    securePayment: { ar: 'دفع آمن', fr: 'Paiement sécurisé' },
    cod: { ar: 'الدفع عند الاستلام', fr: 'Paiement à la livraison' },
    support247: { ar: 'دعم على مدار الساعة', fr: 'Support 24/7' },
    fastDelivery: { ar: 'توصيل سريع', fr: 'Livraison rapide' },
    moneyBack: { ar: 'ضمان استرجاع المال', fr: 'Garantie de remboursement' },
  },
} as const;

// ============================================
// LANGUAGE UTILITIES
// ============================================

const LANGUAGE_KEY = 'language';

/**
 * Get current language from storage
 */
export function getCurrentLanguage(): Language {
  return getStorageItem<Language>(LANGUAGE_KEY, 'ar');
}

/**
 * Set language and persist to storage
 */
export function setLanguage(language: Language): void {
  setStorageItem(LANGUAGE_KEY, language);
  
  // Update document direction and lang attribute
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = language;
}

/**
 * Initialize language on app load
 */
export function initializeLanguage(): Language {
  const language = getCurrentLanguage();
  setLanguage(language);
  return language;
}

/**
 * Type-safe translation getter
 */
type TranslationSection = keyof typeof translations;
type TranslationKey<S extends TranslationSection> = keyof (typeof translations)[S];

export function useTranslation<S extends TranslationSection>(section: S) {
  return function getTranslation(key: TranslationKey<S>, language: Language): string {
    const translation = translations[section][key] as Translation;
    return translation[language];
  };
}
