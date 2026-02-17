/**
 * Checkout Progress Indicator
 * Ghalinino - Tunisia E-commerce
 * 
 * Multi-step progress bar for checkout flow.
 */

import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks';

// ============================================================================
// TYPES
// ============================================================================

export type CheckoutStep = 'auth' | 'shipping' | 'payment' | 'review';

interface CheckoutProgressProps {
  currentStep: CheckoutStep;
  completedSteps: CheckoutStep[];
  onStepClick?: (step: CheckoutStep) => void;
}

// ============================================================================
// TRANSLATIONS
// ============================================================================

const steps: { id: CheckoutStep; ar: string; fr: string; icon: string }[] = [
  { id: 'auth', ar: 'الحساب', fr: 'Compte', icon: 'user' },
  { id: 'shipping', ar: 'التوصيل', fr: 'Livraison', icon: 'truck' },
  { id: 'payment', ar: 'الدفع', fr: 'Paiement', icon: 'card' },
  { id: 'review', ar: 'المراجعة', fr: 'Confirmation', icon: 'check' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function CheckoutProgress({
  currentStep,
  completedSteps,
  onStepClick,
}: CheckoutProgressProps) {
  const { language, isRTL } = useLanguage();

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <nav aria-label={language === 'ar' ? 'خطوات الدفع' : 'Étapes de paiement'}>
      <ol className="flex items-center w-full">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === currentStep;
          const isClickable = isCompleted || (onStepClick && index <= currentStepIndex);

          return (
            <li
              key={step.id}
              className={cn(
                'flex items-center',
                index < steps.length - 1 && 'flex-1'
              )}
            >
              {/* Step button */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick?.(step.id)}
                disabled={!isClickable}
                className={cn(
                  'flex items-center gap-2 group',
                  isClickable && 'cursor-pointer',
                  !isClickable && 'cursor-default'
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {/* Step circle */}
                <span
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full',
                    'border-2 transition-colors duration-200',
                    isCompleted
                      ? 'bg-green-600 border-green-600 text-white'
                      : isCurrent
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'bg-slate-100 border-slate-300 text-slate-400',
                    isClickable &&
                      !isCurrent &&
                      !isCompleted &&
                      'group-hover:border-red-300'
                  )}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <StepIcon icon={step.icon} />
                  )}
                </span>

                {/* Step label */}
                <span
                  className={cn(
                    'hidden sm:block text-sm font-medium transition-colors',
                    isCompleted
                      ? 'text-green-600'
                      : isCurrent
                        ? 'text-red-600'
                        : 'text-slate-500',
                    isClickable && !isCurrent && !isCompleted && 'group-hover:text-red-600'
                  )}
                >
                  {language === 'ar' ? step.ar : step.fr}
                </span>
              </button>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 sm:mx-4',
                    isCompleted ? 'bg-green-600' : 'bg-slate-200',
                    isRTL && 'order-first'
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ============================================================================
// STEP ICONS
// ============================================================================

function StepIcon({ icon }: { icon: string }) {
  switch (icon) {
    case 'user':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      );
    case 'truck':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
          />
        </svg>
      );
    case 'card':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      );
    case 'check':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    default:
      return <span className="text-sm font-bold">{icon}</span>;
  }
}
