import { useState } from 'react';
import { useAdminOrders } from '@/hooks/useAdminOrders';
import { Link } from 'react-router-dom';
import { Button } from '@/components/common';
import { OrderStatusBadge } from '@/components/common/OrderStatusBadge';
import { formatPrice, cn } from '@/lib/utils';

export function AdminOrders() {
  const { orders, isLoading, updateOrderStatus } = useAdminOrders();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Filter & Search
  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = 
      order.order_number.toLowerCase().includes(search.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Bulk Actions
  const handleBulkStatusUpdate = async (status: string) => {
    for (const orderId of selectedOrders) {
      await updateOrderStatus(orderId, status);
    }
    setSelectedOrders([]);
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    );
  };

  if (isLoading) return <div className="p-8 text-center">Loading orders...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <div className="flex gap-2">
          <Button variant="outline">Export CSV</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {['all', 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                filterStatus === status 
                  ? "bg-slate-900 text-white" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
          />
          <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedOrders.length > 0 && (
        <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2">
          <span>{selectedOrders.length} orders selected</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => handleBulkStatusUpdate('processing')}>
              Mark Processing
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleBulkStatusUpdate('shipped')}>
              Mark Shipped
            </Button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 w-10">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-300"
                  onChange={(e) => {
                    if (e.target.checked) setSelectedOrders(filteredOrders.map(o => o.id));
                    else setSelectedOrders([]);
                  }}
                  checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                />
              </th>
              <th className="p-4 font-semibold text-slate-700">Order</th>
              <th className="p-4 font-semibold text-slate-700">Date</th>
              <th className="p-4 font-semibold text-slate-700">Customer</th>
              <th className="p-4 font-semibold text-slate-700">Payment</th>
              <th className="p-4 font-semibold text-slate-700">Status</th>
              <th className="p-4 font-semibold text-slate-700 text-right">Total</th>
              <th className="p-4 font-semibold text-slate-700"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                <td className="p-4">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300"
                    checked={selectedOrders.includes(order.id)}
                    onChange={() => toggleSelectOrder(order.id)}
                  />
                </td>
                <td className="p-4 font-mono font-medium">{order.order_number}</td>
                <td className="p-4 text-slate-500">{new Date(order.created_at).toLocaleDateString()}</td>
                <td className="p-4">
                  <div className="font-medium text-slate-900">{order.customer_name}</div>
                  {order.is_wholesale_order && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Wholesale</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    <span className="capitalize text-slate-700">{order.payment_method.replace('_', ' ')}</span>
                    <OrderStatusBadge status={order.payment_status} type="payment" size="sm" />
                  </div>
                </td>
                <td className="p-4">
                  <OrderStatusBadge status={order.status} type="order" />
                </td>
                <td className="p-4 text-right font-bold">
                  {formatPrice(order.total * 1000, 'fr')}
                </td>
                <td className="p-4 text-right">
                  <Link to={`/admin/orders/${order.id}`}>
                    <Button size="sm" variant="ghost">View</Button>
                  </Link>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-500">
                  No orders found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
