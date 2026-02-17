import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAdminOrders } from '@/hooks/useAdminOrders';
import { useAdminProducts } from '@/hooks/useAdminProducts';
import { useAdminCustomers } from '@/hooks/useAdminCustomers';
import { formatPrice } from '@/lib/utils';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

export function AdminDashboard() {
  const { orders, isLoading: ordersLoading } = useAdminOrders();
  const { products, isLoading: productsLoading } = useAdminProducts();
  const { customers, isLoading: customersLoading } = useAdminCustomers();

  // Calculate metrics
  const totalRevenue = orders.reduce((sum, order) => sum + (order.payment_status === 'paid' ? order.total : 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const lowStockProducts = products.filter(p => p.quantity < (p.low_stock_threshold || 5)).length;
  const pendingWholesale = customers.filter(c => c.wholesale_status === 'pending').length;

  // Prepare chart data (last 7 days revenue)
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    
    const dayRevenue = orders
      .filter(o => o.created_at.startsWith(dateStr) && o.payment_status === 'paid')
      .reduce((sum, o) => sum + o.total, 0);

    return {
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      revenue: dayRevenue
    };
  });

  if (ordersLoading || productsLoading || customersLoading) {
    return <div className="p-8 text-center">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Revenue" 
          value={formatPrice(totalRevenue * 1000, 'fr')} 
          icon="💰"
          trend="+12%"
          trendUp={true}
        />
        <MetricCard 
          title="Total Orders" 
          value={orders.length.toString()} 
          icon="📦"
          trend="+5%"
          trendUp={true}
        />
        <MetricCard 
          title="New Customers" 
          value={customers.length.toString()} 
          icon="👥"
          trend="+8%"
          trendUp={true}
        />
        <MetricCard 
          title="Pending Wholesale" 
          value={pendingWholesale.toString()} 
          icon="🪪"
          className="bg-amber-50 border-amber-200"
        />
      </div>

      {/* Charts & Alerts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-700 mb-6">Revenue (Last 7 Days)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right column: Action Needed + Pending Wholesale */}
        <div className="space-y-6">
          {/* Pending Orders */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-700 mb-4 flex justify-between items-center">
              Pending Orders
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">{pendingOrders}</span>
            </h3>
            <div className="space-y-3">
              {orders.filter(o => o.status === 'pending').slice(0, 5).map(order => (
                <div key={order.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100">
                  <div>
                    <p className="font-medium text-sm">{order.order_number}</p>
                    <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="text-sm font-bold">{order.total} TND</span>
                </div>
              ))}
              {pendingOrders === 0 && <p className="text-sm text-slate-500 text-center py-4">No pending orders</p>}
            </div>
          </div>

          {/* Low Stock */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-700 mb-4 flex justify-between items-center">
              Low Stock Alerts
              <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">{lowStockProducts}</span>
            </h3>
            <div className="space-y-3">
              {products.filter(p => p.quantity < (p.low_stock_threshold || 5)).slice(0, 5).map(product => (
                <div key={product.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100">
                  <div className="flex items-center gap-3">
                    <img src={product.images?.[0] || '/placeholder.png'} className="w-10 h-10 rounded-md object-cover bg-slate-100" />
                    <div className="max-w-[140px]">
                      <p className="font-medium text-sm truncate">{product.name_fr}</p>
                      <p className="text-xs text-slate-500">SKU: {product.sku}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-red-600">{product.quantity} left</span>
                </div>
              ))}
              {lowStockProducts === 0 && <p className="text-sm text-slate-500 text-center py-4">Inventory looks good</p>}
            </div>
          </div>

          {/* ── Pending Wholesale Applications ── */}
          <PendingWholesaleApplications />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, trend, trendUp, className = '' }: any) {
  return (
    <div className={`bg-white p-6 rounded-xl border border-slate-200 shadow-sm ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-slate-500 text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg text-xl">
          {icon}
        </div>
      </div>
      {trend && (
        <p className={`text-sm flex items-center gap-1 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
          <span>{trendUp ? '↑' : '↓'}</span>
          <span>{trend} vs last month</span>
        </p>
      )}
    </div>
  );
}

/**
 * Pending Wholesale Applications Widget
 * Shows up to 5 most recent pending wholesale requests
 */
function PendingWholesaleApplications() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingApplications();
  }, []);

  const loadPendingApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('wholesale_status', 'pending')
        .order('wholesale_applied_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error loading pending wholesale applications:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-slate-100 rounded-lg h-48"></div>;
  }

  if (applications.length === 0) {
    return null; // Hide card when no pending applications
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
          Pending Wholesale Applications
        </h3>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          {applications.length} pending
        </span>
      </div>

      <div className="space-y-3">
        {applications.map((app) => (
          <Link
            key={app.id}
            to={`/admin/customers/${app.id}`}
            className="block p-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">
                  {app.business_name || app.full_name || 'Unnamed Business'}
                </p>
                <p className="text-sm text-slate-600 truncate">{app.email}</p>
              </div>
              <div className="text-end">
                <p className="text-xs text-slate-500">
                  Applied {new Date(app.wholesale_applied_at).toLocaleDateString()}
                </p>
                <p className="text-xs font-medium text-amber-700">
                  → Review Application
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {applications.length >= 5 && (
        <Link
          to="/admin/customers?filter=pending_wholesale"
          className="block text-center text-sm text-blue-600 hover:text-blue-700 mt-4"
        >
          View all applications →
        </Link>
      )}
    </div>
  );
}