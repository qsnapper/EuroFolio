'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MonthlyReturn } from '@/lib/analytics/performance-metrics';
import { formatDecimalAsPercentage, cn } from '@/lib/utils';

interface MonthlyHeatmapProps {
  monthlyReturns: MonthlyReturn[];
  title?: string;
  className?: string;
}

interface HeatmapCell {
  year: number;
  month: number;
  monthName: string;
  return: number;
  value: number;
  hasData: boolean;
  colorIntensity: number;
  colorClass: string;
}

export function MonthlyHeatmap({
  monthlyReturns,
  title = "Monthly Returns",
  className
}: MonthlyHeatmapProps) {
  if (!monthlyReturns || monthlyReturns.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No monthly return data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get the range of years covered (descending order)
  const years = [...new Set(monthlyReturns.map(r => r.year))].sort((a, b) => b - a);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Find min/max returns for color scaling
  const returns = monthlyReturns.map(r => r.return);
  const minReturn = Math.min(...returns);
  const maxReturn = Math.max(...returns);
  const maxAbsReturn = Math.max(Math.abs(minReturn), Math.abs(maxReturn));

  // Generate color intensity based on return magnitude
  const getColorIntensity = (returnValue: number): number => {
    if (maxAbsReturn === 0) return 0;
    return Math.abs(returnValue) / maxAbsReturn;
  };

  // Get color class based on return value and intensity
  const getColorClass = (returnValue: number, intensity: number): string => {
    if (returnValue > 0) {
      // Green shades for positive returns
      if (intensity >= 0.8) return 'bg-green-600 text-white';
      if (intensity >= 0.6) return 'bg-green-500 text-white';
      if (intensity >= 0.4) return 'bg-green-400 text-gray-900';
      if (intensity >= 0.2) return 'bg-green-300 text-gray-900';
      return 'bg-green-100 text-gray-900';
    } else if (returnValue < 0) {
      // Red shades for negative returns
      if (intensity >= 0.8) return 'bg-red-600 text-white';
      if (intensity >= 0.6) return 'bg-red-500 text-white';
      if (intensity >= 0.4) return 'bg-red-400 text-gray-900';
      if (intensity >= 0.2) return 'bg-red-300 text-gray-900';
      return 'bg-red-100 text-gray-900';
    } else {
      return 'bg-gray-100 text-gray-600';
    }
  };

  // Calculate yearly totals
  const yearlyTotals = years.map(year => {
    const yearMonths = monthlyReturns.filter(r => r.year === year);
    const yearReturn = yearMonths.length > 0 ? 
      yearMonths.reduce((product, month) => product * (1 + month.return), 1) - 1 : 0;
    return { year, return: yearReturn };
  });

  // Create heatmap data structure
  const heatmapData: HeatmapCell[][] = years.map(year => {
    return monthNames.map((monthName, monthIndex) => {
      const monthData = monthlyReturns.find(r => r.year === year && r.month === monthIndex + 1);
      
      if (monthData) {
        const intensity = getColorIntensity(monthData.return);
        return {
          year,
          month: monthIndex + 1,
          monthName,
          return: monthData.return,
          value: monthData.value,
          hasData: true,
          colorIntensity: intensity,
          colorClass: getColorClass(monthData.return, intensity)
        };
      } else {
        return {
          year,
          month: monthIndex + 1,
          monthName,
          return: 0,
          value: 0,
          hasData: false,
          colorIntensity: 0,
          colorClass: 'bg-gray-50 text-gray-400'
        };
      }
    });
  });

  // Calculate statistics
  const positiveMonths = monthlyReturns.filter(r => r.return > 0).length;
  const negativeMonths = monthlyReturns.filter(r => r.return < 0).length;
  const winRate = monthlyReturns.length > 0 ? (positiveMonths / monthlyReturns.length) * 100 : 0;
  const avgMonthlyReturn = monthlyReturns.length > 0 
    ? monthlyReturns.reduce((sum, r) => sum + r.return, 0) / monthlyReturns.length 
    : 0;
  const bestMonth = monthlyReturns.reduce((max, r) => r.return > max.return ? r : max, monthlyReturns[0] || { return: 0 });
  const worstMonth = monthlyReturns.reduce((min, r) => r.return < min.return ? r : min, monthlyReturns[0] || { return: 0 });

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              Calendar heatmap showing monthly portfolio returns
            </CardDescription>
          </div>
          <div className="text-right text-sm">
            <div className="font-medium">
              {formatDecimalAsPercentage(winRate / 100)} win rate
            </div>
            <div className="text-muted-foreground">
              {positiveMonths} up, {negativeMonths} down
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Summary Statistics */}
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div className="space-y-1">
            <div className="text-muted-foreground">Avg Monthly</div>
            <div className={cn(
              "font-bold",
              avgMonthlyReturn >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {formatDecimalAsPercentage(avgMonthlyReturn)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Best Month</div>
            <div className="font-bold text-green-600">
              {formatDecimalAsPercentage(bestMonth.return)}
            </div>
            <div className="text-xs text-muted-foreground">
              {bestMonth.monthName} {bestMonth.year}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Worst Month</div>
            <div className="font-bold text-red-600">
              {formatDecimalAsPercentage(worstMonth.return)}
            </div>
            <div className="text-xs text-muted-foreground">
              {worstMonth.monthName} {worstMonth.year}
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="space-y-2">
          {/* Month headers */}
          <div className="grid grid-cols-14 gap-1 text-xs text-muted-foreground">
            <div></div> {/* Empty cell for year column */}
            {monthNames.map(month => (
              <div key={month} className="text-center font-medium">
                {month}
              </div>
            ))}
            <div className="text-center font-bold">Total</div>
          </div>

          {/* Year rows */}
          {heatmapData.map((yearData, yearIndex) => {
            const yearTotal = yearlyTotals.find(yt => yt.year === years[yearIndex]);
            const totalIntensity = getColorIntensity(yearTotal?.return || 0);
            const totalColorClass = getColorClass(yearTotal?.return || 0, totalIntensity);
            
            return (
              <div key={years[yearIndex]} className="grid grid-cols-14 gap-1">
                {/* Year label */}
                <div className="text-sm font-medium text-muted-foreground pr-2 text-right">
                  {years[yearIndex]}
                </div>
                
                {/* Month cells */}
                {yearData.map((cell, monthIndex) => (
                  <div
                    key={`${years[yearIndex]}-${monthIndex}`}
                    className={cn(
                      "aspect-square rounded text-xs font-medium flex items-center justify-center cursor-help transition-all hover:scale-105 hover:shadow-sm",
                      cell.colorClass,
                      !cell.hasData && "opacity-50"
                    )}
                    title={
                      cell.hasData 
                        ? `${cell.monthName} ${cell.year}: ${formatDecimalAsPercentage(cell.return)}`
                        : `${cell.monthName} ${cell.year}: No data`
                    }
                  >
                    {cell.hasData ? formatDecimalAsPercentage(cell.return) : '-'}
                  </div>
                ))}
                
                {/* Yearly Total */}
                <div
                  className={cn(
                    "aspect-square rounded text-xs font-bold flex items-center justify-center cursor-help border-2 border-gray-300 transition-all hover:scale-105 hover:shadow-sm",
                    totalColorClass
                  )}
                  title={`${years[yearIndex]} Total: ${formatDecimalAsPercentage(yearTotal?.return || 0)}`}
                >
                  {formatDecimalAsPercentage(yearTotal?.return || 0)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Color Legend */}
        <div className="flex items-center justify-center space-x-4 text-xs">
          <span className="text-muted-foreground">Negative</span>
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-red-600 rounded"></div>
            <div className="w-3 h-3 bg-red-400 rounded"></div>
            <div className="w-3 h-3 bg-red-200 rounded"></div>
            <div className="w-3 h-3 bg-gray-100 rounded"></div>
            <div className="w-3 h-3 bg-green-200 rounded"></div>
            <div className="w-3 h-3 bg-green-400 rounded"></div>
            <div className="w-3 h-3 bg-green-600 rounded"></div>
          </div>
          <span className="text-muted-foreground">Positive</span>
        </div>
      </CardContent>
    </Card>
  );
}