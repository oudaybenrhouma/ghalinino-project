import { useState } from 'react';
import { useAdminOrders } from '@/hooks/useAdminOrders';
import { Link } from 'react-router-dom';
import { Button } from '@/components/common';
import { OrderStatusBadge } from '@/components/common/OrderStatusBadge';
import { formatPrice, cn } from '@/lib/utils';

function exportOrdersCSV(orders: any[]) {
  const headers = [
    'Order Number', 'Date', 'Customer Name', 'Phone', 'City', 'Governorate',
    'Payment Method', 'Payment Status', 'Order Status', 'Total (TND)',
    'Is Wholesale', 'Customer Type'
  ];

  const rows = orders.map(order => [
    order.order_number,
    new Date(order.created_at).toLocaleDateString('en-GB'),
    order.customer_name,
    order.customer_phone || '',
    order.shipping_address?.city || '',
    order.shipping_address?.governorate || '',
    order.payment_method,
    order.payment_status,
    order.status,
    order.total.toFixed(3),
    order.is_wholesale_order ? 'Yes' : 'No',
    order.user_id ? 'Account' : 'Guest',
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminOrders() {
  const { orders, isLoading, updateOrderStatus } = useAdminOrders();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const filteredOrders = orders.filter(order => {
    const matchesStatus =
      filterStatus === 'all' ? true :
      filterStatus === 'guest' ? !(order as any).user_id :
      order.status === filterStatus;
    const matchesSearch =
      order.order_number.toLowerCase().includes(search.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      ((order as any).guest_email || '').toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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

  // Status counts for filter badges
  const counts: Record<string, number> = { all: orders.length };
  orders.forEach(o => {
    counts[o.status] = (counts[o.status] || 0) + 1;
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading orders...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">{orders.length} total orders</p>
        </div>
        <Button
          variant="outline"
          onClick={() => exportOrdersCSV(filteredOrders)}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV {filteredOrders.length !== orders.length && `(${filteredOrders.length})`}
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['all', 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5',
                filterStatus === status
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {counts[status] > 0 && (
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full font-semibold',
                  filterStatus === status ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                )}>
                  {counts[status] || 0}
                </span>
              )}
            </button>
          ))}
          <div className="w-px bg-slate-200 mx-1 self-stretch" />
          <button
            onClick={() => setFilterStatus(filterStatus === 'guest' ? 'all' : 'guest')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              filterStatus === 'guest'
                ? 'bg-amber-500 text-white'
                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
            )}
          >
            Guests only
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search by order number or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-sm"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
          <span className="text-sm font-medium">{selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''} selected</span>
          <div className="flex gap-2">
            <button onClick={() => handleBulkStatusUpdate('processing')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
              Mark Processing
            </button>
            <button onClick={() => handleBulkStatusUpdate('shipped')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
              Mark Shipped
            </button>
            <button onClick={() => setSelectedOrders([])} className="px-3 py-1.5 text-slate-400 hover:text-white text-sm transition-colors">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
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
                <th className="p-4 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300"
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => toggleSelectOrder(order.id)}
                    />
                  </td>
                  <td className="p-4 font-mono font-medium text-slate-900">{order.order_number}</td>
                  <td className="p-4 text-slate-500 whitespace-nowrap">{new Date(order.created_at).toLocaleDateString('en-GB')}</td>
                  <td className="p-4">
                    <div className="font-medium text-slate-900">{order.customer_name}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {order.user_id ? (
                        <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full font-medium">Account</span>
                      ) : (
                        <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full font-medium">Guest</span>
                      )}
                      {order.is_wholesale_order && (
                        <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded-full font-medium">Wholesale</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="capitalize text-slate-700 text-sm">{order.payment_method.replace('_', ' ')}</div>
                    <OrderStatusBadge status={order.payment_status} type="payment" size="sm" />
                  </td>
                  <td className="p-4">
                    <OrderStatusBadge status={order.status} type="order" />
                  </td>
                  <td className="p-4 text-right font-bold text-slate-900">{formatPrice(order.total, 'fr')}</td>
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
                    <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    No orders found matching your filters.
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