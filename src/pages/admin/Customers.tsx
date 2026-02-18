import { useState } from 'react';
import { useAdminCustomers } from '@/hooks/useAdminCustomers';
import { Link } from 'react-router-dom';
import { Button } from '@/components/common';
import { formatPrice } from '@/lib/utils';

type WholesaleFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'none';

export function AdminCustomers() {
  const { customers, isLoading } = useAdminCustomers();
  const [search, setSearch] = useState('');
  const [wholesaleFilter, setWholesaleFilter] = useState<WholesaleFilter>('all');

  const filtered = customers.filter(c => {
    const matchesSearch =
      (c.full_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone?.includes(search) || false);
    const matchesWholesale =
      wholesaleFilter === 'all' ? true :
      wholesaleFilter === 'none' ? (!c.wholesale_status || c.wholesale_status === 'none') :
      c.wholesale_status === wholesaleFilter;
    return matchesSearch && matchesWholesale;
  });

  const pendingCount = customers.filter(c => c.wholesale_status === 'pending').length;

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading customers...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500 mt-0.5">{customers.length} registered accounts</p>
        </div>
        {pendingCount > 0 && (
          <Link to="/admin/wholesale">
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-amber-700 font-medium">{pendingCount} wholesale pending</span>
            </div>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-sm"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div className="flex gap-1 shrink-0">
          {([
            { value: 'all', label: 'All' },
            { value: 'pending', label: '⏳ Pending' },
            { value: 'approved', label: '✓ Wholesale' },
            { value: 'rejected', label: '✗ Rejected' },
            { value: 'none', label: 'Regular' },
          ] as { value: WholesaleFilter; label: string }[]).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setWholesaleFilter(value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                wholesaleFilter === value
                  ? value === 'pending' ? 'bg-amber-500 text-white'
                  : value === 'approved' ? 'bg-green-600 text-white'
                  : value === 'rejected' ? 'bg-red-600 text-white'
                  : 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold text-slate-700">Customer</th>
                <th className="p-4 font-semibold text-slate-700">Contact</th>
                <th className="p-4 font-semibold text-slate-700">Role</th>
                <th className="p-4 font-semibold text-slate-700">Wholesale</th>
                <th className="p-4 font-semibold text-slate-700">Joined</th>
                <th className="p-4 font-semibold text-slate-700 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((customer) => (
                <tr key={customer.id} className={`hover:bg-slate-50 transition-colors ${customer.wholesale_status === 'pending' ? 'bg-amber-50/30' : ''}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-bold text-slate-500 shrink-0">
                        {(customer.full_name?.charAt(0) || customer.email.charAt(0)).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{customer.full_name || 'No name'}</div>
                        {customer.business_name && (
                          <div className="text-xs text-slate-500">{customer.business_name}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">
                    <div className="text-sm">{customer.email}</div>
                    {customer.phone && <div className="text-xs text-slate-400">{customer.phone}</div>}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full capitalize font-medium">
                      {customer.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {customer.wholesale_status && customer.wholesale_status !== 'none' ? (
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium capitalize ${
                        customer.wholesale_status === 'approved' ? 'bg-green-100 text-green-700' :
                        customer.wholesale_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {customer.wholesale_status}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="p-4 text-slate-500 text-sm">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <Link to={`/admin/customers/${customer.id}`}>
                      <Button size="sm" variant="ghost">View</Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    No customers match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}