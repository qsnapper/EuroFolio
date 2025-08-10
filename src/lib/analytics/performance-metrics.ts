/**
 * Advanced Performance Metrics Calculations
 * Additional metrics beyond the basic backtesting engine
 */

import { PerformancePoint } from '@/types';

export interface AdvancedMetrics {
  sortinoRatio: number;
  calmarRatio: number;
  downsideDeviation: number;
  uptimePercentage: number;
  averageDrawdownDuration: number;
  maxDrawdownDuration: number;
  recoveryFactor: number;
  gainToLossRatio: number;
}

export interface DrawdownPeriod {
  startDate: string;
  endDate: string;
  peakValue: number;
  troughValue: number;
  drawdownPercentage: number;
  duration: number;
  recovered: boolean;
  recoveryDate?: string;
}

export interface MonthlyReturn {
  year: number;
  month: number;
  monthName: string;
  return: number;
  value: number;
  daysInMonth: number;
}

/**
 * Calculate Sortino Ratio - focuses on downside risk only
 */
export function calculateSortinoRatio(
  performanceData: PerformancePoint[],
  riskFreeRate = 0.02
): number {
  if (!performanceData.length) return 0;

  const dailyReturns = performanceData.slice(1).map(p => p.dailyReturn || 0);
  const annualizedReturn = calculateAnnualizedReturn(performanceData);
  const downsideDeviation = calculateDownsideDeviation(dailyReturns);

  return downsideDeviation > 0 ? (annualizedReturn - riskFreeRate) / downsideDeviation : 0;
}

/**
 * Calculate Calmar Ratio - annualized return divided by maximum drawdown
 */
export function calculateCalmarRatio(
  performanceData: PerformancePoint[],
  maxDrawdown: number
): number {
  if (!performanceData.length || maxDrawdown === 0) return 0;

  const annualizedReturn = calculateAnnualizedReturn(performanceData);
  return Math.abs(annualizedReturn / maxDrawdown);
}

/**
 * Calculate downside deviation - standard deviation of negative returns only
 */
export function calculateDownsideDeviation(dailyReturns: number[]): number {
  const negativeReturns = dailyReturns.filter(r => r < 0);
  
  if (negativeReturns.length === 0) return 0;

  const mean = negativeReturns.reduce((sum, r) => sum + r, 0) / negativeReturns.length;
  const variance = negativeReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / negativeReturns.length;
  const dailyDownsideDeviation = Math.sqrt(variance);
  
  // Annualize (assuming 252 trading days per year)
  return dailyDownsideDeviation * Math.sqrt(252);
}

/**
 * Calculate gain-to-loss ratio
 */
export function calculateGainToLossRatio(dailyReturns: number[]): number {
  const gains = dailyReturns.filter(r => r > 0);
  const losses = dailyReturns.filter(r => r < 0);
  
  if (losses.length === 0) return gains.length > 0 ? Infinity : 0;
  if (gains.length === 0) return 0;

  const averageGain = gains.reduce((sum, r) => sum + r, 0) / gains.length;
  const averageLoss = Math.abs(losses.reduce((sum, r) => sum + r, 0) / losses.length);
  
  return averageGain / averageLoss;
}

/**
 * Analyze all drawdown periods in the performance data
 */
export function analyzeDrawdownPeriods(performanceData: PerformancePoint[]): DrawdownPeriod[] {
  if (!performanceData.length) return [];

  const drawdownPeriods: DrawdownPeriod[] = [];
  let currentPeak = performanceData[0].value;
  let currentPeakDate = performanceData[0].date;
  let inDrawdown = false;
  let drawdownStart = '';
  let drawdownTrough = currentPeak;
  let drawdownTroughDate = '';

  for (let i = 1; i < performanceData.length; i++) {
    const current = performanceData[i];
    
    if (current.value > currentPeak) {
      // New peak reached
      if (inDrawdown) {
        // End current drawdown period
        const drawdownPercentage = (currentPeak - drawdownTrough) / currentPeak;
        const startIndex = performanceData.findIndex(p => p.date === drawdownStart);
        const duration = i - startIndex;

        drawdownPeriods.push({
          startDate: drawdownStart,
          endDate: current.date,
          peakValue: currentPeak,
          troughValue: drawdownTrough,
          drawdownPercentage,
          duration,
          recovered: true,
          recoveryDate: current.date
        });

        inDrawdown = false;
      }
      
      currentPeak = current.value;
      currentPeakDate = current.date;
    } else if (current.value < currentPeak) {
      // In drawdown
      if (!inDrawdown) {
        inDrawdown = true;
        drawdownStart = currentPeakDate;
        drawdownTrough = current.value;
        drawdownTroughDate = current.date;
      } else if (current.value < drawdownTrough) {
        drawdownTrough = current.value;
        drawdownTroughDate = current.date;
      }
    }
  }

  // Handle ongoing drawdown at the end
  if (inDrawdown) {
    const drawdownPercentage = (currentPeak - drawdownTrough) / currentPeak;
    const startIndex = performanceData.findIndex(p => p.date === drawdownStart);
    const duration = performanceData.length - startIndex;

    drawdownPeriods.push({
      startDate: drawdownStart,
      endDate: performanceData[performanceData.length - 1].date,
      peakValue: currentPeak,
      troughValue: drawdownTrough,
      drawdownPercentage,
      duration,
      recovered: false
    });
  }

  return drawdownPeriods;
}

/**
 * Generate monthly returns breakdown
 */
export function generateMonthlyReturns(performanceData: PerformancePoint[]): MonthlyReturn[] {
  if (!performanceData.length) return [];

  const monthlyReturns: MonthlyReturn[] = [];
  const monthlyData: { [key: string]: PerformancePoint[] } = {};

  // Group data by month
  performanceData.forEach(point => {
    const monthKey = point.date.substring(0, 7); // YYYY-MM
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = [];
    }
    monthlyData[monthKey].push(point);
  });

  // Calculate monthly returns
  const sortedMonths = Object.keys(monthlyData).sort();
  
  for (let i = 0; i < sortedMonths.length; i++) {
    const monthKey = sortedMonths[i];
    const monthData = monthlyData[monthKey];
    const [year, month] = monthKey.split('-').map(Number);
    
    let monthlyReturn = 0;
    if (i > 0) {
      const prevMonthData = monthlyData[sortedMonths[i - 1]];
      const prevValue = prevMonthData[prevMonthData.length - 1].value;
      const currValue = monthData[monthData.length - 1].value;
      monthlyReturn = (currValue - prevValue) / prevValue;
    }

    monthlyReturns.push({
      year,
      month,
      monthName: new Date(year, month - 1).toLocaleString('default', { month: 'short' }),
      return: monthlyReturn,
      value: monthData[monthData.length - 1].value,
      daysInMonth: monthData.length
    });
  }

  return monthlyReturns;
}

/**
 * Calculate all advanced metrics
 */
export function calculateAdvancedMetrics(
  performanceData: PerformancePoint[],
  maxDrawdown: number
): AdvancedMetrics {
  if (!performanceData.length) {
    return {
      sortinoRatio: 0,
      calmarRatio: 0,
      downsideDeviation: 0,
      uptimePercentage: 0,
      averageDrawdownDuration: 0,
      maxDrawdownDuration: 0,
      recoveryFactor: 0,
      gainToLossRatio: 0
    };
  }

  const dailyReturns = performanceData.slice(1).map(p => p.dailyReturn || 0);
  const drawdownPeriods = analyzeDrawdownPeriods(performanceData);
  
  const positiveReturns = dailyReturns.filter(r => r > 0).length;
  const uptimePercentage = dailyReturns.length > 0 ? positiveReturns / dailyReturns.length : 0;

  const drawdownDurations = drawdownPeriods.map(d => d.duration);
  const averageDrawdownDuration = drawdownDurations.length > 0 
    ? drawdownDurations.reduce((sum, d) => sum + d, 0) / drawdownDurations.length 
    : 0;
  const maxDrawdownDuration = drawdownDurations.length > 0 
    ? Math.max(...drawdownDurations) 
    : 0;

  const finalValue = performanceData[performanceData.length - 1].value;
  const initialValue = performanceData[0].value;
  const totalReturn = (finalValue - initialValue) / initialValue;
  const recoveryFactor = maxDrawdown > 0 ? totalReturn / maxDrawdown : 0;

  return {
    sortinoRatio: calculateSortinoRatio(performanceData),
    calmarRatio: calculateCalmarRatio(performanceData, maxDrawdown),
    downsideDeviation: calculateDownsideDeviation(dailyReturns),
    uptimePercentage,
    averageDrawdownDuration,
    maxDrawdownDuration,
    recoveryFactor,
    gainToLossRatio: calculateGainToLossRatio(dailyReturns)
  };
}

/**
 * Helper function to calculate annualized return
 */
function calculateAnnualizedReturn(performanceData: PerformancePoint[]): number {
  if (!performanceData.length) return 0;

  const finalValue = performanceData[performanceData.length - 1].value;
  const initialValue = performanceData[0].value;
  const totalReturn = (finalValue - initialValue) / initialValue;
  const totalDays = performanceData.length;
  
  return totalDays > 0 ? Math.pow(1 + totalReturn, 365 / totalDays) - 1 : 0;
}

/**
 * Format risk grade based on Sharpe ratio
 */
export function getRiskGrade(sharpeRatio: number): {
  grade: string;
  description: string;
  color: string;
} {
  if (sharpeRatio >= 2.0) {
    return { grade: 'A+', description: 'Excellent', color: 'text-green-700' };
  } else if (sharpeRatio >= 1.5) {
    return { grade: 'A', description: 'Very Good', color: 'text-green-600' };
  } else if (sharpeRatio >= 1.0) {
    return { grade: 'B+', description: 'Good', color: 'text-green-500' };
  } else if (sharpeRatio >= 0.5) {
    return { grade: 'B', description: 'Fair', color: 'text-yellow-600' };
  } else if (sharpeRatio >= 0.0) {
    return { grade: 'C', description: 'Poor', color: 'text-orange-600' };
  } else {
    return { grade: 'D', description: 'Very Poor', color: 'text-red-600' };
  }
}