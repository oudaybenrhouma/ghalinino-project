/**
 * Order Timeline Component
 * Visual stepper for order status
 */

import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks';
import type { OrderStatus } from '@/types/database';

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  className?: string;
}

const steps: { id: OrderStatus; icon: string }[] = [
  { id: 'pending', icon: '📝' },
  { id: 'paid', icon: '💰' },
  { id: 'processing', icon: '📦' },
  { id: 'shipped', icon: '🚚' },
  { id: 'delivered', icon: '🏠' },
];

export function OrderTimeline({ currentStatus, className }: OrderTimelineProps) {
  const { language } = useLanguage();

  // Handle cancelled/refunded separately
  if (currentStatus === 'cancelled' || currentStatus === 'refunded') {
    return (
      <div className={cn("p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center", className)}>
        {currentStatus === 'cancelled' 
          ? (language === 'ar' ? 'تم إلغاء هذا الطلب' : 'Cette commande a été annulée')
          : (language === 'ar' ? 'تم استرجاع هذا الطلب' : 'Cette commande a été remboursée')
        }
      </div>
    );
  }

  // Find index of current status
  // Note: 'paid' might be skipped for COD, so logic needs to be flexible.
  // Ideally, backend normalizes this, but here we assume a linear progression for display.
  const currentIndex = steps.findIndex(s => s.id === currentStatus);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  const getLabel = (id: string) => {
    switch(id) {
      case 'pending': return language === 'ar' ? 'تم الطلب' : 'Commandé';
      case 'paid': return language === 'ar' ? 'تم الدفع' : 'Payé';
      case 'processing': return language === 'ar' ? 'تجهيز' : 'Préparation';
      case 'shipped': return language === 'ar' ? 'شحن' : 'Expédition';
      case 'delivered': return language === 'ar' ? 'توصيل' : 'Livraison';
      default: return '';
    }
  };

  return (
    <div className={cn("w-full py-4", className)}>
      <div className="relative flex items-center justify-between">
        {/* Connector Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-green-500 -z-10 transition-all duration-500"
          style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const isCompleted = index <= activeIndex;
          const isCurrent = index === activeIndex;

          return (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <div 
                className={cn(
                  "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base border-2 transition-all duration-300 bg-white",
                  isCompleted 
                    ? "border-green-500 text-green-600 scale-110" 
                    : "border-slate-300 text-slate-300 grayscale"
                )}
              >
                {step.icon}
              </div>
              <span className={cn(
                "text-[10px] md:text-xs font-medium transition-colors duration-300 absolute mt-10 md:mt-12 w-20 text-center",
                isCompleted ? "text-slate-900" : "text-slate-400"
              )}>
                {getLabel(step.id)}
              </span>
            </div>
          );
        })}
      </div>
      {/* Spacer for labels */}
      <div className="h-8 md:h-10" />
    </div>
  );
}
