import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency values
 */
export function formatCurrency(
  amount: number,
  currency: string = 'EUR',
  locale: string = 'en-GB'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format percentage values
 */
export function formatPercentage(
  value: number,
  decimals: number = 2,
  locale: string = 'en-GB'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/**
 * Format decimal as percentage (for values that are already decimal like 0.1882 = 18.82%)
 */
export function formatDecimalAsPercentage(
  value: number,
  decimals: number = 2,
  locale: string = 'en-GB'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format date values
 */
export function formatDate(
  date: Date | string,
  locale: string = 'en-GB',
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(dateObj);
}

/**
 * Calculate percentage allocation validation
 */
export function validateAllocations(allocations: Array<{ percentage: number }>): {
  isValid: boolean;
  total: number;
  errors: string[];
} {
  const total = allocations.reduce((sum, allocation) => sum + allocation.percentage, 0);
  const errors: string[] = [];

  if (Math.abs(total - 100) > 0.01) {
    errors.push(`Total allocation must equal 100%. Current total: ${total.toFixed(2)}%`);
  }

  allocations.forEach((allocation, index) => {
    if (allocation.percentage <= 0) {
      errors.push(`Allocation ${index + 1} must be greater than 0%`);
    }
    if (allocation.percentage > 100) {
      errors.push(`Allocation ${index + 1} cannot exceed 100%`);
    }
  });

  return {
    isValid: errors.length === 0 && Math.abs(total - 100) <= 0.01,
    total,
    errors,
  };
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Generate a slug from a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Calculate annualized return from total return and time period
 */
export function calculateAnnualizedReturn(
  totalReturn: number,
  startDate: Date,
  endDate: Date
): number {
  const yearsDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  if (yearsDiff <= 0) return 0;
  return Math.pow(1 + totalReturn, 1 / yearsDiff) - 1;
}

/**
 * Calculate Sharpe ratio
 */
export function calculateSharpeRatio(
  portfolioReturn: number,
  riskFreeRate: number = 0.02,
  volatility: number
): number {
  if (volatility === 0) return 0;
  return (portfolioReturn - riskFreeRate) / volatility;
}

/**
 * Calculate maximum drawdown from performance data
 */
export function calculateMaxDrawdown(returns: number[]): number {
  let maxDrawdown = 0;
  let peak = 1;
  let cumulativeValue = 1;

  for (const returnValue of returns) {
    cumulativeValue *= (1 + returnValue);
    if (cumulativeValue > peak) {
      peak = cumulativeValue;
    }
    const drawdown = (peak - cumulativeValue) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown;
}

/**
 * Safe number parsing with fallback
 */
export function parseNumber(value: string | number | undefined, fallback: number = 0): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}