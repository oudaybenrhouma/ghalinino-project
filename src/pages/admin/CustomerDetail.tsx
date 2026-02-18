import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, profilesWrite } from '@/lib/supabase';
import { Button } from '@/components/common';
import { useAdminCustomers } from '@/hooks/useAdminCustomers';
import { canApproveWholesale } from '@/lib/adminAuth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import type { Profile, Order } from '@/types/database';
import { formatPrice } from '@/lib/utils';

export function AdminCustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const { role } = useAdminAuth();
  const { updateWholesaleStatus } = useAdminCustomers(); // kept but not used in new handlers
  const [customer, setCustomer] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Wholesale approval additions ──────────────────────────────────────
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { user: adminUser } = useAdminAuth();

  const handleApproveWholesale = async () => {
    if (!confirm('Are you sure you want to approve this wholesale application?')) {
      return;
    }
    if (!adminUser?.id || !id) return;

    setIsProcessing(true);
    try {
      const { error } = await profilesWrite()
        .update({
          role:                    'wholesale',
          wholesale_status:        'approved',
          wholesale_approved_at:   new Date().toISOString(),
          approved_by:             adminUser.id,
          wholesale_discount_tier: 1,
          admin_notes:             approvalNotes || null,
        })
        .eq('id', id);

      if (error) throw error;

      // TODO: Send email notification (Phase 12)

      alert('Wholesale account approved successfully!');
      window.location.reload(); // Or better: refetch customer
    } catch (error) {
      console.error('Approval error:', error);
      alert('Failed to approve account');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectWholesale = async () => {
    const reason = prompt('Enter rejection reason:');
    if (!reason || !adminUser?.id || !id) return;

    setIsProcessing(true);
    try {
      const { error } = await profilesWrite()
        .update({
          wholesale_status:           'rejected',
          wholesale_rejected_at:      new Date().toISOString(),
          wholesale_rejection_reason: reason,
          approved_by:                adminUser.id,
          admin_notes:                approvalNotes || null,
        })
        .eq('id', id);

      if (error) throw error;

      // TODO: Send rejection email (Phase 12)

      alert('Wholesale application rejected');
      window.location.reload();
    } catch (error) {
      console.error('Rejection error:', error);
      alert('Failed to reject application');
    } finally {
      setIsProcessing(false);
    }
  };
  // ───────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        setIsLoading(true);
        // Fetch profile
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single();
        if (profile) setCustomer(profile as Profile);

        // Fetch orders
        const { data: userOrders } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', id)
          .order('created_at', { ascending: false });
        if (userOrders) setOrders(userOrders as Order[]);

        setIsLoading(false);
      };
      fetchData();
    }
  }, [id]);

  if (isLoading) return <div className="p-8 text-center">Loading profile...</div>;
  if (!customer) return <div className="p-8 text-center">Customer not found</div>;

  const isAdminAllowedToAct = canApproveWholesale(role);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Customer Profile</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Info + Wholesale Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-2xl font-bold text-slate-500">
                {customer.full_name?.charAt(0) || customer.email.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{customer.full_name}</h2>
                <p className="text-slate-500">{customer.email}</p>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full capitalize">
                    {customer.role}
                  </span>
                  {customer.wholesale_status && customer.wholesale_status !== 'none' && (
                    <span
                      className={`px-2 py-1 text-xs rounded-full capitalize ${
                        customer.wholesale_status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : customer.wholesale_status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      Wholesale: {customer.wholesale_status}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Contact Info</h3>
                <p className="text-sm text-slate-600 mb-1">
                  <span className="font-medium">Phone:</span> {customer.phone || 'N/A'}
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Language:</span> {customer.preferred_language}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Default Address</h3>
                {customer.default_address ? (
                  <div className="text-sm text-slate-600">
                    <p>{customer.default_address}</p>
                    <p>
                      {customer.default_city}, {customer.default_governorate}
                    </p>
                    <p>{customer.default_postal_code}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No default address set</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Wholesale Application / Approval Section ──────────────────────── */}
          {customer.wholesale_status && customer.wholesale_status !== 'none' && (
            <>
              {customer.wholesale_status === 'pending' && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Wholesale Application Pending Review
                  </h3>

                  {/* Business Information */}
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                      <p className="text-slate-900">{customer.business_name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tax ID</label>
                      <p className="text-slate-900 font-mono">{customer.business_tax_id || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Business Address</label>
                      <p className="text-slate-900">{customer.business_address || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Business Phone</label>
                      <p className="text-slate-900">{customer.business_phone || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Business Documents */}
                  {customer.business_documents && customer.business_documents.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Business License Documents
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {customer.business_documents.map((doc: string, index: number) => {
                          const publicUrl = supabase.storage
                            .from('business-licenses')
                            .getPublicUrl(doc).data.publicUrl;

                          return (
                            <a
                              key={index}
                              href={publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                            >
                              <svg
                                className="w-4 h-4 text-slate-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                />
                              </svg>
                              Document {index + 1}
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Application Date */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Applied On</label>
                    <p className="text-slate-900">
                      {customer.wholesale_applied_at
                        ? new Date(customer.wholesale_applied_at).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>

                  {/* Admin Notes */}
                  {isAdminAllowedToAct && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Admin Notes (Internal)
                      </label>
                      <textarea
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md"
                        rows={3}
                        placeholder="Add any notes about this application..."
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  {isAdminAllowedToAct && (
                    <div className="flex gap-3">
                      <button
                        onClick={handleApproveWholesale}
                        disabled={isProcessing}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                      >
                        ✓ Approve Wholesale Account
                      </button>
                      <button
                        onClick={handleRejectWholesale}
                        disabled={isProcessing}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                      >
                        ✗ Reject Application
                      </button>
                    </div>
                  )}
                </div>
              )}

              {customer.wholesale_status === 'approved' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-green-800">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-semibold">Wholesale Account Active</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Approved on{' '}
                    {customer.wholesale_approved_at
                      ? new Date(customer.wholesale_approved_at).toLocaleDateString()
                      : 'N/A'}
                  </p>
                  <p className="text-sm text-green-700">
                    Discount Tier: {customer.wholesale_discount_tier || 1}
                  </p>
                </div>
              )}

              {customer.wholesale_status === 'rejected' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-red-800">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-semibold">Application Rejected</span>
                  </div>
                  {customer.wholesale_rejection_reason && (
                    <p className="text-sm text-red-700 mt-1">
                      Reason: {customer.wholesale_rejection_reason}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Order History Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4">Order History</h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {orders.map((order) => (
                <div key={order.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono font-medium text-sm">{order.order_number}</span>
                    <span className="text-xs text-slate-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">{formatPrice(order.total, 'fr')}</span>
                    <span
                      className={`px-2 py-0.5 text-[10px] rounded-full capitalize ${
                        order.status === 'delivered'
                          ? 'bg-green-100 text-green-700'
                          : order.status === 'cancelled'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <p className="text-center text-slate-500 text-sm py-4">No orders yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}