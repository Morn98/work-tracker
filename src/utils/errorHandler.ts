/**
 * Toast notification utilities
 * Provides user-friendly toast notifications
 */

import type { useToast } from '../contexts/ToastContext';

let toastInstance: ReturnType<typeof useToast> | null = null;

/**
 * Initialize the toast handler with the toast context
 * This is called once when the app initializes
 */
export const initToastHandler = (toastContext: ReturnType<typeof useToast>) => {
  toastInstance = toastContext;
};

/**
 * Show an error message to the user
 */
export const showError = (message: string): void => {
  if (toastInstance) {
    toastInstance.addToast('error', message);
  } else {
    console.error(message);
    alert(message);
  }
};

/**
 * Show a success message to the user
 */
export const showSuccess = (message: string): void => {
  if (toastInstance) {
    toastInstance.addToast('success', message);
  } else {
    console.log(message);
    alert(message);
  }
};

/**
 * Show a warning message to the user
 */
export const showWarning = (message: string): void => {
  if (toastInstance) {
    toastInstance.addToast('warning', message);
  } else {
    console.warn(message);
    alert(message);
  }
};

/**
 * Show an info message to the user
 */
export const showInfo = (message: string): void => {
  if (toastInstance) {
    toastInstance.addToast('info', message);
  } else {
    console.info(message);
    alert(message);
  }
};
