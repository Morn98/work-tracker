import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Toast, ToastType } from '../types/toast';
import {
  TOAST_DURATION_SUCCESS,
  TOAST_DURATION_ERROR,
  TOAST_DURATION_DEFAULT,
  TOAST_MAX_VISIBLE,
} from '../constants';
import { ToastContainer } from '../components/ui/ToastContainer';

interface ToastContextType {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const getDefaultDuration = (type: ToastType): number => {
  switch (type) {
    case 'error':
      return TOAST_DURATION_ERROR;
    case 'success':
      return TOAST_DURATION_SUCCESS;
    default:
      return TOAST_DURATION_DEFAULT;
  }
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: ToastType, message: string, duration?: number): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const toast: Toast = {
      id,
      type,
      message,
      duration: duration !== undefined ? duration : getDefaultDuration(type),
      createdAt: Date.now(),
    };

    setToasts((prev) => {
      const updated = [...prev, toast];
      return updated.slice(-TOAST_MAX_VISIBLE);
    });

    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAllToasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
