/**
 * Portfolio Backtesting Engine
 * Core logic for historical portfolio performance analysis
 */

import { PriceData, PortfolioAllocation, PerformancePoint } from '@/types';

export interface BacktestParams {
  portfolioId: string;
  startDate: Date;
  endDate: Date;
  initialInvestment: number;
  rebalanceFrequency: 'NEVER' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
}

export interface BacktestResult {
  portfolioId: string;
  startDate: string;
  endDate: string;
  initialInvestment: number;
  finalValue: number;
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalDays: number;
  performanceData: PerformancePoint[];
  monthlyReturns: number[];
  yearlyReturns: Array<{ year: number; return: number }>;
  bestMonth: { date: string; return: number };
  worstMonth: { date: string; return: number };
  positiveMonths: number;
  negativeMonths: number;
  winRate: number;
}

export interface AssetPriceMap {
  [assetId: string]: PriceData[];
}

export class BacktestEngine {
  /**
   * Run a complete backtest for a portfolio
   */
  async runBacktest(
    allocations: PortfolioAllocation[],
    priceDataMap: AssetPriceMap,
    params: BacktestParams
  ): Promise<BacktestResult> {
    // Validate inputs
    this.validateInputs(allocations, priceDataMap, params);

    // Get date range for calculations
    const dateRange = this.getDateRange(params.startDate, params.endDate);
    
    // Calculate daily portfolio values
    const performanceData = this.calculateDailyPerformance(
      allocations,
      priceDataMap,
      dateRange,
      params.initialInvestment,
      params.rebalanceFrequency
    );

    // Calculate performance metrics
    const metrics = this.calculatePerformanceMetrics(performanceData, params.initialInvestment);
    
    return {
      portfolioId: params.portfolioId,
      startDate: params.startDate.toISOString().split('T')[0],
      endDate: params.endDate.toISOString().split('T')[0],
      initialInvestment: params.initialInvestment,
      finalValue: performanceData[performanceData.length - 1]?.value || params.initialInvestment,
      ...metrics,
      performanceData,
      totalDays: performanceData.length
    };
  }

  private validateInputs(
    allocations: PortfolioAllocation[],
    priceDataMap: AssetPriceMap,
    params: BacktestParams
  ) {
    if (!allocations.length) {
      throw new Error('Portfolio must have at least one allocation');
    }

    const totalAllocation = allocations.reduce((sum, a) => sum + a.percentage, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      throw new Error('Portfolio allocations must sum to 100%');
    }

    if (params.initialInvestment <= 0) {
      throw new Error('Initial investment must be greater than 0');
    }

    if (params.startDate >= params.endDate) {
      throw new Error('Start date must be before end date');
    }

    // Ensure we have price data for all allocated assets
    for (const allocation of allocations) {
      if (!priceDataMap[allocation.asset_id] || priceDataMap[allocation.asset_id].length === 0) {
        throw new Error(`No price data found for asset ${allocation.asset_id}`);
      }
    }
  }

  private getDateRange(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }

  private calculateDailyPerformance(
    allocations: PortfolioAllocation[],
    priceDataMap: AssetPriceMap,
    dateRange: Date[],
    initialInvestment: number,
    rebalanceFrequency: string
  ): PerformancePoint[] {
    const performanceData: PerformancePoint[] = [];
    let portfolioValue = initialInvestment;
    let previousValue = initialInvestment;
    let shares: Record<string, number> = {};

    // Initialize shares based on initial allocation
    this.initializeShares(allocations, priceDataMap, initialInvestment, shares, dateRange[0]);

    for (let i = 0; i < dateRange.length; i++) {
      const currentDate = dateRange[i];
      const dateStr = currentDate.toISOString().split('T')[0];

      // Check if we should rebalance
      if (this.shouldRebalance(currentDate, dateRange[0], rebalanceFrequency) && i > 0) {
        portfolioValue = this.calculatePortfolioValue(shares, priceDataMap, currentDate);
        this.rebalancePortfolio(allocations, priceDataMap, portfolioValue, shares, currentDate);
      }

      // Calculate current portfolio value
      portfolioValue = this.calculatePortfolioValue(shares, priceDataMap, currentDate);
      
      // Calculate daily return
      const dailyReturn = i > 0 ? (portfolioValue - previousValue) / previousValue : 0;
      const cumulativeReturn = (portfolioValue - initialInvestment) / initialInvestment;

      performanceData.push({
        date: dateStr,
        value: portfolioValue,
        dailyReturn,
        cumulativeReturn
      });

      previousValue = portfolioValue;
    }

    return performanceData;
  }

  private initializeShares(
    allocations: PortfolioAllocation[],
    priceDataMap: AssetPriceMap,
    initialInvestment: number,
    shares: Record<string, number>,
    startDate: Date
  ) {
    const startDateStr = startDate.toISOString().split('T')[0];
    console.log(`\nInitializing shares for ${startDateStr} with ${initialInvestment} initial investment:`);
    
    for (const allocation of allocations) {
      const price = this.getPrice(priceDataMap[allocation.asset_id], startDate);
      if (price) {
        const investmentAmount = (allocation.percentage / 100) * initialInvestment;
        shares[allocation.asset_id] = investmentAmount / price;
        console.log(`Asset ${allocation.asset_id}: ${allocation.percentage}% = €${investmentAmount} @ ${price} = ${shares[allocation.asset_id].toFixed(4)} shares`);
      } else {
        console.log(`Asset ${allocation.asset_id}: No price found for ${startDateStr}`);
      }
    }
    console.log('Initial shares calculated:', shares);
  }

  private shouldRebalance(currentDate: Date, startDate: Date, frequency: string): boolean {
    if (frequency === 'NEVER') return false;

    const daysDiff = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    switch (frequency) {
      case 'MONTHLY':
        return daysDiff % 30 === 0;
      case 'QUARTERLY':
        return daysDiff % 90 === 0;
      case 'ANNUALLY':
        return daysDiff % 365 === 0;
      default:
        return false;
    }
  }

  private rebalancePortfolio(
    allocations: PortfolioAllocation[],
    priceDataMap: AssetPriceMap,
    portfolioValue: number,
    shares: Record<string, number>,
    currentDate: Date
  ) {
    // Recalculate shares based on target allocations
    for (const allocation of allocations) {
      const price = this.getPrice(priceDataMap[allocation.asset_id], currentDate);
      if (price) {
        const targetValue = (allocation.percentage / 100) * portfolioValue;
        shares[allocation.asset_id] = targetValue / price;
      }
    }
  }

  private calculatePortfolioValue(
    shares: Record<string, number>,
    priceDataMap: AssetPriceMap,
    currentDate: Date
  ): number {
    let totalValue = 0;
    const dateStr = currentDate.toISOString().split('T')[0];

    for (const [assetId, shareCount] of Object.entries(shares)) {
      const price = this.getPrice(priceDataMap[assetId], currentDate);
      if (price) {
        const assetValue = shareCount * price;
        totalValue += assetValue;
        // Debug: Log the first few calculations
        if (dateStr === '2024-08-10' || dateStr === '2024-08-12') {
          console.log(`${dateStr}: Asset ${assetId}: ${shareCount.toFixed(4)} shares @ ${price} = ${assetValue.toFixed(2)}`);
        }
      } else {
        // Debug: Log missing prices
        if (dateStr === '2024-08-10' || dateStr === '2024-08-12') {
          console.log(`${dateStr}: Asset ${assetId}: No price found (${shareCount.toFixed(4)} shares)`);
        }
      }
    }

    if (dateStr === '2024-08-10' || dateStr === '2024-08-12') {
      console.log(`${dateStr}: Total portfolio value = ${totalValue.toFixed(2)}`);
    }

    return totalValue;
  }

  private getPrice(priceData: PriceData[], targetDate: Date): number | null {
    const targetDateStr = targetDate.toISOString().split('T')[0];
    
    // Try to find exact date match
    const exactMatch = priceData.find(p => p.date === targetDateStr);
    if (exactMatch) {
      return exactMatch.close_price;
    }

    // Find closest previous date (for historical data)
    const previousData = priceData
      .filter(p => p.date <= targetDateStr)
      .sort((a, b) => b.date.localeCompare(a.date));
    
    if (previousData.length > 0) {
      return previousData[0].close_price;
    }

    // If no previous data, find the closest future date (for cases where start date is before data availability)
    const futureData = priceData
      .filter(p => p.date >= targetDateStr)
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return futureData[0]?.close_price || null;
  }

  private calculatePerformanceMetrics(
    performanceData: PerformancePoint[],
    initialInvestment: number
  ): Omit<BacktestResult, 'portfolioId' | 'startDate' | 'endDate' | 'initialInvestment' | 'finalValue' | 'performanceData' | 'totalDays'> {
    const dailyReturns = performanceData.slice(1).map(p => p.dailyReturn || 0);
    const monthlyReturns = this.calculateMonthlyReturns(performanceData);
    const yearlyReturns = this.calculateYearlyReturns(performanceData);

    // Total and annualized returns
    const finalValue = performanceData[performanceData.length - 1]?.value || initialInvestment;
    const totalReturn = (finalValue - initialInvestment) / initialInvestment;
    const totalDays = performanceData.length;
    const annualizedReturn = totalDays > 0 ? Math.pow(1 + totalReturn, 365 / totalDays) - 1 : 0;

    // Volatility (annualized standard deviation of daily returns)
    const volatility = this.calculateVolatility(dailyReturns);

    // Sharpe ratio (assuming 2% risk-free rate)
    const riskFreeRate = 0.02;
    const sharpeRatio = volatility > 0 ? (annualizedReturn - riskFreeRate) / volatility : 0;

    // Maximum drawdown
    const maxDrawdown = this.calculateMaxDrawdown(performanceData);

    // Monthly statistics
    const positiveMonths = monthlyReturns.filter(r => r > 0).length;
    const negativeMonths = monthlyReturns.filter(r => r < 0).length;
    const winRate = monthlyReturns.length > 0 ? positiveMonths / monthlyReturns.length : 0;

    // Best and worst months
    const bestMonth = this.getBestMonth(performanceData, monthlyReturns);
    const worstMonth = this.getWorstMonth(performanceData, monthlyReturns);

    return {
      totalReturn,
      annualizedReturn,
      volatility,
      sharpeRatio,
      maxDrawdown,
      monthlyReturns,
      yearlyReturns,
      positiveMonths,
      negativeMonths,
      winRate,
      bestMonth,
      worstMonth
    };
  }

  private calculateMonthlyReturns(performanceData: PerformancePoint[]): number[] {
    const monthlyReturns: number[] = [];
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
    for (let i = 1; i < sortedMonths.length; i++) {
      const prevMonth = monthlyData[sortedMonths[i - 1]];
      const currMonth = monthlyData[sortedMonths[i]];
      
      if (prevMonth.length > 0 && currMonth.length > 0) {
        const prevValue = prevMonth[prevMonth.length - 1].value;
        const currValue = currMonth[currMonth.length - 1].value;
        const monthlyReturn = (currValue - prevValue) / prevValue;
        monthlyReturns.push(monthlyReturn);
      }
    }

    return monthlyReturns;
  }

  private calculateYearlyReturns(performanceData: PerformancePoint[]): Array<{ year: number; return: number }> {
    const yearlyReturns: Array<{ year: number; return: number }> = [];
    const yearlyData: { [key: number]: PerformancePoint[] } = {};

    // Group data by year
    performanceData.forEach(point => {
      const year = parseInt(point.date.substring(0, 4));
      if (!yearlyData[year]) {
        yearlyData[year] = [];
      }
      yearlyData[year].push(point);
    });

    // Calculate yearly returns
    const sortedYears = Object.keys(yearlyData).map(Number).sort();
    for (let i = 1; i < sortedYears.length; i++) {
      const prevYear = yearlyData[sortedYears[i - 1]];
      const currYear = yearlyData[sortedYears[i]];
      
      if (prevYear.length > 0 && currYear.length > 0) {
        const prevValue = prevYear[prevYear.length - 1].value;
        const currValue = currYear[currYear.length - 1].value;
        const yearlyReturn = (currValue - prevValue) / prevValue;
        yearlyReturns.push({ year: sortedYears[i], return: yearlyReturn });
      }
    }

    return yearlyReturns;
  }

  private calculateVolatility(dailyReturns: number[]): number {
    if (dailyReturns.length === 0) return 0;

    const mean = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / dailyReturns.length;
    const dailyVolatility = Math.sqrt(variance);
    
    // Annualize volatility (assuming 252 trading days per year)
    return dailyVolatility * Math.sqrt(252);
  }

  private calculateMaxDrawdown(performanceData: PerformancePoint[]): number {
    let maxDrawdown = 0;
    let peak = performanceData[0]?.value || 0;

    for (const point of performanceData) {
      if (point.value > peak) {
        peak = point.value;
      }
      const drawdown = (peak - point.value) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  private getBestMonth(performanceData: PerformancePoint[], monthlyReturns: number[]): { date: string; return: number } {
    if (monthlyReturns.length === 0) {
      return { date: '', return: 0 };
    }

    const bestReturn = Math.max(...monthlyReturns);
    const bestIndex = monthlyReturns.indexOf(bestReturn);
    
    // Get approximate date (this is simplified - in production you'd want more precise tracking)
    const bestDate = performanceData[Math.floor(performanceData.length * (bestIndex + 1) / monthlyReturns.length)]?.date || '';
    
    return { date: bestDate, return: bestReturn };
  }

  private getWorstMonth(performanceData: PerformancePoint[], monthlyReturns: number[]): { date: string; return: number } {
    if (monthlyReturns.length === 0) {
      return { date: '', return: 0 };
    }

    const worstReturn = Math.min(...monthlyReturns);
    const worstIndex = monthlyReturns.indexOf(worstReturn);
    
    // Get approximate date (this is simplified - in production you'd want more precise tracking)
    const worstDate = performanceData[Math.floor(performanceData.length * (worstIndex + 1) / monthlyReturns.length)]?.date || '';
    
    return { date: worstDate, return: worstReturn };
  }
}

// Export singleton instance
export const backtestEngine = new BacktestEngine();