import { createPortal } from 'react-dom';
import { Toast } from './Toast';
import { useToast } from '../../contexts/ToastContext';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return createPortal(
    <div
      className="fixed top-4 right-4 left-4 sm:left-auto z-50 flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>,
    document.body
  );
};
