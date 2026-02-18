import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, profilesWrite } from '@/lib/supabase';
import { Button } from '@/components/common';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { canApproveWholesale } from '@/lib/adminAuth';
import { useStore } from '@/store';
import type { Profile, Order } from '@/types/database';
import { formatPrice } from '@/lib/utils';

export function AdminCustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const { role, user: adminUser } = useAdminAuth();
  const addNotification = useStore((s) => s.addNotification);
  const [customer, setCustomer] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (profile) setCustomer(profile as Profile);
    const { data: userOrders } = await (supabase as any)
      .from('orders')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false });
    if (userOrders) setOrders(userOrders as Order[]);
    setIsLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async () => {
    if (!adminUser?.id || !id) return;
    setIsProcessing(true);
    try {
      const { error } = await profilesWrite()
        .update({
          role: 'wholesale',
          wholesale_status: 'approved',
          wholesale_approved_at: new Date().toISOString(),
          approved_by: adminUser.id,
          wholesale_discount_tier: 1,
          admin_notes: approvalNotes || null,
        })
        .eq('id', id);
      if (error) throw error;
      addNotification({ type: 'success', title: 'Wholesale account approved' });
      await fetchData();
    } catch (e: any) {
      addNotification({ type: 'error', title: 'Failed to approve', message: e.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      addNotification({ type: 'error', title: 'Rejection reason is required' });
      return;
    }
    if (!adminUser?.id || !id) return;
    setIsProcessing(true);
    try {
      const { error } = await profilesWrite()
        .update({
          wholesale_status: 'rejected',
          wholesale_rejected_at: new Date().toISOString(),
          wholesale_rejection_reason: rejectionReason,
          approved_by: adminUser.id,
          admin_notes: approvalNotes || null,
        })
        .eq('id', id);
      if (error) throw error;
      addNotification({ type: 'success', title: 'Application rejected' });
      setShowRejectForm(false);
      setRejectionReason('');
      await fetchData();
    } catch (e: any) {
      addNotification({ type: 'error', title: 'Failed to reject', message: e.message });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading profile...</p>
      </div>
    </div>
  );
  if (!customer) return <div className="p-8 text-center text-slate-500">Customer not found</div>;

  const isAdminAllowedToAct = canApproveWholesale(role);
  const totalSpend = orders.reduce((sum, o) => sum + (o.payment_status === 'paid' ? o.total : 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/admin/customers" className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Customer Profile</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Profile card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-xl font-bold text-slate-500 shrink-0">
                {customer.full_name?.charAt(0)?.toUpperCase() || customer.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{customer.full_name || 'No name'}</h2>
                <p className="text-slate-500 text-sm">{customer.email}</p>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full capitalize font-medium">
                    {customer.role}
                  </span>
                  {customer.wholesale_status && customer.wholesale_status !== 'none' && (
                    <span className={`px-2 py-0.5 text-xs rounded-full capitalize font-medium ${
                      customer.wholesale_status === 'approved' ? 'bg-green-100 text-green-700' :
                      customer.wholesale_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      Wholesale: {customer.wholesale_status}
                    </span>
                  )}
                </div>
              </div>
              {/* Stats */}
              <div className="ml-auto text-right shrink-0">
                <p className="text-xl font-bold text-slate-900">{formatPrice(totalSpend, 'fr')}</p>
                <p className="text-xs text-slate-500">{orders.length} orders</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Contact</h3>
                <p className="text-slate-600 mb-1"><span className="text-slate-400">Phone:</span> {customer.phone || '—'}</p>
                <p className="text-slate-600"><span className="text-slate-400">Language:</span> {customer.preferred_language?.toUpperCase() || '—'}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Default Address</h3>
                {customer.default_address ? (
                  <div className="text-slate-600 space-y-0.5">
                    <p>{customer.default_address}</p>
                    <p>{customer.default_city}, {customer.default_governorate}</p>
                    {customer.default_postal_code && <p>{customer.default_postal_code}</p>}
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-sm">No default address</p>
                )}
              </div>
            </div>

            {customer.admin_notes && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Admin Notes</p>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{customer.admin_notes}</p>
              </div>
            )}
          </div>

          {/* Wholesale section */}
          {customer.wholesale_status && customer.wholesale_status !== 'none' && (
            <div className={`rounded-xl border-2 p-6 ${
              customer.wholesale_status === 'pending' ? 'bg-amber-50 border-amber-200' :
              customer.wholesale_status === 'approved' ? 'bg-green-50 border-green-200' :
              'bg-red-50 border-red-200'
            }`}>
              {customer.wholesale_status === 'pending' && (
                <>
                  <h3 className="text-base font-bold text-amber-900 mb-4">⏳ Wholesale Application — Pending Review</h3>
                  <div className="grid md:grid-cols-2 gap-4 mb-5 text-sm">
                    {[
                      { label: 'Company Name', value: customer.business_name },
                      { label: 'Tax ID', value: customer.business_tax_id },
                      { label: 'Business Phone', value: customer.business_phone },
                      { label: 'Business Address', value: customer.business_address },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-slate-500 text-xs mb-0.5">{label}</p>
                        <p className="font-medium text-slate-900">{value || '—'}</p>
                      </div>
                    ))}
                    {customer.wholesale_applied_at && (
                      <div>
                        <p className="text-slate-500 text-xs mb-0.5">Applied On</p>
                        <p className="font-medium text-slate-900">{new Date(customer.wholesale_applied_at).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Documents */}
                  {customer.business_documents && customer.business_documents.length > 0 && (
                    <div className="mb-5">
                      <p className="text-xs text-slate-500 mb-2">Business Documents</p>
                      <div className="flex flex-wrap gap-2">
                        {customer.business_documents.map((doc: string, i: number) => {
                          const url = supabase.storage.from('business-licenses').getPublicUrl(doc).data.publicUrl;
                          return (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Document {i + 1}
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {isAdminAllowedToAct && (
                    <>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Admin Notes (Internal)</label>
                        <textarea
                          value={approvalNotes}
                          onChange={(e) => setApprovalNotes(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none resize-none"
                          rows={2}
                          placeholder="Optional notes about this application..."
                        />
                      </div>

                      {/* Reject form */}
                      {showRejectForm && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <label className="block text-sm font-medium text-red-800 mb-1.5">
                            Rejection Reason <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none"
                            rows={2}
                            placeholder="This will be shown to the customer..."
                            autoFocus
                          />
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={handleReject}
                              disabled={isProcessing || !rejectionReason.trim()}
                              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                              {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                            <button
                              onClick={() => { setShowRejectForm(false); setRejectionReason(''); }}
                              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={handleApprove}
                          disabled={isProcessing}
                          className="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium text-sm transition-colors"
                        >
                          {isProcessing ? 'Processing...' : '✓ Approve'}
                        </button>
                        {!showRejectForm && (
                          <button
                            onClick={() => setShowRejectForm(true)}
                            disabled={isProcessing}
                            className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium text-sm transition-colors"
                          >
                            ✗ Reject
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}

              {customer.wholesale_status === 'approved' && (
                <>
                  <h3 className="font-bold text-green-900 mb-1">✓ Wholesale Account Active</h3>
                  <p className="text-sm text-green-700">
                    Approved {customer.wholesale_approved_at ? `on ${new Date(customer.wholesale_approved_at).toLocaleDateString()}` : ''}
                    {customer.wholesale_discount_tier ? ` · Tier ${customer.wholesale_discount_tier}` : ''}
                  </p>
                </>
              )}

              {customer.wholesale_status === 'rejected' && (
                <>
                  <h3 className="font-bold text-red-900 mb-1">✗ Application Rejected</h3>
                  {customer.wholesale_rejection_reason && (
                    <p className="text-sm text-red-700">Reason: {customer.wholesale_rejection_reason}</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Order History */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Order History</h3>
              <span className="text-xs text-slate-500">{orders.length} orders</span>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  to={`/admin/orders/${order.id}`}
                  className="block p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-medium text-slate-700">{order.order_number}</span>
                    <span className="text-xs text-slate-400">{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="font-bold text-sm text-slate-900">{formatPrice(order.total, 'fr')}</span>
                    <span className={`px-2 py-0.5 text-[10px] rounded-full capitalize font-medium ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </Link>
              ))}
              {orders.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-6">No orders yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}