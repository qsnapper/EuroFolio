'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import { formatCurrency, formatPercentage, formatDate, cn } from '@/lib/utils';

interface PerformanceChartProps {
  data: PerformancePoint[];
  initialInvestment: number;
  title?: string;
  height?: number;
  showValueLine?: boolean;
  showBenchmark?: boolean;
  benchmarkData?: PerformancePoint[];
  enableTimePeriodSelector?: boolean;
  enableViewToggle?: boolean;
  className?: string;
}

type TimePeriod = '1M' | '3M' | '6M' | '1Y' | '3Y' | 'All';
type ViewMode = 'absolute' | 'percentage';

export function PerformanceChart({ 
  data, 
  initialInvestment, 
  title = "Portfolio Performance",
  height = 400,
  showValueLine = true,
  showBenchmark = false,
  benchmarkData,
  enableTimePeriodSelector = true,
  enableViewToggle = true,
  className
}: PerformanceChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('All');
  const [viewMode, setViewMode] = useState<ViewMode>('absolute');
  const [showReferenceLine, setShowReferenceLine] = useState(true);
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
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

  // Filter data based on selected time period
  const getFilteredData = (period: TimePeriod): PerformancePoint[] => {
    if (period === 'All') return data;
    
    const endDate = new Date(data[data.length - 1].date);
    let startDate: Date;
    
    switch (period) {
      case '1M':
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case '3M':
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '6M':
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case '1Y':
        startDate = new Date(endDate);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case '3Y':
        startDate = new Date(endDate);
        startDate.setFullYear(startDate.getFullYear() - 3);
        break;
      default:
        return data;
    }
    
    return data.filter(point => new Date(point.date) >= startDate);
  };

  const filteredData = getFilteredData(selectedPeriod);
  const filteredBenchmarkData = showBenchmark && benchmarkData 
    ? getFilteredData(selectedPeriod).map((_, index) => {
        const originalIndex = data.findIndex(p => p.date === filteredData[index]?.date);
        return benchmarkData[originalIndex];
      }).filter(Boolean)
    : undefined;

  // Transform data for chart
  const chartData = filteredData.map((point, index) => {
    const baseValue = viewMode === 'absolute' ? point.value : point.cumulativeReturn * 100;
    const baseData = {
      date: point.date,
      value: baseValue,
      absoluteValue: point.value,
      return: point.cumulativeReturn * 100,
      formattedDate: formatDate(point.date, 'en-GB', { month: 'short', year: 'numeric' }),
      fullDate: formatDate(point.date),
    };

    // Add benchmark data if available
    if (showBenchmark && filteredBenchmarkData && filteredBenchmarkData[index]) {
      const benchmarkPoint = filteredBenchmarkData[index];
      return {
        ...baseData,
        benchmarkValue: viewMode === 'absolute' ? benchmarkPoint.value : benchmarkPoint.cumulativeReturn * 100,
        benchmarkAbsoluteValue: benchmarkPoint.value,
        benchmarkReturn: benchmarkPoint.cumulativeReturn * 100,
      };
    }

    return baseData;
  });

  // Calculate Y-axis domain based on view mode
  let yAxisDomain: [number, number];
  if (viewMode === 'percentage') {
    const returns = chartData.map(d => d.return);
    const minReturn = Math.min(...returns);
    const maxReturn = Math.max(...returns);
    const padding = (maxReturn - minReturn) * 0.1;
    yAxisDomain = [minReturn - padding, maxReturn + padding];
  } else {
    const values = chartData.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const padding = (maxValue - minValue) * 0.1;
    yAxisDomain = [Math.max(0, minValue - padding), maxValue + padding];
  }

  const finalValue = filteredData[filteredData.length - 1]?.value || initialInvestment;
  const totalReturn = ((finalValue - initialInvestment) / initialInvestment) * 100;

  // Time period options
  const timePeriods: { value: TimePeriod; label: string }[] = [
    { value: '1M', label: '1M' },
    { value: '3M', label: '3M' },
    { value: '6M', label: '6M' },
    { value: '1Y', label: '1Y' },
    { value: '3Y', label: '3Y' },
    { value: 'All', label: 'All' }
  ];

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
              <span className="text-sm font-medium">{formatCurrency(data.absoluteValue)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-sm text-muted-foreground">Return:</span>
              <span className={`text-sm font-medium ${data.return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(data.return)}
              </span>
            </div>
            {showBenchmark && data.benchmarkAbsoluteValue && (
              <>
                <div className="flex justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Benchmark Value:</span>
                  <span className="text-sm font-medium">{formatCurrency(data.benchmarkAbsoluteValue)}</span>
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
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>
                Portfolio value over time from {formatDate(filteredData[0]?.date || data[0].date)} to {formatDate(filteredData[filteredData.length - 1]?.date || data[data.length - 1].date)}
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

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Time Period Selector */}
            {enableTimePeriodSelector && (
              <div className="flex items-center space-x-1">
                {timePeriods.map((period) => (
                  <Button
                    key={period.value}
                    variant={selectedPeriod === period.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPeriod(period.value)}
                    className="text-xs px-3 py-1"
                  >
                    {period.label}
                  </Button>
                ))}
              </div>
            )}

            {/* View Controls */}
            <div className="flex items-center space-x-4">
              {enableViewToggle && (
                <div className="flex items-center space-x-2">
                  <Label htmlFor="view-mode" className="text-sm">
                    Show %
                  </Label>
                  <Switch
                    id="view-mode"
                    checked={viewMode === 'percentage'}
                    onCheckedChange={(checked) => setViewMode(checked ? 'percentage' : 'absolute')}
                  />
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Label htmlFor="reference-line" className="text-sm">
                  Reference
                </Label>
                <Switch
                  id="reference-line"
                  checked={showReferenceLine}
                  onCheckedChange={setShowReferenceLine}
                />
              </div>
            </div>
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
                tickFormatter={(value) => 
                  viewMode === 'percentage' 
                    ? `${value.toFixed(1)}%` 
                    : formatCurrency(value, 'EUR', 'en-GB').replace('€', '€')
                }
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Reference line */}
              {showReferenceLine && (
                <ReferenceLine 
                  y={viewMode === 'percentage' ? 0 : initialInvestment} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="5 5"
                  opacity={0.5}
                />
              )}
              
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