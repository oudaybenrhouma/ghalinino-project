import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAdminOrders } from '@/hooks/useAdminOrders';
import { Button } from '@/components/common';
import { OrderStatusBadge } from '@/components/common/OrderStatusBadge';
import { PaymentProofModal } from '@/components/account/PaymentProofModal';
import { formatPrice } from '@/lib/utils';
import type { OrderWithDetails } from '@/types/database';

export function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { updateOrderStatus, updatePaymentStatus } = useAdminOrders();
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showProofModal, setShowProofModal] = useState(false);
  const [internalNote, setInternalNote] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('id', id)
        .single();
      
      if (!error && data) {
        setOrder(data as any); // Cast for simplicity due to complex join
        setInternalNote(data.internal_notes || '');
      }
      setIsLoading(false);
    };
    fetchOrder();
  }, [id]);

  const handleSaveNote = async () => {
    if (!order) return;
    await supabase.from('orders').update({ internal_notes: internalNote } as any).eq('id', order.id);
    alert('Note saved');
  };

  if (isLoading) return <div className="p-8 text-center">Loading order...</div>;
  if (!order) return <div className="p-8 text-center">Order not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/orders" className="p-2 hover:bg-gray-200 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 font-mono">{order.order_number}</h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <div className="flex gap-2">
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <>
              {order.status === 'pending' && (
                <Button size="sm" onClick={() => updateOrderStatus(order.id, 'processing').then(() => window.location.reload())}>
                  Process Order
                </Button>
              )}
              {order.status === 'processing' && (
                <Button size="sm" onClick={() => updateOrderStatus(order.id, 'shipped').then(() => window.location.reload())}>
                  Mark Shipped
                </Button>
              )}
              {order.status === 'shipped' && (
                <Button size="sm" onClick={() => updateOrderStatus(order.id, 'delivered').then(() => window.location.reload())}>
                  Mark Delivered
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4">Items ({order.items.length})</h3>
            <div className="space-y-4">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex gap-4 py-2 border-b border-slate-100 last:border-0">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden">
                    <img src={item.product_snapshot.image} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.product_snapshot.name_fr}</p>
                    <p className="text-xs text-slate-500">SKU: {item.product_snapshot.sku || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(item.total_price * 1000, 'fr')}</p>
                    <p className="text-xs text-slate-500">{item.quantity} x {formatPrice(item.unit_price * 1000, 'fr')}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center font-bold">
              <span>Total</span>
              <span className="text-lg">{formatPrice(order.total * 1000, 'fr')}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900">Payment</h3>
              <OrderStatusBadge status={order.payment_status} type="payment" />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Method</span>
                <span className="font-medium capitalize">{order.payment_method.replace('_', ' ')}</span>
              </div>
              {order.payment_method === 'bank_transfer' && (
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500">Proof of Payment</span>
                  {order.bank_transfer_proof_url ? (
                    <Button size="sm" variant="outline" onClick={() => setShowProofModal(true)}>
                      View Proof
                    </Button>
                  ) : (
                    <span className="text-red-500">Not uploaded</span>
                  )}
                </div>
              )}
              {order.payment_status === 'pending' && (
                <div className="pt-4 flex justify-end">
                  <Button size="sm" onClick={() => updatePaymentStatus(order.id, 'paid').then(() => window.location.reload())}>
                    Mark as Paid manually
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4">Customer</h3>
            <div className="space-y-2 text-sm">
              <p className="font-medium">{order.customer_name}</p>
              {order.user_id ? (
                <Link to={`/admin/customers/${order.user_id}`} className="text-blue-600 hover:underline text-xs">
                  View Profile
                </Link>
              ) : (
                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">Guest</span>
              )}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-slate-500 text-xs uppercase mb-1">Contact</p>
                <p>{order.guest_phone || order.shipping_address.phone}</p>
                <p>{order.guest_email || 'No email'}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-slate-500 text-xs uppercase mb-1">Shipping Address</p>
                <p>{order.shipping_address.address_line_1}</p>
                <p>{order.shipping_address.city}, {order.shipping_address.governorate}</p>
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4">Internal Notes</h3>
            <textarea
              className="w-full border border-slate-300 rounded-lg p-2 text-sm h-32"
              placeholder="Admin notes..."
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
            />
            <Button size="sm" fullWidth className="mt-2" onClick={handleSaveNote}>
              Save Note
            </Button>
          </div>
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
