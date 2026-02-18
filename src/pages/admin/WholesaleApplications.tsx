import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase, profilesWrite } from '@/lib/supabase';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { canApproveWholesale } from '@/lib/adminAuth';
import { useStore } from '@/store';

type WholesaleStatus = 'all' | 'pending' | 'approved' | 'rejected';

interface WholesaleApplicant {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  wholesale_status: 'pending' | 'approved' | 'rejected';
  wholesale_applied_at: string | null;
  wholesale_approved_at: string | null;
  wholesale_rejected_at: string | null;
  wholesale_rejection_reason: string | null;
  business_name: string | null;
  business_tax_id: string | null;
  business_address: string | null;
  business_phone: string | null;
  business_documents: string[] | null;
  wholesale_discount_tier: number | null;
  admin_notes: string | null;
  created_at: string;
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 border border-amber-200',
    approved: 'bg-green-100 text-green-700 border border-green-200',
    rejected: 'bg-red-100 text-red-700 border border-red-200',
  };
  const labels: Record<string, string> = {
    pending: '⏳ Pending',
    approved: '✓ Approved',
    rejected: '✗ Rejected',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {labels[status] ?? status}
    </span>
  );
}

export function AdminWholesaleApplications() {
  const { role, user: adminUser } = useAdminAuth();
  const addNotification = useStore((s) => s.addNotification);
  const canAct = canApproveWholesale(role);

  const [filter, setFilter] = useState<WholesaleStatus>('pending');
  const [applications, setApplications] = useState<WholesaleApplicant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Inline rejection form state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = (supabase as any)
        .from('profiles')
        .select('*')
        .neq('wholesale_status', 'none')
        .order('wholesale_applied_at', { ascending: false });
      if (filter !== 'all') query = query.eq('wholesale_status', filter);
      const { data, error } = await query;
      if (error) throw error;
      setApplications(data ?? []);
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Failed to load applications', message: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [filter, addNotification]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const handleApprove = async (applicantId: string) => {
    if (!canAct || !adminUser?.id) return;
    setProcessingId(applicantId);
    try {
      const { error } = await profilesWrite()
        .update({
          role: 'wholesale',
          wholesale_status: 'approved',
          wholesale_approved_at: new Date().toISOString(),
          approved_by: adminUser.id,
          wholesale_discount_tier: 1,
        })
        .eq('id', applicantId);
      if (error) throw error;
      addNotification({ type: 'success', title: 'Wholesale account approved' });
      await fetchApplications();
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Failed to approve', message: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSubmit = async (applicantId: string) => {
    if (!rejectionReason.trim()) {
      addNotification({ type: 'error', title: 'Please enter a rejection reason' });
      return;
    }
    if (!canAct || !adminUser?.id) return;
    setProcessingId(applicantId);
    try {
      const { error } = await profilesWrite()
        .update({
          wholesale_status: 'rejected',
          wholesale_rejected_at: new Date().toISOString(),
          wholesale_rejection_reason: rejectionReason,
          approved_by: adminUser.id,
        })
        .eq('id', applicantId);
      if (error) throw error;
      addNotification({ type: 'success', title: 'Application rejected' });
      setRejectingId(null);
      setRejectionReason('');
      await fetchApplications();
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Failed to reject', message: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRevoke = async (applicantId: string) => {
    if (!canAct || !adminUser?.id) return;
    setProcessingId(applicantId);
    try {
      const { error } = await profilesWrite()
        .update({
          role: 'customer',
          wholesale_status: 'rejected',
          wholesale_rejected_at: new Date().toISOString(),
          wholesale_rejection_reason: 'Access revoked by admin',
          approved_by: adminUser.id,
        })
        .eq('id', applicantId);
      if (error) throw error;
      addNotification({ type: 'success', title: 'Wholesale access revoked' });
      await fetchApplications();
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Failed to revoke', message: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = applications.filter(a => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      a.email.toLowerCase().includes(s) ||
      (a.full_name?.toLowerCase() || '').includes(s) ||
      (a.business_name?.toLowerCase() || '').includes(s) ||
      (a.business_tax_id?.toLowerCase() || '').includes(s)
    );
  });

  const counts = {
    all: applications.length,
    pending: applications.filter(a => a.wholesale_status === 'pending').length,
    approved: applications.filter(a => a.wholesale_status === 'approved').length,
    rejected: applications.filter(a => a.wholesale_status === 'rejected').length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Wholesale Applications</h1>
          <p className="text-sm text-slate-500 mt-0.5">Review and manage wholesale account requests</p>
        </div>
        {counts.pending > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl self-start">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-amber-700 text-sm font-medium">{counts.pending} pending review</span>
          </div>
        )}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1 self-start">
          {(['pending', 'approved', 'rejected', 'all'] as WholesaleStatus[]).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === tab ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {counts[tab] > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  tab === 'pending' && filter !== 'pending' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {counts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by name, email, company, tax ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading applications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400 text-sm">
            {search ? 'No results match your search.' : `No ${filter === 'all' ? '' : filter} applications.`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-semibold text-slate-700">Applicant</th>
                  <th className="p-4 font-semibold text-slate-700">Business</th>
                  <th className="p-4 font-semibold text-slate-700">Tax ID</th>
                  <th className="p-4 font-semibold text-slate-700">Status</th>
                  <th className="p-4 font-semibold text-slate-700">Applied</th>
                  <th className="p-4 font-semibold text-slate-700">Docs</th>
                  <th className="p-4 font-semibold text-slate-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(app => (
                  <>
                    <tr
                      key={app.id}
                      className={`hover:bg-slate-50 transition-colors ${app.wholesale_status === 'pending' ? 'bg-amber-50/30' : ''}`}
                    >
                      <td className="p-4">
                        <div className="font-medium text-slate-900">{app.full_name || '—'}</div>
                        <div className="text-xs text-slate-500">{app.email}</div>
                        {app.phone && <div className="text-xs text-slate-400">{app.phone}</div>}
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-800">{app.business_name || '—'}</div>
                        {app.business_phone && <div className="text-xs text-slate-500">{app.business_phone}</div>}
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                          {app.business_tax_id || '—'}
                        </span>
                      </td>
                      <td className="p-4">
                        <StatusPill status={app.wholesale_status} />
                        {app.wholesale_status === 'rejected' && app.wholesale_rejection_reason && (
                          <p className="text-xs text-red-500 mt-1 max-w-[140px] truncate" title={app.wholesale_rejection_reason}>
                            {app.wholesale_rejection_reason}
                          </p>
                        )}
                      </td>
                      <td className="p-4 text-slate-500 text-xs">
                        {app.wholesale_applied_at ? new Date(app.wholesale_applied_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-4">
                        {app.business_documents && app.business_documents.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {app.business_documents.map((doc, i) => {
                              const url = supabase.storage.from('business-licenses').getPublicUrl(doc).data.publicUrl;
                              return (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition-colors">
                                  Doc {i + 1}
                                </a>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">None</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/admin/customers/${app.id}`}>
                            <button className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                              View
                            </button>
                          </Link>
                          {canAct && app.wholesale_status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(app.id)}
                                disabled={processingId === app.id}
                                className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                              >
                                {processingId === app.id ? '...' : '✓ Approve'}
                              </button>
                              <button
                                onClick={() => { setRejectingId(app.id); setRejectionReason(''); }}
                                disabled={processingId === app.id}
                                className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                              >
                                ✗ Reject
                              </button>
                            </>
                          )}
                          {canAct && app.wholesale_status === 'approved' && (
                            <button
                              onClick={() => handleRevoke(app.id)}
                              disabled={processingId === app.id}
                              className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-red-100 hover:text-red-700 disabled:opacity-50 transition-colors"
                            >
                              {processingId === app.id ? '...' : 'Revoke'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Inline rejection form row */}
                    {rejectingId === app.id && (
                      <tr key={`${app.id}-reject`} className="bg-red-50">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <label className="block text-xs font-semibold text-red-800 mb-1">
                                Rejection reason <span className="text-red-500">*</span> — shown to customer
                              </label>
                              <input
                                type="text"
                                value={rejectionReason}
                                onChange={e => setRejectionReason(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleRejectSubmit(app.id)}
                                className="w-full px-3 py-1.5 border border-red-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="e.g. Missing business registration document"
                                autoFocus
                              />
                            </div>
                            <div className="flex gap-2 mt-5 shrink-0">
                              <button
                                onClick={() => handleRejectSubmit(app.id)}
                                disabled={processingId === app.id || !rejectionReason.trim()}
                                className="px-4 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                              >
                                {processingId === app.id ? 'Submitting...' : 'Submit'}
                              </button>
                              <button
                                onClick={() => { setRejectingId(null); setRejectionReason(''); }}
                                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
            Showing {filtered.length} of {applications.length} applications
          </div>
        </div>
      )}
    </div>
  );
}