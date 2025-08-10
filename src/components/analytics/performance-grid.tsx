'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDecimalAsPercentage, formatCurrency, cn } from '@/lib/utils';
import { MonthlyReturn } from '@/lib/analytics/performance-metrics';
import { BacktestResult } from '@/lib/backtesting/engine';

interface PerformanceGridProps {
  data: BacktestResult;
  monthlyReturns: MonthlyReturn[];
  title?: string;
  className?: string;
}

interface YearlyData {
  year: number;
  return: number;
  startValue: number;
  endValue: number;
  months: MonthlyReturn[];
  bestMonth: MonthlyReturn | null;
  worstMonth: MonthlyReturn | null;
  positiveMonths: number;
  negativeMonths: number;
}

export function PerformanceGrid({
  data,
  monthlyReturns,
  title = "Performance Summary",
  className
}: PerformanceGridProps) {
  if (!data || !monthlyReturns.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No performance data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group monthly returns by year
  const yearlyData: YearlyData[] = [];
  const yearGroups = monthlyReturns.reduce((groups, month) => {
    if (!groups[month.year]) {
      groups[month.year] = [];
    }
    groups[month.year].push(month);
    return groups;
  }, {} as Record<number, MonthlyReturn[]>);

  Object.entries(yearGroups).forEach(([year, months]) => {
    const yearNum = parseInt(year);
    const sortedMonths = months.sort((a, b) => a.month - b.month);
    
    // Calculate yearly return from first to last month
    const startValue = sortedMonths[0]?.value || 0;
    const endValue = sortedMonths[sortedMonths.length - 1]?.value || 0;
    const yearlyReturn = startValue > 0 ? (endValue - startValue) / startValue : 0;

    const bestMonth = sortedMonths.reduce((max, month) => 
      month.return > (max?.return || -Infinity) ? month : max, null as MonthlyReturn | null);
    const worstMonth = sortedMonths.reduce((min, month) => 
      month.return < (min?.return || Infinity) ? month : min, null as MonthlyReturn | null);

    yearlyData.push({
      year: yearNum,
      return: yearlyReturn,
      startValue,
      endValue,
      months: sortedMonths,
      bestMonth,
      worstMonth,
      positiveMonths: sortedMonths.filter(m => m.return > 0).length,
      negativeMonths: sortedMonths.filter(m => m.return < 0).length
    });
  });

  // Sort by year
  yearlyData.sort((a, b) => b.year - a.year);

  // Calculate overall statistics
  const totalPositiveMonths = monthlyReturns.filter(m => m.return > 0).length;
  const totalNegativeMonths = monthlyReturns.filter(m => m.return < 0).length;
  const winRate = monthlyReturns.length > 0 ? (totalPositiveMonths / monthlyReturns.length) * 100 : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              Yearly performance breakdown and key statistics
            </CardDescription>
          </div>
          <div className="text-right text-sm">
            <div className="font-medium">
              {formatDecimalAsPercentage(winRate / 100)} Win Rate
            </div>
            <div className="text-muted-foreground">
              {totalPositiveMonths}W / {totalNegativeMonths}L
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Key Metrics Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Total Return</div>
            <div className={cn(
              "text-lg font-bold",
              data.totalReturn >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {formatDecimalAsPercentage(data.totalReturn)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Annualized</div>
            <div className={cn(
              "text-lg font-bold",
              data.annualizedReturn >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {formatDecimalAsPercentage(data.annualizedReturn)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Volatility</div>
            <div className="text-lg font-bold text-orange-600">
              {formatDecimalAsPercentage(data.volatility)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
            <div className={cn(
              "text-lg font-bold",
              data.sharpeRatio >= 1 ? "text-green-600" : data.sharpeRatio >= 0 ? "text-yellow-600" : "text-red-600"
            )}>
              {data.sharpeRatio.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Yearly Performance Table */}
        <div>
          <h3 className="text-lg font-medium mb-3">Yearly Performance</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead className="text-right">Return</TableHead>
                <TableHead className="text-right">Start Value</TableHead>
                <TableHead className="text-right">End Value</TableHead>
                <TableHead className="text-center">Best Month</TableHead>
                <TableHead className="text-center">Worst Month</TableHead>
                <TableHead className="text-center">Win Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {yearlyData.map((yearData) => {
                const yearWinRate = yearData.months.length > 0 
                  ? (yearData.positiveMonths / yearData.months.length) * 100 
                  : 0;

                return (
                  <TableRow key={yearData.year}>
                    <TableCell className="font-medium">
                      {yearData.year}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        "font-medium",
                        yearData.return >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {formatDecimalAsPercentage(yearData.return)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(yearData.startValue)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(yearData.endValue)}
                    </TableCell>
                    <TableCell className="text-center">
                      {yearData.bestMonth && (
                        <div className="space-y-1">
                          <div className="font-medium text-green-600">
                            {formatDecimalAsPercentage(yearData.bestMonth.return)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {yearData.bestMonth.monthName}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {yearData.worstMonth && (
                        <div className="space-y-1">
                          <div className="font-medium text-red-600">
                            {formatDecimalAsPercentage(yearData.worstMonth.return)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {yearData.worstMonth.monthName}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={yearWinRate >= 60 ? "default" : yearWinRate >= 40 ? "secondary" : "destructive"}>
                        {formatDecimalAsPercentage(yearWinRate / 100)}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {yearData.positiveMonths}W / {yearData.negativeMonths}L
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Additional Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Risk Metrics */}
          <div>
            <h3 className="text-lg font-medium mb-3">Risk Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Maximum Drawdown</span>
                <span className="font-medium text-red-600">
                  {formatDecimalAsPercentage(data.maxDrawdown)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Volatility (Annualized)</span>
                <span className="font-medium">
                  {formatDecimalAsPercentage(data.volatility)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sharpe Ratio</span>
                <span className={cn(
                  "font-medium",
                  data.sharpeRatio >= 1 ? "text-green-600" : data.sharpeRatio >= 0 ? "text-yellow-600" : "text-red-600"
                )}>
                  {data.sharpeRatio.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Calmar Ratio</span>
                <span className={cn(
                  "font-medium",
                  data.maxDrawdown > 0 ? "text-blue-600" : "text-gray-600"
                )}>
                  {data.maxDrawdown > 0 ? (data.annualizedReturn / data.maxDrawdown).toFixed(2) : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Performance Stats */}
          <div>
            <h3 className="text-lg font-medium mb-3">Performance Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Best Month</span>
                <span className="font-medium text-green-600">
                  {formatDecimalAsPercentage(data.bestMonth.return)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Worst Month</span>
                <span className="font-medium text-red-600">
                  {formatDecimalAsPercentage(data.worstMonth.return)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Positive Months</span>
                <span className="font-medium">
                  {data.positiveMonths} / {data.positiveMonths + data.negativeMonths}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Win Rate</span>
                <span className={cn(
                  "font-medium",
                  data.winRate >= 0.6 ? "text-green-600" : data.winRate >= 0.4 ? "text-yellow-600" : "text-red-600"
                )}>
                  {formatDecimalAsPercentage(data.winRate)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}