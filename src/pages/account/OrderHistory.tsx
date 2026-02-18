/**
 * Order History Page — Redesigned
 * Card-based mobile-friendly layout with search, filters, reorder & empty state
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '@/hooks/useOrders';
import { useLanguage } from '@/hooks';
import { Button } from '@/components/common';
import { formatPrice, cn } from '@/lib/utils';
import type { OrderStatus } from '@/types/database';
import { AccountLayout } from '@/components/layout';

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
    </svg>
  );
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}

// ─── Status Config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, {
  label: { ar: string; fr: string };
  color: string;
  bg: string;
  dot: string;
  icon: string;
}> = {
  pending:         { label: { ar: 'في الانتظار', fr: 'En attente' },       color: 'text-amber-700',  bg: 'bg-amber-50  border-amber-200',  dot: 'bg-amber-400',  icon: '🕐' },
  payment_pending: { label: { ar: 'انتظار الدفع', fr: 'Paiement en attente'}, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', dot: 'bg-orange-400', icon: '💳' },
  paid:            { label: { ar: 'مدفوع', fr: 'Payé' },                   color: 'text-blue-700',   bg: 'bg-blue-50   border-blue-200',   dot: 'bg-blue-400',   icon: '✅' },
  processing:      { label: { ar: 'قيد التجهيز', fr: 'En préparation' },   color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', dot: 'bg-purple-400', icon: '📦' },
  shipped:         { label: { ar: 'تم الشحن', fr: 'Expédié' },             color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200', dot: 'bg-indigo-400', icon: '🚚' },
  delivered:       { label: { ar: 'تم التوصيل', fr: 'Livré' },             color: 'text-green-700',  bg: 'bg-green-50  border-green-200',  dot: 'bg-green-400',  icon: '🏠' },
  cancelled:       { label: { ar: 'ملغي', fr: 'Annulé' },                  color: 'text-red-700',    bg: 'bg-red-50    border-red-200',    dot: 'bg-red-400',    icon: '✕' },
  refunded:        { label: { ar: 'مسترجع', fr: 'Remboursé' },             color: 'text-slate-700',  bg: 'bg-slate-50  border-slate-200',  dot: 'bg-slate-400',  icon: '↩' },
};

function StatusBadge({ status, language }: { status: string; language: 'ar' | 'fr' }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['pending'];
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border', cfg.bg, cfg.color)}>
      <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', cfg.dot)} />
      {cfg.label[language]}
    </span>
  );
}

// ─── Quick Filter Pills ────────────────────────────────────────────────────────

const QUICK_FILTERS: { key: OrderStatus | 'all' | 'recent'; label: { ar: string; fr: string } }[] = [
  { key: 'all',       label: { ar: 'الكل', fr: 'Tous' } },
  { key: 'recent',    label: { ar: 'الأخيرة', fr: 'Récentes' } },
  { key: 'pending',   label: { ar: 'في الانتظار', fr: 'En attente' } },
  { key: 'processing',label: { ar: 'قيد التجهيز', fr: 'En préparation' } },
  { key: 'shipped',   label: { ar: 'تم الشحن', fr: 'Expédié' } },
  { key: 'delivered', label: { ar: 'مُسلَّم', fr: 'Livré' } },
  { key: 'cancelled', label: { ar: 'ملغي', fr: 'Annulé' } },
];

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ language }: { language: 'ar' | 'fr' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center mb-6 shadow-inner">
        <PackageIcon className="w-10 h-10 text-red-400" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">
        {language === 'ar' ? 'لا توجد طلبات بعد' : 'Aucune commande trouvée'}
      </h3>
      <p className="text-slate-500 text-sm mb-8 max-w-xs leading-relaxed">
        {language === 'ar'
          ? 'استكشف منتجاتنا وابدأ تجربة التسوق مع غالينينو'
          : 'Explorez nos produits et commencez votre expérience avec Ghalinino'}
      </p>
      <Link to="/products">
        <Button className="bg-red-600 hover:bg-red-700 text-white rounded-full px-8 py-2.5 font-semibold shadow-md shadow-red-200 transition-all hover:shadow-lg hover:shadow-red-200">
          {language === 'ar' ? 'تصفح المنتجات' : 'Parcourir les produits'}
        </Button>
      </Link>
    </div>
  );
}

// ─── Order Card ────────────────────────────────────────────────────────────────

function OrderCard({ order, language }: { order: any; language: 'ar' | 'fr' }) {
  const itemCount = order.items?.length ?? 0;
  const firstImage = order.items?.[0]?.product_snapshot?.image;
  const isRTL = language === 'ar';

  const canTrack = ['shipped', 'processing'].includes(order.status);
  const canReorder = ['delivered', 'cancelled'].includes(order.status);
  const canInvoice = ['paid', 'delivered', 'processing', 'shipped'].includes(order.status);

  return (
    <div className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-red-100 transition-all duration-200 overflow-hidden">
      {/* Card top accent for shipped/delivered */}
      {order.status === 'shipped' && (
        <div className="h-0.5 bg-gradient-to-r from-indigo-400 to-purple-400" />
      )}
      {order.status === 'delivered' && (
        <div className="h-0.5 bg-gradient-to-r from-green-400 to-emerald-400" />
      )}

      <div className="p-4 sm:p-5">
        {/* Top row: order # + status */}
        <div className={cn('flex items-start justify-between gap-3 mb-3', isRTL && 'flex-row-reverse')}>
          <div className={cn(isRTL && 'text-right')}>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-0.5">
              {language === 'ar' ? 'رقم الطلب' : 'Commande'}
            </p>
            <p className="font-mono font-bold text-slate-800 text-base">{order.order_number}</p>
          </div>
          <StatusBadge status={order.status} language={language} />
        </div>

        {/* Product preview strip */}
        {order.items && order.items.length > 0 && (
          <div className={cn('flex gap-2 mb-4', isRTL && 'flex-row-reverse')}>
            {order.items.slice(0, 4).map((item: any, i: number) => (
              <div key={i} className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                {item.product_snapshot?.image ? (
                  <img
                    src={item.product_snapshot.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <PackageIcon className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}
            {itemCount > 4 && (
              <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-slate-500">+{itemCount - 4}</span>
              </div>
            )}
          </div>
        )}

        {/* Date + Items count */}
        <div className={cn('flex items-center gap-3 text-xs text-slate-500 mb-4', isRTL && 'flex-row-reverse')}>
          <span>
            {new Date(order.created_at).toLocaleDateString(
              language === 'ar' ? 'ar-TN' : 'fr-TN',
              { year: 'numeric', month: 'short', day: 'numeric' }
            )}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>
            {itemCount} {language === 'ar'
              ? (itemCount === 1 ? 'منتج' : 'منتجات')
              : (itemCount === 1 ? 'article' : 'articles')}
          </span>
        </div>

        {/* Bottom row: total + actions */}
        <div className={cn('flex items-center justify-between gap-3', isRTL && 'flex-row-reverse')}>
          <div className={isRTL ? 'text-right' : ''}>
            <p className="text-xs text-slate-400 mb-0.5">
              {language === 'ar' ? 'المجموع' : 'Total'}
            </p>
            <p className="font-bold text-red-600 text-lg leading-none">
              {formatPrice(order.total, language)}
            </p>
          </div>

          <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
            {/* Reorder button */}
            {canReorder && (
              <button
                title={language === 'ar' ? 'إعادة الطلب' : 'Commander à nouveau'}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all"
                onClick={(e) => { e.preventDefault(); /* trigger reorder logic */ }}
              >
                <RefreshIcon className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Track button */}
            {canTrack && (
              <button
                title={language === 'ar' ? 'تتبع الطلب' : 'Suivre le colis'}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                onClick={(e) => { e.preventDefault(); /* open tracking */ }}
              >
                <TruckIcon className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Invoice download */}
            {canInvoice && (
              <button
                title={language === 'ar' ? 'تحميل الفاتورة' : 'Télécharger la facture'}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:border-green-300 hover:text-green-600 hover:bg-green-50 transition-all"
                onClick={(e) => { e.preventDefault(); /* download invoice */ }}
              >
                <DownloadIcon className="w-3.5 h-3.5" />
              </button>
            )}

            {/* View details */}
            <Link to={`/account/orders/${order.id}`}>
              <button className={cn(
                'flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-full transition-all',
                'bg-slate-900 text-white hover:bg-red-600 shadow-sm'
              )}>
                {language === 'ar' ? 'التفاصيل' : 'Détails'}
                <ChevronRightIcon className={cn('w-3.5 h-3.5', isRTL && 'rotate-180')} />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-4 w-28 bg-slate-200 rounded" />
        <div className="h-6 w-20 bg-slate-200 rounded-full" />
      </div>
      <div className="flex gap-2 mb-4">
        {[1,2,3].map(i => <div key={i} className="w-12 h-12 bg-slate-200 rounded-lg" />)}
      </div>
      <div className="flex justify-between items-center">
        <div className="h-6 w-24 bg-slate-200 rounded" />
        <div className="h-8 w-24 bg-slate-200 rounded-full" />
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function OrderHistoryPage() {
  const { orders, isLoading, error } = useOrders();
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const [filter, setFilter] = useState<OrderStatus | 'all' | 'recent'>('all');
  const [search, setSearch] = useState('');

  const filteredOrders = useMemo(() => {
    let result = orders ?? [];

    // Quick filter
    if (filter === 'recent') {
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
      result = result.filter(o => new Date(o.created_at).getTime() > cutoff);
    } else if (filter !== 'all') {
      result = result.filter(o => o.status === filter);
    }

    // Search by order number
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(o => o.order_number.toLowerCase().includes(q));
    }

    return result;
  }, [orders, filter, search]);

  if (error) {
    return (
      <AccountLayout>
        <div className="text-center py-16">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            {language === 'ar' ? 'إعادة المحاولة' : 'Réessayer'}
          </Button>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className={cn('mb-6', isRTL && 'text-right')}>
          <h1 className="text-2xl font-bold text-slate-900">
            {language === 'ar' ? 'طلباتي' : 'Mes Commandes'}
          </h1>
          {!isLoading && orders && (
            <p className="text-sm text-slate-500 mt-1">
              {orders.length} {language === 'ar'
                ? (orders.length === 1 ? 'طلب' : 'طلبات')
                : (orders.length === 1 ? 'commande' : 'commandes')}
            </p>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <SearchIcon className={cn(
            'absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none',
            isRTL ? 'right-3.5' : 'left-3.5'
          )} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={language === 'ar' ? 'ابحث برقم الطلب...' : 'Rechercher par référence...'}
            dir={isRTL ? 'rtl' : 'ltr'}
            className={cn(
              'w-full bg-white border border-slate-200 rounded-xl py-2.5 text-sm text-slate-800 placeholder-slate-400',
              'focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all',
              isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'
            )}
          />
        </div>

        {/* Quick Filters */}
        <div className={cn('flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none', isRTL && 'flex-row-reverse')}>
          {QUICK_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border',
                filter === f.key
                  ? 'bg-red-600 text-white border-red-600 shadow-sm shadow-red-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-red-300 hover:text-red-600'
              )}
            >
              {f.label[language]}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : filteredOrders.length === 0 ? (
          <EmptyState language={language} />
        ) : (
          <div className="space-y-3">
            {filteredOrders.map(order => (
              <OrderCard key={order.id} order={order} language={language} />
            ))}
          </div>
        )}
      </div>
    </AccountLayout>
  );
}