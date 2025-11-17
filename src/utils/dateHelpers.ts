/**
 * Date utility functions for time tracking calculations
 */

/**
 * Get the start of the week (Monday) for a given date
 * @param date - The date to calculate the week start for
 * @returns Date object set to the start of the week (Monday, 00:00:00)
 */
export const getWeekStart = (date: Date): Date => {
  const weekStart = new Date(date);
  const dayOfWeek = weekStart.getDay();
  // Adjust when day is Sunday (0) to get previous Monday
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  weekStart.setDate(weekStart.getDate() + daysToMonday);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

/**
 * Get the end of the week (Sunday) for a given date
 * @param date - The date to calculate the week end for
 * @returns Date object set to the end of the week (Sunday, 23:59:59)
 */
export const getWeekEnd = (date: Date): Date => {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
};

/**
 * Get the start of the month for a given date
 * @param date - The date to calculate the month start for
 * @returns Date object set to the first day of the month (00:00:00)
 */
export const getMonthStart = (date: Date): Date => {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);
  return monthStart;
};

/**
 * Get the end of the month for a given date
 * @param date - The date to calculate the month end for
 * @returns Date object set to the last day of the month (23:59:59)
 */
export const getMonthEnd = (date: Date): Date => {
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);
  return monthEnd;
};

/**
 * Check if a date is today
 * @param date - The date to check
 * @returns True if the date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Get the start of today (00:00:00)
 * @returns Date object set to the start of today
 */
export const getTodayStart = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};


