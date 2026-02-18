/**
 * Admin Wholesale Applications Page
 * Ghalinino - Tunisia E-commerce
 *
 * Dedicated view for managing wholesale applications:
 * - Filter by status (pending / approved / rejected / all)
 * - Quick approve/reject from the list
 * - Link to full customer profile for document review
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase, profilesWrite } from '@/lib/supabase';
import { Button } from '@/components/common';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { canApproveWholesale } from '@/lib/adminAuth';
import { formatPrice } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

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

// ============================================================================
// STATUS BADGE
// ============================================================================

function StatusPill({ status }: { status: string }) {
  const classes = {
    pending:  'bg-amber-100 text-amber-700 border border-amber-200',
    approved: 'bg-green-100 text-green-700 border border-green-200',
    rejected: 'bg-red-100  text-red-700  border border-red-200',
  }[status] ?? 'bg-slate-100 text-slate-600';

  const labels = {
    pending:  '⏳ Pending',
    approved: '✓ Approved',
    rejected: '✗ Rejected',
  }[status] ?? status;

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${classes}`}>
      {labels}
    </span>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AdminWholesaleApplications() {
  const { role, user: adminUser } = useAdminAuth();
  const canAct = canApproveWholesale(role);

  const [filter, setFilter] = useState<WholesaleStatus>('pending');
  const [applications, setApplications] = useState<WholesaleApplicant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('wholesale_status', 'none')
        .order('wholesale_applied_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('wholesale_status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setApplications((data as WholesaleApplicant[]) ?? []);
    } catch (err) {
      console.error('Error fetching wholesale applications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleApprove = async (applicantId: string) => {
    if (!canAct || !adminUser?.id) return;
    if (!confirm('Approve this wholesale application?')) return;

    setProcessingId(applicantId);
    try {
      const { error } = await profilesWrite()
        .update({
          role:                    'wholesale',
          wholesale_status:        'approved',
          wholesale_approved_at:   new Date().toISOString(),
          approved_by:             adminUser.id,
          wholesale_discount_tier: 1,
        })
        .eq('id', applicantId);

      if (error) throw error;
      await fetchApplications();
    } catch (err) {
      console.error('Approval error:', err);
      alert('Failed to approve. Check console.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (applicantId: string) => {
    if (!canAct || !adminUser?.id) return;
    const reason = prompt('Rejection reason (shown to customer):');
    if (!reason) return;

    setProcessingId(applicantId);
    try {
      const { error } = await profilesWrite()
        .update({
          wholesale_status:           'rejected',
          wholesale_rejected_at:      new Date().toISOString(),
          wholesale_rejection_reason: reason,
          approved_by:                adminUser.id,
        })
        .eq('id', applicantId);

      if (error) throw error;
      await fetchApplications();
    } catch (err) {
      console.error('Rejection error:', err);
      alert('Failed to reject. Check console.');
    } finally {
      setProcessingId(null);
    }
  };

  // ── Filtering ─────────────────────────────────────────────────────────────

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

  // ── Stats row ─────────────────────────────────────────────────────────────

  const counts = {
    all:      applications.length,
    pending:  applications.filter(a => a.wholesale_status === 'pending').length,
    approved: applications.filter(a => a.wholesale_status === 'approved').length,
    rejected: applications.filter(a => a.wholesale_status === 'rejected').length,
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Wholesale Applications</h1>
          <p className="text-slate-500 text-sm mt-0.5">Review and manage wholesale account requests</p>
        </div>

        {counts.pending > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-amber-700 text-sm font-medium">
              {counts.pending} pending review
            </span>
          </div>
        )}
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1 self-start">
          {(['pending', 'approved', 'rejected', 'all'] as WholesaleStatus[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                filter === tab
                  ? 'bg-white shadow-sm text-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {counts[tab] > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  tab === 'pending' && filter !== 'pending'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {counts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search by name, email, company, tax ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          Loading applications...
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
                {filtered.map((app) => (
                  <tr
                    key={app.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      app.wholesale_status === 'pending' ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    {/* Applicant */}
                    <td className="p-4">
                      <div className="font-medium text-slate-900">{app.full_name || '—'}</div>
                      <div className="text-xs text-slate-500">{app.email}</div>
                      {app.phone && <div className="text-xs text-slate-400">{app.phone}</div>}
                    </td>

                    {/* Business */}
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{app.business_name || '—'}</div>
                      {app.business_phone && (
                        <div className="text-xs text-slate-500">{app.business_phone}</div>
                      )}
                      {app.business_address && (
                        <div className="text-xs text-slate-400 max-w-[160px] truncate" title={app.business_address}>
                          {app.business_address}
                        </div>
                      )}
                    </td>

                    {/* Tax ID */}
                    <td className="p-4">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                        {app.business_tax_id || '—'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <StatusPill status={app.wholesale_status} />
                      {app.wholesale_status === 'rejected' && app.wholesale_rejection_reason && (
                        <p className="text-xs text-red-500 mt-1 max-w-[140px] truncate"
                          title={app.wholesale_rejection_reason}>
                          {app.wholesale_rejection_reason}
                        </p>
                      )}
                      {app.wholesale_status === 'approved' && app.wholesale_discount_tier && (
                        <p className="text-xs text-green-600 mt-1">Tier {app.wholesale_discount_tier}</p>
                      )}
                    </td>

                    {/* Applied date */}
                    <td className="p-4 text-slate-500 text-xs">
                      {app.wholesale_applied_at
                        ? new Date(app.wholesale_applied_at).toLocaleDateString('fr-TN')
                        : '—'}
                    </td>

                    {/* Documents */}
                    <td className="p-4">
                      {app.business_documents && app.business_documents.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {app.business_documents.map((doc, i) => {
                            const url = supabase.storage
                              .from('business-licenses')
                              .getPublicUrl(doc).data.publicUrl;
                            return (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition-colors"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                Doc {i + 1}
                              </a>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">None</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/customers/${app.id}`}>
                          <Button size="sm" variant="ghost" className="text-xs">
                            View
                          </Button>
                        </Link>

                        {canAct && app.wholesale_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(app.id)}
                              disabled={processingId === app.id}
                              className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              {processingId === app.id ? '…' : '✓ Approve'}
                            </button>
                            <button
                              onClick={() => handleReject(app.id)}
                              disabled={processingId === app.id}
                              className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                              {processingId === app.id ? '…' : '✗ Reject'}
                            </button>
                          </>
                        )}

                        {canAct && app.wholesale_status === 'approved' && (
                          <button
                            onClick={() => handleReject(app.id)}
                            disabled={processingId === app.id}
                            className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-red-100 hover:text-red-700 disabled:opacity-50 transition-colors"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
            Showing {filtered.length} of {applications.length} applications
          </div>
        </div>
      )}
    </div>
  );
}