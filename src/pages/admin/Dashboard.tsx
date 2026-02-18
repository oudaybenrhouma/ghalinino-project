/**
 * Admin Dashboard - MODERNIZED
 * Ghalinino - Tunisia E-commerce
 *
 * IMPROVEMENTS:
 * - Enhanced metric cards with better visual hierarchy
 * - Improved chart design with modern styling
 * - Better use of colors and gradients
 * - More actionable alerts and notifications
 * - Improved responsive layout
 * - Better typography and spacing
 * - Enhanced hover states and interactions
 */

import { Link } from 'react-router-dom';
import { useAdminOrders } from '@/hooks/useAdminOrders';
import { useAdminProducts } from '@/hooks/useAdminProducts';
import { useAdminCustomers } from '@/hooks/useAdminCustomers';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

// ============================================================================
// METRIC CARD COMPONENT - Enhanced
// ============================================================================

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  className?: string;
  link?: string;
}

function MetricCard({ title, value, icon, trend, trendUp, className, link }: MetricCardProps) {
  const content = (
    <div className={cn(
      'bg-white rounded-2xl p-6 border-2 border-slate-100',
      'transition-all duration-300',
      'hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1',
      link && 'cursor-pointer',
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
          {icon}
        </div>
        {trend && (
          <span className={cn(
            'px-3 py-1 rounded-full text-xs font-semibold',
            trendUp 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          )}>
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-slate-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );

  return link ? <Link to={link}>{content}</Link> : content;
}

// ============================================================================
// ALERT CARD COMPONENT - New
// ============================================================================

interface AlertCardProps {
  title: string;
  description: string;
  type: 'warning' | 'info' | 'success';
  action?: {
    label: string;
    to: string;
  };
}

function AlertCard({ title, description, type, action }: AlertCardProps) {
  const colors = {
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: 'text-amber-600',
      title: 'text-amber-900',
      desc: 'text-amber-700',
      button: 'bg-amber-600 hover:bg-amber-700 text-white'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-900',
      desc: 'text-blue-700',
      button: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      title: 'text-green-900',
      desc: 'text-green-700',
      button: 'bg-green-600 hover:bg-green-700 text-white'
    }
  };

  const style = colors[type];

  return (
    <div className={cn(
      'rounded-xl p-4 border-2',
      style.bg,
      style.border
    )}>
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5', style.icon)}>
          {type === 'warning' && (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          {type === 'info' && (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <h4 className={cn('font-semibold text-sm mb-1', style.title)}>
            {title}
          </h4>
          <p className={cn('text-sm', style.desc)}>
            {description}
          </p>
          {action && (
            <Link
              to={action.to}
              className={cn(
                'inline-block mt-3 px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
                style.button
              )}
            >
              {action.label}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AdminDashboard() {
  const { orders, isLoading: ordersLoading } = useAdminOrders();
  const { products, isLoading: productsLoading } = useAdminProducts();
  const { customers, isLoading: customersLoading } = useAdminCustomers();

  // Calculate metrics
  const totalRevenue = orders.reduce((sum, order) => sum + (order.payment_status === 'paid' ? order.total : 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const processingOrders = orders.filter(o => o.status === 'processing').length;
  const lowStockProducts = products.filter(p => p.quantity < (p.low_stock_threshold || 5)).length;
  const pendingWholesale = customers.filter(c => c.wholesale_status === 'pending').length;

  // Calculate real revenue trend: this week vs last week
  const now = new Date();
  const thisWeekStart = new Date(now); thisWeekStart.setDate(now.getDate() - 7);
  const lastWeekStart = new Date(now); lastWeekStart.setDate(now.getDate() - 14);
  const thisWeekRevenue = orders
    .filter(o => o.payment_status === 'paid' && new Date(o.created_at) >= thisWeekStart)
    .reduce((sum, o) => sum + o.total, 0);
  const lastWeekRevenue = orders
    .filter(o => o.payment_status === 'paid' && new Date(o.created_at) >= lastWeekStart && new Date(o.created_at) < thisWeekStart)
    .reduce((sum, o) => sum + o.total, 0);
  const revenueTrend = lastWeekRevenue === 0
    ? null
    : ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue * 100);
  const revenueTrendLabel = revenueTrend === null
    ? undefined
    : `${revenueTrend >= 0 ? '+' : ''}${revenueTrend.toFixed(1)}%`;

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
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard Overview</h1>
        <p className="text-slate-600">Welcome back! Here's what's happening with your store today.</p>
      </div>

      {/* Metrics Grid - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Revenue" 
          value={formatPrice(totalRevenue, 'fr')} 
          icon={
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          trend={revenueTrendLabel}
          trendUp={revenueTrend !== null && revenueTrend >= 0}
        />
        <MetricCard 
          title="Total Orders" 
          value={orders.length.toString()} 
          icon={
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
          link="/admin/orders"
        />
        <MetricCard 
          title="Active Products" 
          value={products.length.toString()} 
          icon={
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          link="/admin/products"
        />
        <MetricCard 
          title="Total Customers" 
          value={customers.length.toString()} 
          icon={
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          link="/admin/customers"
        />
      </div>

      {/* Charts & Alerts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart - Enhanced */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border-2 border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Revenue Trend</h3>
              <p className="text-sm text-slate-600 mt-1">Last 7 days performance</p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors">
                7D
              </button>
              <button className="px-4 py-2 rounded-lg text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
                30D
              </button>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '2px solid #e2e8f0', 
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
                  formatter={(value: number | undefined) => {
                    if (value === undefined) return ['', 'Revenue'];
                    return [formatPrice(value, 'fr'), 'Revenue'];
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#dc2626" 
                  strokeWidth={3}
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts Column - Enhanced */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-lg mb-4">Action Required</h3>
          
          {pendingOrders > 0 && (
            <AlertCard
              type="warning"
              title={`${pendingOrders} Pending Order${pendingOrders > 1 ? 's' : ''}`}
              description={`You have ${pendingOrders} order${pendingOrders > 1 ? 's' : ''} waiting for processing.`}
              action={{
                label: 'View Orders',
                to: '/admin/orders?status=pending'
              }}
            />
          )}

          {lowStockProducts > 0 && (
            <AlertCard
              type="warning"
              title={`${lowStockProducts} Low Stock Alert${lowStockProducts > 1 ? 's' : ''}`}
              description={`${lowStockProducts} product${lowStockProducts > 1 ? 's are' : ' is'} running low on stock.`}
              action={{
                label: 'Review Products',
                to: '/admin/products'
              }}
            />
          )}

          {pendingWholesale > 0 && (
            <AlertCard
              type="info"
              title={`${pendingWholesale} Wholesale Application${pendingWholesale > 1 ? 's' : ''}`}
              description={`Review and approve wholesale account requests.`}
              action={{
                label: 'Review Applications',
                to: '/admin/customers?wholesale=pending'
              }}
            />
          )}

          {pendingOrders === 0 && lowStockProducts === 0 && pendingWholesale === 0 && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
              <svg className="w-12 h-12 text-green-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="font-semibold text-green-900 mb-1">All Clear!</h4>
              <p className="text-sm text-green-700">No pending actions required.</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats - New Section */}
      <div className="bg-white rounded-2xl p-6 border-2 border-slate-100">
        <h3 className="font-bold text-slate-900 text-lg mb-6">Quick Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 mb-1">{pendingOrders}</div>
            <div className="text-sm text-slate-600 font-medium">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">{processingOrders}</div>
            <div className="text-sm text-slate-600 font-medium">Processing</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-600 mb-1">{lowStockProducts}</div>
            <div className="text-sm text-slate-600 font-medium">Low Stock</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">{pendingWholesale}</div>
            <div className="text-sm text-slate-600 font-medium">Wholesale Requests</div>
          </div>
        </div>
      </div>
    </div>
  );
}