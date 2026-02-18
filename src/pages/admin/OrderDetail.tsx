import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, ordersWrite } from '@/lib/supabase';
import { Button } from '@/components/common';
import { OrderStatusBadge } from '@/components/common/OrderStatusBadge';
import { PaymentProofModal } from '@/components/account/PaymentProofModal';
import { formatPrice } from '@/lib/utils';
import { useStore } from '@/store';
import { sendOrderShippedEmail, sendOrderCancelledEmail } from '@/lib/emailService';
import type { OrderWithDetails } from '@/types/database';

export function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const addNotification = useStore((s) => s.addNotification);
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [customerPhone, setCustomerPhone] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showProofModal, setShowProofModal] = useState(false);
  const [internalNote, setInternalNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    const { data, error } = await (supabase as any)
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('id', id)
      .single();
    if (!error && data) {
      setOrder(data as OrderWithDetails);
      setInternalNote(data.internal_notes || '');
      // For registered customers, fetch their phone from profile
      if (data.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', data.user_id)
          .single();
        if (profile) setCustomerPhone((profile as any).phone || null);
      }
    }
    setIsLoading(false);
  }, [id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;
    setUpdatingStatus(true);
    try {
      const { error } = await ordersWrite().update({ status: newStatus }).eq('id', order.id);
      if (error) throw error;
      setOrder(prev => prev ? { ...prev, status: newStatus as any } : prev);
      addNotification({ type: 'success', title: `Order marked as ${newStatus}` });
      setShowCancelConfirm(false);

      // Notify customer on key status changes
      const customerEmail = (order as any).profiles?.email ?? (order as any).guest_email ?? null;
      const customerName = (order as any).customer_name ?? 'Client';
      const orderNumber = (order as any).order_number ?? order.id;

      if (newStatus === 'shipped' && customerEmail) {
        void sendOrderShippedEmail({ customerEmail, customerName, orderId: order.id, orderNumber });
      } else if (newStatus === 'cancelled' && customerEmail) {
        void sendOrderCancelledEmail({ customerEmail, customerName, orderId: order.id, orderNumber });
      }
    } catch (e: any) {
      addNotification({ type: 'error', title: 'Failed to update status', message: e.message });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!order) return;
    setUpdatingStatus(true);
    try {
      const { error } = await ordersWrite()
        .update({ payment_status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', order.id);
      if (error) throw error;
      setOrder(prev => prev ? { ...prev, payment_status: 'paid' as any } : prev);
      addNotification({ type: 'success', title: 'Order marked as paid' });
    } catch (e: any) {
      addNotification({ type: 'error', title: 'Failed to update payment', message: e.message });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveNote = async () => {
    if (!order) return;
    setSavingNote(true);
    try {
      const { error } = await ordersWrite().update({ internal_notes: internalNote }).eq('id', order.id);
      if (error) throw error;
      addNotification({ type: 'success', title: 'Note saved' });
    } catch (e: any) {
      addNotification({ type: 'error', title: 'Failed to save note', message: e.message });
    } finally {
      setSavingNote(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading order...</p>
      </div>
    </div>
  );
  if (!order) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-slate-500">Order not found.</p>
    </div>
  );

  const canProgress = order.status !== 'delivered' && order.status !== 'cancelled';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to="/admin/orders" className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-slate-900 font-mono">{order.order_number}</h1>
          <OrderStatusBadge status={order.status} type="order" />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Progress buttons */}
          {canProgress && (
            <>
              {order.status === 'pending' && (
                <Button size="sm" isLoading={updatingStatus} onClick={() => handleStatusUpdate('processing')}>
                  Process Order
                </Button>
              )}
              {order.status === 'processing' && (
                <Button size="sm" isLoading={updatingStatus} onClick={() => handleStatusUpdate('shipped')}>
                  Mark Shipped
                </Button>
              )}
              {order.status === 'shipped' && (
                <Button size="sm" isLoading={updatingStatus} onClick={() => handleStatusUpdate('delivered')}>
                  Mark Delivered
                </Button>
              )}
              {/* Cancel */}
              {!showCancelConfirm ? (
                <Button size="sm" variant="outline" onClick={() => setShowCancelConfirm(true)}>
                  Cancel Order
                </Button>
              ) : (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-red-700 font-medium">Confirm cancel?</span>
                  <button
                    onClick={() => handleStatusUpdate('cancelled')}
                    disabled={updatingStatus}
                    className="px-2 py-1 bg-red-600 text-white text-xs rounded font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="px-2 py-1 bg-slate-200 text-slate-700 text-xs rounded font-medium hover:bg-slate-300"
                  >
                    No
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Items + Payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4">Items ({order.items.length})</h3>
            <div className="space-y-3">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex gap-4 py-3 border-b border-slate-100 last:border-0">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                    {item.product_snapshot?.image && (
                      <img src={item.product_snapshot.image} className="w-full h-full object-cover" alt="" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900 truncate">{item.product_snapshot?.name_fr}</p>
                    <p className="text-xs text-slate-500">SKU: {item.product_snapshot?.sku || 'N/A'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-slate-900">{formatPrice(item.total_price, 'fr')}</p>
                    <p className="text-xs text-slate-500">{item.quantity} × {formatPrice(item.unit_price, 'fr')}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-2 text-sm">
              {order.shipping_cost > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span>{formatPrice(order.shipping_cost, 'fr')}</span>
                </div>
              )}
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>−{formatPrice(order.discount_amount, 'fr')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-1 border-t border-slate-100">
                <span>Total</span>
                <span>{formatPrice(order.total, 'fr')}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900">Payment</h3>
              <OrderStatusBadge status={order.payment_status} type="payment" />
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Method</span>
                <span className="font-medium capitalize">{order.payment_method.replace('_', ' ')}</span>
              </div>
              {order.payment_method === 'bank_transfer' && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Transfer Proof</span>
                  {order.bank_transfer_proof_url ? (
                    <Button size="sm" variant="outline" onClick={() => setShowProofModal(true)}>
                      View Proof
                    </Button>
                  ) : (
                    <span className="text-red-500 text-xs font-medium">Not uploaded yet</span>
                  )}
                </div>
              )}
              {order.payment_status !== 'paid' && (
                <div className="pt-3 border-t border-slate-100">
                  <Button
                    size="sm"
                    isLoading={updatingStatus}
                    onClick={handleMarkPaid}
                    className="w-full"
                  >
                    Mark as Paid Manually
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Customer + Notes */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4">Customer</h3>

            <div className="flex flex-col gap-2 mb-4">
              {order.user_id ? (
                <div className="flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-xs font-semibold text-blue-800">Registered Account</span>
                  <Link to={`/admin/customers/${order.user_id}`} className="ml-auto text-xs text-blue-600 hover:underline">
                    View profile →
                  </Link>
                </div>
              ) : (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-xs font-semibold text-amber-800">Guest Order</span>
                </div>
              )}
              {order.is_wholesale_order && (
                <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-lg">
                  <span className="text-xs font-semibold text-purple-800">Wholesale Order</span>
                </div>
              )}
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Name</p>
                <p className="font-semibold text-slate-900">{order.customer_name}</p>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1.5">Contact</p>
                <div className="space-y-1.5">
                  {(() => {
                    const phone = order.user_id
                      ? customerPhone
                      : (order.guest_phone || (order.shipping_address as any)?.phone);
                    return phone ? (
                      <a
                        href={`tel:${phone}`}
                        className="flex items-center gap-2 text-slate-700 hover:text-blue-600 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {phone}
                      </a>
                    ) : order.user_id ? (
                      <p className="text-xs text-slate-400 italic">No phone on profile</p>
                    ) : null;
                  })()}
                  {order.guest_email && (
                    <a
                      href={`mailto:${order.guest_email}`}
                      className="flex items-center gap-2 text-slate-700 hover:text-blue-600 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {order.guest_email}
                    </a>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1.5">Shipping Address</p>
                <div className="text-slate-700 space-y-0.5">
                  <p>{(order.shipping_address as any)?.address_line_1 || (order.shipping_address as any)?.addressLine1}</p>
                  {((order.shipping_address as any)?.address_line_2 || (order.shipping_address as any)?.addressLine2) && (
                    <p>{(order.shipping_address as any)?.address_line_2 || (order.shipping_address as any)?.addressLine2}</p>
                  )}
                  <p>{(order.shipping_address as any)?.city}, {(order.shipping_address as any)?.governorate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-3">Internal Notes</h3>
            <textarea
              className="w-full border border-slate-300 rounded-lg p-3 text-sm h-28 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none resize-none"
              placeholder="Notes visible only to admins..."
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
            />
            <Button size="sm" isLoading={savingNote} onClick={handleSaveNote} className="mt-2 w-full">
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