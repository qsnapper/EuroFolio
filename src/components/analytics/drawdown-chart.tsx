'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { PerformancePoint } from '@/types';
import { DrawdownPeriod } from '@/lib/analytics/performance-metrics';
import { formatDecimalAsPercentage, formatDate } from '@/lib/utils';

interface DrawdownChartProps {
  performanceData: PerformancePoint[];
  drawdownPeriods: DrawdownPeriod[];
  title?: string;
  height?: number;
  className?: string;
}

interface DrawdownDataPoint {
  date: string;
  value: number;
  drawdown: number;
  drawdownPercentage: number;
  formattedDate: string;
  isInDrawdown: boolean;
  drawdownDuration?: number;
}

export function DrawdownChart({
  performanceData,
  drawdownPeriods,
  title = "Drawdown Analysis",
  height = 300,
  className
}: DrawdownChartProps) {
  if (!performanceData || performanceData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No drawdown data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate drawdown data for each point
  const drawdownData: DrawdownDataPoint[] = [];
  let runningPeak = performanceData[0].value;

  performanceData.forEach((point, index) => {
    // Update running peak
    if (point.value > runningPeak) {
      runningPeak = point.value;
    }

    // Calculate drawdown
    const drawdown = runningPeak - point.value;
    const drawdownPercentage = runningPeak > 0 ? (drawdown / runningPeak) : 0;

    // Check if this point is in a drawdown period
    const inDrawdownPeriod = drawdownPeriods.some(period => 
      point.date >= period.startDate && point.date <= period.endDate
    );

    drawdownData.push({
      date: point.date,
      value: point.value,
      drawdown: -drawdown, // Negative for underwater chart
      drawdownPercentage: -drawdownPercentage * 100, // Negative percentage for display
      formattedDate: formatDate(point.date, 'en-GB', { month: 'short', year: 'numeric' }),
      isInDrawdown: drawdownPercentage > 0.001, // Consider 0.1% as threshold for drawdown
      drawdownDuration: inDrawdownPeriod ? 
        drawdownPeriods.find(p => point.date >= p.startDate && point.date <= p.endDate)?.duration : undefined
    });
  });

  // Find maximum drawdown for y-axis scaling
  const maxDrawdownPercentage = Math.min(...drawdownData.map(d => d.drawdownPercentage));
  const yAxisDomain = [maxDrawdownPercentage * 1.1, 1]; // Add 10% padding below max drawdown

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm">{formatDate(data.date)}</p>
          <div className="space-y-1 mt-2">
            <div className="flex justify-between gap-4">
              <span className="text-sm text-muted-foreground">Portfolio Value:</span>
              <span className="text-sm font-medium">
                {new Intl.NumberFormat('en-GB', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(data.value)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-sm text-muted-foreground">Drawdown:</span>
              <span className={`text-sm font-medium ${data.drawdownPercentage < -0.1 ? 'text-red-600' : 'text-gray-600'}`}>
                {formatDecimalAsPercentage(Math.abs(data.drawdownPercentage))}
              </span>
            </div>
            {data.drawdownDuration && (
              <div className="flex justify-between gap-4">
                <span className="text-sm text-muted-foreground">Duration:</span>
                <span className="text-sm font-medium">{data.drawdownDuration} days</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate summary statistics
  const maxDrawdownPeriod = drawdownPeriods.reduce((max, period) => 
    period.drawdownPercentage > max.drawdownPercentage ? period : max, 
    drawdownPeriods[0] || { drawdownPercentage: 0, duration: 0 }
  );

  const avgDrawdownDuration = drawdownPeriods.length > 0 
    ? drawdownPeriods.reduce((sum, p) => sum + p.duration, 0) / drawdownPeriods.length 
    : 0;

  const totalDrawdownPeriods = drawdownPeriods.length;
  const recoveredPeriods = drawdownPeriods.filter(p => p.recovered).length;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              Underwater chart showing all drawdown periods from peak values
            </CardDescription>
          </div>
          <div className="text-right text-sm">
            <div className="font-medium text-red-600">
              Max: {formatDecimalAsPercentage(maxDrawdownPeriod?.drawdownPercentage || 0)}
            </div>
            <div className="text-muted-foreground">
              {totalDrawdownPeriods} periods, {recoveredPeriods} recovered
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-center">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Avg Duration</div>
            <div className="text-lg font-bold">
              {Math.round(avgDrawdownDuration)} days
            </div>
            <div className="text-xs text-muted-foreground">
              per drawdown
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Recovery Rate</div>
            <div className="text-lg font-bold text-green-600">
              {totalDrawdownPeriods > 0 ? Math.round((recoveredPeriods / totalDrawdownPeriods) * 100) : 100}%
            </div>
            <div className="text-xs text-muted-foreground">
              of drawdowns
            </div>
          </div>
        </div>

        {/* Drawdown Chart */}
        <div className="w-full" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={drawdownData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              
              <XAxis 
                dataKey="formattedDate"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              
              <YAxis 
                domain={yAxisDomain}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${Math.abs(value).toFixed(1)}%`}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              {/* Zero line */}
              <ReferenceLine 
                y={0} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="2 2"
                opacity={0.5}
              />
              
              {/* Drawdown area */}
              <Area
                type="monotone"
                dataKey="drawdownPercentage"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#drawdownGradient)"
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Drawdown Periods Summary */}
        {drawdownPeriods.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Major Drawdown Periods</h4>
            <div className="space-y-1">
              {drawdownPeriods
                .filter(period => period.drawdownPercentage >= 0.05) // Show periods >= 5%
                .sort((a, b) => b.drawdownPercentage - a.drawdownPercentage)
                .slice(0, 3) // Show top 3
                .map((period, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {formatDate(period.startDate, 'en-GB', { month: 'short', year: 'numeric' })} - {' '}
                      {formatDate(period.endDate, 'en-GB', { month: 'short', year: 'numeric' })}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-red-600">
                        -{formatDecimalAsPercentage(period.drawdownPercentage)}
                      </span>
                      <span className="text-muted-foreground">
                        ({period.duration}d)
                      </span>
                      {period.recovered && (
                        <span className="text-green-600">✓</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}