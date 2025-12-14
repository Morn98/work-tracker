import { useEffect, useState, useCallback } from 'react';
import type { Toast as ToastType } from '../../types/toast';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

const toastStyles = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-200',
    icon: '✅',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    icon: '❌',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-200',
    icon: '⚠️',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
    icon: 'ℹ️',
  },
};

export const Toast = ({ toast, onDismiss }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const style = toastStyles[toast.type];

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 300);
  }, [toast.id, onDismiss]);

  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.duration, handleDismiss]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        flex items-center gap-3 min-w-[320px] max-w-md p-4
        border rounded-lg shadow-lg
        transform transition-all duration-300 ease-in-out
        pointer-events-auto
        ${style.bg} ${style.border} ${style.text}
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <span className="text-xl flex-shrink-0">{style.icon}</span>
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={handleDismiss}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0 w-6 h-6 flex items-center justify-center"
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
};
