/**
 * Order Status Badge Component
 * Color-coded badge for order statuses
 */

import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks';
import { ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from '@/lib/orderMessages';
import type { OrderStatus, PaymentStatus } from '@/types/database';

interface OrderStatusBadgeProps {
  status: OrderStatus | PaymentStatus;
  type?: 'order' | 'payment';
  className?: string;
  size?: 'sm' | 'md';
}

export function OrderStatusBadge({ 
  status, 
  type = 'order', 
  className,
  size = 'md' 
}: OrderStatusBadgeProps) {
  const { language } = useLanguage();

  const config = type === 'order' 
    ? ORDER_STATUS_CONFIG[status as OrderStatus] 
    : PAYMENT_STATUS_CONFIG[status as PaymentStatus];

  // Fallback if invalid status
  if (!config) return null;

  const colorClasses = {
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    slate: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
  };

  // @ts-ignore - color is guaranteed to be one of the keys
  const colorStyle = colorClasses[config.color] || colorClasses.slate;

  return (
    <span className={cn(
      'inline-flex items-center rounded-full border font-medium',
      colorStyle,
      sizeClasses[size],
      className
    )}>
      {type === 'order' 
        ? (config as any).label[language] 
        : (config as any).label[language]
      }
    </span>
  );
}
