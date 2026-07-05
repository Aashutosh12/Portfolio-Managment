import type { CurrencyType } from '../types';

/**
 * Formats a number as a localized currency string
 */
export function formatCurrency(amount: number, currency: CurrencyType): string {
  const isINR = currency === 'INR';
  
  if (isINR) {
    // Custom Indian formatting (Lakhs, Crores)
    // Example: 1234567 -> 12,34,567
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
    return formatter.format(amount);
  } else {
    // Standard western formatting
    const formatter = new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'de-DE', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    });
    return formatter.format(amount);
  }
}

/**
 * Formats large amounts compactly
 * e.g., ₹1.2 Cr, $500K
 */
export function formatCompactCurrency(amount: number, currency: CurrencyType): string {
  const isINR = currency === 'INR';
  
  if (isINR) {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)} K`;
    }
    return `₹${amount.toFixed(0)}`;
  } else {
    const symbol = currency === 'USD' ? '$' : '€';
    if (amount >= 1000000) {
      return `${symbol}${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `${symbol}${(amount / 1000).toFixed(1)}K`;
    }
    return `${symbol}${amount.toFixed(0)}`;
  }
}

/**
 * Formats percentage
 */
export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(2)}%`;
}

/**
 * Formats standard date YYYY-MM-DD to readable format
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
