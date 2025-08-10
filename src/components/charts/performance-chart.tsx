'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine 
} from 'recharts';
import { PerformancePoint } from '@/types';
import { formatCurrency, formatPercentage, formatDate } from '@/lib/utils';

interface PerformanceChartProps {
  data: PerformancePoint[];
  initialInvestment: number;
  title?: string;
  height?: number;
  showValueLine?: boolean;
  showBenchmark?: boolean;
  benchmarkData?: PerformancePoint[];
}

export function PerformanceChart({ 
  data, 
  initialInvestment, 
  title = "Portfolio Performance",
  height = 400,
  showValueLine = true,
  showBenchmark = false,
  benchmarkData
}: PerformanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No performance data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transform data for chart
  const chartData = data.map((point, index) => {
    const baseData = {
      date: point.date,
      value: point.value,
      return: point.cumulativeReturn * 100,
      formattedDate: formatDate(point.date, 'en-GB', { month: 'short', year: 'numeric' }),
      fullDate: formatDate(point.date),
    };

    // Add benchmark data if available
    if (showBenchmark && benchmarkData && benchmarkData[index]) {
      return {
        ...baseData,
        benchmarkValue: benchmarkData[index].value,
        benchmarkReturn: benchmarkData[index].cumulativeReturn * 100,
      };
    }

    return baseData;
  });

  // Calculate Y-axis domain
  const values = chartData.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const padding = (maxValue - minValue) * 0.1; // 10% padding
  const yAxisDomain = [Math.max(0, minValue - padding), maxValue + padding];


  const finalValue = data[data.length - 1]?.value || initialInvestment;
  const totalReturn = ((finalValue - initialInvestment) / initialInvestment) * 100;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm">{data.fullDate}</p>
          <div className="space-y-1 mt-2">
            <div className="flex justify-between gap-4">
              <span className="text-sm text-muted-foreground">Portfolio Value:</span>
              <span className="text-sm font-medium">{formatCurrency(data.value)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-sm text-muted-foreground">Return:</span>
              <span className={`text-sm font-medium ${data.return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(data.return)}
              </span>
            </div>
            {showBenchmark && data.benchmarkValue && (
              <>
                <div className="flex justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Benchmark Value:</span>
                  <span className="text-sm font-medium">{formatCurrency(data.benchmarkValue)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Benchmark Return:</span>
                  <span className={`text-sm font-medium ${data.benchmarkReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(data.benchmarkReturn)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              Portfolio value over time from {formatDate(data[0].date)} to {formatDate(data[data.length - 1].date)}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {formatCurrency(finalValue)}
            </div>
            <Badge variant={totalReturn >= 0 ? "default" : "destructive"}>
              {totalReturn >= 0 ? '+' : ''}{formatPercentage(totalReturn)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={yAxisDomain}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCurrency(value, 'EUR', 'en-GB').replace('€', '€')}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Reference line at initial investment */}
              <ReferenceLine 
                y={initialInvestment} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="5 5"
                opacity={0.5}
              />
              
              {/* Benchmark line (if enabled) */}
              {showBenchmark && (
                <Line
                  type="monotone"
                  dataKey="benchmarkValue"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="5 5"
                />
              )}
              
              {/* Portfolio performance line */}
              <Line
                dataKey="value"
                stroke="#22c55e"
                strokeWidth={3}
                dot={false}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}