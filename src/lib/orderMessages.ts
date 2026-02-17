/**
 * Order Status Messages
 * Ghalinino - Tunisia E-commerce
 */

import type { OrderStatus, PaymentStatus } from '@/types/database';
import type { Language } from '@/types';

interface StatusMessage {
  label: { ar: string; fr: string };
  description: { ar: string; fr: string };
  color: 'yellow' | 'blue' | 'purple' | 'green' | 'red' | 'slate';
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusMessage> = {
  pending: {
    label: { ar: 'قيد الانتظار', fr: 'En attente' },
    description: { 
      ar: 'تم استلام طلبك. في انتظار تأكيد الدفع.', 
      fr: 'Commande reçue. En attente de confirmation de paiement.' 
    },
    color: 'yellow',
  },
  paid: {
    label: { ar: 'تم الدفع', fr: 'Payé' },
    description: { 
      ar: 'تم تأكيد الدفع! نحن نجهز طلبك.', 
      fr: 'Paiement confirmé ! Nous préparons votre commande.' 
    },
    color: 'green', // Or blue, depending on preference
  },
  processing: {
    label: { ar: 'قيد التجهيز', fr: 'En préparation' },
    description: { 
      ar: 'يتم تغليف طلبك وسيشحن قريباً.', 
      fr: 'Votre commande est en cours d\'emballage et sera expédiée bientôt.' 
    },
    color: 'blue',
  },
  shipped: {
    label: { ar: 'تم الشحن', fr: 'Expédié' },
    description: { 
      ar: 'طلبك في الطريق إليك!', 
      fr: 'Votre commande est en route !' 
    },
    color: 'purple',
  },
  delivered: {
    label: { ar: 'تم التوصيل', fr: 'Livré' },
    description: { 
      ar: 'تم توصيل الطلب. شكراً لتسوقك معنا!', 
      fr: 'Commande livrée. Merci de votre achat !' 
    },
    color: 'green',
  },
  cancelled: {
    label: { ar: 'ملغي', fr: 'Annulé' },
    description: { 
      ar: 'تم إلغاء هذا الطلب.', 
      fr: 'Cette commande a été annulée.' 
    },
    color: 'red',
  },
  refunded: {
    label: { ar: 'تم الاسترجاع', fr: 'Remboursé' },
    description: { 
      ar: 'تم استرجاع مبلغ الطلب.', 
      fr: 'Le montant de la commande a été remboursé.' 
    },
    color: 'slate',
  },
};

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: { ar: string; fr: string }; color: string }> = {
  pending: {
    label: { ar: 'غير مدفوع', fr: 'Non payé' },
    color: 'yellow',
  },
  paid: {
    label: { ar: 'مدفوع', fr: 'Payé' },
    color: 'green',
  },
  failed: {
    label: { ar: 'فشل الدفع', fr: 'Échec' },
    color: 'red',
  },
  refunded: {
    label: { ar: 'مسترجع', fr: 'Remboursé' },
    color: 'slate',
  },
};

export function getOrderStatusInfo(status: OrderStatus, language: Language) {
  const config = ORDER_STATUS_CONFIG[status];
  return {
    label: config.label[language],
    description: config.description[language],
    color: config.color,
  };
}

export function getPaymentStatusInfo(status: PaymentStatus, language: Language) {
  const config = PAYMENT_STATUS_CONFIG[status];
  return {
    label: config.label[language],
    color: config.color,
  };
}
