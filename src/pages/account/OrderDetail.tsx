/**
 * Order Detail Page
 * Full details with real-time tracking
 */

import { useParams, Link } from 'react-router-dom';
import { useOrderDetail } from '@/hooks/useOrderDetail';
import { useLanguage } from '@/hooks';
import { OrderTimeline } from '@/components/account/OrderTimeline';
import { OrderStatusBadge } from '@/components/common/OrderStatusBadge';
import { PaymentProofModal } from '@/components/account/PaymentProofModal';
import { Button } from '@/components/common';
import { formatPrice } from '@/lib/utils';
import { useState } from 'react';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { order, isLoading, error } = useOrderDetail(id);
  const { language } = useLanguage();
  const [showProofModal, setShowProofModal] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || (language === 'ar' ? 'الطلب غير موجود' : 'Commande introuvable')}</p>
        <Link to="/account/orders">
          <Button variant="outline">
            {language === 'ar' ? 'العودة للطلبات' : 'Retour aux commandes'}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/account/orders" className="hover:text-red-600">
              {language === 'ar' ? 'طلباتي' : 'Mes Commandes'}
            </Link>
            <span>/</span>
            <span>{order.order_number}</span>
          </div>
          <h1 className="text-2xl font-bold font-mono">{order.order_number}</h1>
        </div>
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status} size="md" />
          <OrderStatusBadge status={order.payment_status} type="payment" size="md" />
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white border rounded-xl p-6 mb-8 shadow-sm">
        <OrderTimeline currentStatus={order.status} />
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">
          {/* Items */}
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h2 className="font-bold mb-4">
              {language === 'ar' ? 'المنتجات' : 'Articles'}
            </h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 py-4 border-b last:border-0">
                  {/* Image */}
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product_snapshot?.image && (
                      <img 
                        src={item.product_snapshot.image} 
                        alt={language === 'ar' ? item.product_snapshot.name_ar : item.product_snapshot.name_fr}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-medium text-sm md:text-base">
                      {language === 'ar' ? item.product_snapshot.name_ar : item.product_snapshot.name_fr}
                    </h3>
                    <div className="flex justify-between mt-1">
                      <p className="text-sm text-gray-500">
                        {item.quantity} x {formatPrice(item.unit_price * 1000, language)}
                      </p>
                      <p className="font-medium">
                        {formatPrice(item.total_price * 1000, language)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h2 className="font-bold mb-4">
              {language === 'ar' ? 'معلومات الدفع' : 'Paiement'}
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{language === 'ar' ? 'طريقة الدفع' : 'Méthode'}</span>
                <span className="font-medium capitalize">{order.payment_method.replace('_', ' ')}</span>
              </div>
              
              {order.payment_method === 'bank_transfer' && order.bank_transfer_proof_url && (
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-500">{language === 'ar' ? 'وصل التحويل' : 'Preuve de virement'}</span>
                  <Button size="sm" variant="outline" onClick={() => setShowProofModal(true)}>
                    {language === 'ar' ? 'عرض الوصل' : 'Voir la preuve'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Shipping Address */}
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h2 className="font-bold mb-4">
              {language === 'ar' ? 'عنوان التوصيل' : 'Livraison'}
            </h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium text-gray-900">{order.shipping_address.full_name}</p>
              <p>{order.shipping_address.address_line_1}</p>
              <p>{order.shipping_address.city}, {order.shipping_address.governorate}</p>
              <p>{order.shipping_address.phone}</p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h2 className="font-bold mb-4">
              {language === 'ar' ? 'ملخص الطلب' : 'Résumé'}
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{language === 'ar' ? 'المجموع الفرعي' : 'Sous-total'}</span>
                <span>{formatPrice(order.subtotal * 1000, language)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{language === 'ar' ? 'الشحن' : 'Livraison'}</span>
                <span>{formatPrice(order.shipping_cost * 1000, language)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t font-bold text-lg">
                <span>{language === 'ar' ? 'المجموع' : 'Total'}</span>
                <span className="text-red-600">{formatPrice(order.total * 1000, language)}</span>
              </div>
            </div>
          </div>
          
          <Button fullWidth variant="outline" onClick={() => window.location.href = `mailto:support@ghalinino.com`}>
            {language === 'ar' ? 'تواصل مع الدعم' : 'Contacter le support'}
          </Button>
        </div>
      </div>

      {order.bank_transfer_proof_url && (
        <PaymentProofModal 
          isOpen={showProofModal} 
          onClose={() => setShowProofModal(false)} 
          proofPath={order.bank_transfer_proof_url} 
        />
      )}
    </div>
  );
}
