/**
 * Simple error handling utilities
 * Provides user-friendly error messages instead of raw alerts
 */

/**
 * Show an error message to the user
 * In a production app, this could be replaced with a toast notification system
 */
export const showError = (message: string): void => {
  // For now, use alert as a simple solution
  // In production, replace with a proper toast/notification system
  alert(message);
};

/**
 * Show a success message to the user
 * In a production app, this could be replaced with a toast notification system
 */
export const showSuccess = (message: string): void => {
  // For now, use alert as a simple solution
  // In production, replace with a proper toast/notification system
  alert(message);
};

