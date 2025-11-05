/**
 * @file currency.ts
 * This file contains utility functions related to currency formatting.
 */

/**
 * Formats a number into a currency string for Philippine Peso (PHP).
 * Handles potential non-numeric inputs gracefully by defaulting them to 0.
 * @param value - The number to format.
 * @returns A string representing the value in PHP currency format (e.g., "₱1,234.56").
 */
export const formatCurrency = (value: number) => {
  // Gracefully handle cases where the input is not a valid number.
  if (isNaN(value) || !isFinite(value)) {
    value = 0;
  }
  // Use the Intl.NumberFormat API for robust and locale-aware currency formatting.
  // 'en-PH' is the locale for English in the Philippines.
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(value);
};
