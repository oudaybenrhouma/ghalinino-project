/**
 * Order History Page
 * List all user's orders with status filtering
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '@/hooks/useOrders';
import { useLanguage } from '@/hooks';
import { OrderStatusBadge } from '@/components/common/OrderStatusBadge';
import { Button } from '@/components/common';
import { formatPrice, cn } from '@/lib/utils';
import type { OrderStatus } from '@/types/database';
import { AccountLayout } from '@/components/layout';

export function OrderHistoryPage() {
  const { orders, isLoading, error } = useOrders();
  const { language } = useLanguage();
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          {language === 'ar' ? 'إعادة المحاولة' : 'Réessayer'}
        </Button>
      </div>
    );
  }

  return (
    <AccountLayout>
    <div className="max-w-4xl mx-auto px-4 py-8">
      
      <h1 className="text-2xl font-bold mb-6">
        {language === 'ar' ? 'طلباتي' : 'Mes Commandes'}
      </h1>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin">
        {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status as any)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              filter === status 
                ? "bg-red-600 text-white" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {status === 'all' 
              ? (language === 'ar' ? 'الكل' : 'Tous')
              : <OrderStatusBadge status={status as OrderStatus} type="order" className="bg-transparent border-0 p-0" />
            }
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">
            {language === 'ar' ? 'لا توجد طلبات' : 'Aucune commande trouvée'}
          </p>
          <Link to="/products">
            <Button>
              {language === 'ar' ? 'تصفح المنتجات' : 'Parcourir les produits'}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono font-bold text-lg">{order.order_number}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString(
                      language === 'ar' ? 'ar-TN' : 'fr-TN',
                      { year: 'numeric', month: 'long', day: 'numeric' }
                    )}
                  </p>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {language === 'ar' ? 'المجموع' : 'Total'}
                    </p>
                    <p className="font-bold text-red-600">
                      {formatPrice(order.total, language)}
                    </p>
                  </div>
                  
                  <Link to={`/account/orders/${order.id}`}>
                    <Button variant="outline" size="sm">
                      {language === 'ar' ? 'التفاصيل' : 'Détails'}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
      </AccountLayout>

  );
}