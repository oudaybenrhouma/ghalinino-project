import { useState } from 'react';
import { useAdminCustomers } from '@/hooks/useAdminCustomers';
import { Link } from 'react-router-dom';
import { Button } from '@/components/common';

export function AdminCustomers() {
  const { customers, isLoading } = useAdminCustomers();
  const [search, setSearch] = useState('');

  const filteredCustomers = customers.filter(c => 
    (c.full_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone?.includes(search) || false)
  );

  if (isLoading) return <div className="p-8 text-center">Loading customers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <input
          type="text"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-4 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-slate-700">Name</th>
              <th className="p-4 font-semibold text-slate-700">Contact</th>
              <th className="p-4 font-semibold text-slate-700">Type</th>
              <th className="p-4 font-semibold text-slate-700">Wholesale Status</th>
              <th className="p-4 font-semibold text-slate-700">Joined</th>
              <th className="p-4 font-semibold text-slate-700"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-900">{customer.full_name || 'N/A'}</td>
                <td className="p-4 text-slate-600">
                  <div>{customer.email}</div>
                  <div className="text-xs">{customer.phone}</div>
                </td>
                <td className="p-4 capitalize">{customer.role}</td>
                <td className="p-4">
                  {customer.wholesale_status !== 'none' && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      customer.wholesale_status === 'approved' ? 'bg-green-100 text-green-700' :
                      customer.wholesale_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {customer.wholesale_status}
                    </span>
                  )}
                </td>
                <td className="p-4 text-slate-500">{new Date(customer.created_at).toLocaleDateString()}</td>
                <td className="p-4 text-right">
                  <Link to={`/admin/customers/${customer.id}`}>
                    <Button size="sm" variant="ghost">View</Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
