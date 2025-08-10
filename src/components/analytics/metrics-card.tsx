'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricsCardProps {
  title: string;
  value: string | number;
  description?: string;
  format?: 'currency' | 'percentage' | 'ratio' | 'number' | 'grade';
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  status?: 'positive' | 'negative' | 'neutral' | 'warning';
  grade?: {
    grade: string;
    description: string;
    color: string;
  };
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export function MetricsCard({
  title,
  value,
  description,
  format = 'number',
  change,
  changeLabel,
  trend,
  status = 'neutral',
  grade,
  icon,
  size = 'md',
  className,
  onClick
}: MetricsCardProps) {
  const formatValue = (val: string | number, fmt: string): string => {
    if (typeof val === 'string') return val;
    
    switch (fmt) {
      case 'currency':
        return new Intl.NumberFormat('en-GB', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(val);
      
      case 'percentage':
        return `${(val * 100).toFixed(2)}%`;
      
      case 'ratio':
        return val.toFixed(2);
      
      case 'number':
        return val.toLocaleString('en-GB');
      
      default:
        return val.toString();
    }
  };

  const getStatusColor = (stat: string): string => {
    switch (stat) {
      case 'positive':
        return 'text-green-700';
      case 'negative':
        return 'text-red-700';
      case 'warning':
        return 'text-yellow-700';
      default:
        return 'text-gray-700';
    }
  };

  const getTrendIcon = (tr?: string) => {
    switch (tr) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSizeClasses = (sz: string) => {
    switch (sz) {
      case 'sm':
        return {
          card: 'p-3',
          title: 'text-sm',
          value: 'text-lg',
          description: 'text-xs'
        };
      case 'lg':
        return {
          card: 'p-6',
          title: 'text-lg',
          value: 'text-3xl',
          description: 'text-sm'
        };
      default:
        return {
          card: 'p-4',
          title: 'text-sm',
          value: 'text-2xl',
          description: 'text-xs'
        };
    }
  };

  const sizeClasses = getSizeClasses(size);

  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        onClick && "cursor-pointer hover:border-primary/50",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className={cn("flex flex-row items-center justify-between space-y-0 pb-2", sizeClasses.card)}>
        <div className="flex items-center space-x-2">
          <CardTitle className={cn("font-medium", sizeClasses.title)}>
            {title}
          </CardTitle>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        {trend && getTrendIcon(trend)}
      </CardHeader>
      
      <CardContent className={sizeClasses.card}>
        <div className="space-y-2">
          {/* Main Value */}
          <div className="flex items-center justify-between">
            <div className={cn("font-bold", sizeClasses.value, getStatusColor(status))}>
              {format === 'grade' && grade ? (
                <div className="flex items-center space-x-2">
                  <span className={grade.color}>{grade.grade}</span>
                  <Badge variant="outline" className="text-xs">
                    {grade.description}
                  </Badge>
                </div>
              ) : (
                formatValue(value, format)
              )}
            </div>
          </div>

          {/* Change Indicator */}
          {change !== undefined && (
            <div className="flex items-center space-x-2">
              <div className={cn(
                "text-sm font-medium",
                change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : "text-gray-600"
              )}>
                {change > 0 ? '+' : ''}{formatValue(change, format)}
              </div>
              {changeLabel && (
                <span className={cn("text-xs text-muted-foreground", sizeClasses.description)}>
                  {changeLabel}
                </span>
              )}
            </div>
          )}

          {/* Description */}
          {description && (
            <CardDescription className={cn("mt-1", sizeClasses.description)}>
              {description}
            </CardDescription>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Specialized metric cards for common use cases
export function PerformanceMetricsCard({
  totalReturn,
  annualizedReturn,
  className
}: {
  totalReturn: number;
  annualizedReturn: number;
  className?: string;
}) {
  return (
    <MetricsCard
      title="Total Return"
      value={totalReturn}
      format="percentage"
      description={`${(annualizedReturn * 100).toFixed(2)}% annualized`}
      status={totalReturn >= 0 ? 'positive' : 'negative'}
      trend={totalReturn >= 0 ? 'up' : 'down'}
      className={className}
    />
  );
}

export function RiskMetricsCard({
  sharpeRatio,
  volatility,
  grade,
  className
}: {
  sharpeRatio: number;
  volatility: number;
  grade: { grade: string; description: string; color: string };
  className?: string;
}) {
  return (
    <MetricsCard
      title="Sharpe Ratio"
      value={sharpeRatio}
      format="grade"
      grade={grade}
      description={`${(volatility * 100).toFixed(1)}% volatility`}
      status={sharpeRatio >= 1 ? 'positive' : sharpeRatio >= 0 ? 'neutral' : 'negative'}
      className={className}
    />
  );
}

export function DrawdownMetricsCard({
  maxDrawdown,
  currentDrawdown = 0,
  className
}: {
  maxDrawdown: number;
  currentDrawdown?: number;
  className?: string;
}) {
  return (
    <MetricsCard
      title="Max Drawdown"
      value={maxDrawdown}
      format="percentage"
      description={currentDrawdown > 0 ? `${(currentDrawdown * 100).toFixed(2)}% current` : 'Fully recovered'}
      status={maxDrawdown > 0.2 ? 'negative' : maxDrawdown > 0.1 ? 'warning' : 'positive'}
      trend={currentDrawdown > 0 ? 'down' : 'neutral'}
      className={className}
    />
  );
}

export function PortfolioValueCard({
  currentValue,
  initialValue,
  className
}: {
  currentValue: number;
  initialValue: number;
  className?: string;
}) {
  const change = currentValue - initialValue;
  const changePercentage = (change / initialValue) * 100;

  return (
    <MetricsCard
      title="Portfolio Value"
      value={currentValue}
      format="currency"
      change={changePercentage / 100}
      changeLabel="total return"
      status={change >= 0 ? 'positive' : 'negative'}
      trend={change >= 0 ? 'up' : 'down'}
      size="lg"
      className={className}
    />
  );
}