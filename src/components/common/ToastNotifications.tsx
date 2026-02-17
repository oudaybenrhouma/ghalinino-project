/**
 * Toast Notifications Component
 * Ghalinino - Tunisia E-commerce
 *
 * Renders the notification queue from the Zustand store.
 * Placed once at the App level (alongside CartDrawer) so it's visible on
 * every page. The store already handles auto-removal via setTimeout; this
 * component just maps state to UI.
 *
 * Notification types: success | error | warning | info
 */

import { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';
import { useLanguage } from '@/hooks';
import type { Notification } from '@/types';

// ============================================================================
// ICON MAP
// ============================================================================

function NotificationIcon({ type }: { type: Notification['type'] }) {
  if (type === 'success') {
    return (
      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    );
  }
  if (type === 'error') {
    return (
      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    );
  }
  if (type === 'warning') {
    return (
      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}

// ============================================================================
// SINGLE TOAST
// ============================================================================

function Toast({ notification }: { notification: Notification }) {
  const { language } = useLanguage();
  const removeNotification = useStore((s) => s.removeNotification);

  const handleDismiss = useCallback(() => {
    removeNotification(notification.id);
  }, [notification.id, removeNotification]);

  const title =
    typeof notification.title === 'string'
      ? notification.title
      : notification.title[language];

  const message =
    notification.message == null
      ? null
      : typeof notification.message === 'string'
      ? notification.message
      : notification.message[language];

  const borderColor = {
    success: 'border-l-green-500',
    error: 'border-l-red-500',
    warning: 'border-l-amber-500',
    info: 'border-l-blue-500',
  }[notification.type];

  return (
    <div
      className={cn(
        'flex items-start gap-3 bg-white rounded-xl shadow-lg border border-slate-200',
        'border-l-4 px-4 py-3 w-80 max-w-[90vw] pointer-events-auto',
        'animate-in slide-in-from-right-4 duration-300',
        borderColor
      )}
      role="alert"
    >
      <NotificationIcon type={notification.type} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 leading-snug">{title}</p>
        {message && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{message}</p>
        )}
        {notification.action && (
          <button
            onClick={notification.action.onClick}
            className="text-xs text-red-600 hover:text-red-700 font-medium mt-1"
          >
            {typeof notification.action.label === 'string'
              ? notification.action.label
              : notification.action.label[language]}
          </button>
        )}
      </div>

      <button
        onClick={handleDismiss}
        className="shrink-0 p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ============================================================================
// CONTAINER
// ============================================================================

export function ToastNotifications() {
  const notifications = useStore((s) => s.notifications);
  const { isRTL } = useLanguage();

  if (notifications.length === 0) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 z-[60] flex flex-col gap-2 pointer-events-none',
        isRTL ? 'left-4' : 'right-4'
      )}
      aria-live="polite"
      aria-label="Notifications"
    >
      {notifications.map((n) => (
        <Toast key={n.id} notification={n} />
      ))}
    </div>
  );
}