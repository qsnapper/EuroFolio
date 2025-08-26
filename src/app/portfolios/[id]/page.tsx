'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Settings, TrendingUp, Activity, Target, PieChart } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { MetricsCard } from '@/components/analytics/metrics-card';
import { DrawdownChart } from '@/components/analytics/drawdown-chart';
import { MonthlyHeatmap } from '@/components/analytics/monthly-heatmap';
import { PerformanceGrid } from '@/components/analytics/performance-grid';
import { PerformanceChart } from '@/components/charts/performance-chart';
import { usePortfolios } from '@/hooks/use-portfolios';
import { useBacktestHistory } from '@/hooks/use-backtest';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { getRiskGrade, analyzeDrawdownPeriods, generateMonthlyReturns, calculateAdvancedMetrics } from '@/lib/analytics/performance-metrics';
import { formatCurrency, formatDecimalAsPercentage, cn } from '@/lib/utils';
import type { Portfolio } from '@/types';

export default function PortfolioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const portfolioId = params.id as string;

  const { data: portfoliosResponse, isLoading, error } = usePortfolios();
  const { data: backtestHistory } = useBacktestHistory(portfolioId);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  
  useDocumentTitle(portfolio ? `${portfolio.name} - Portfolio Details - EuroFolio` : 'Portfolio Details - EuroFolio');

  useEffect(() => {
    if (portfoliosResponse?.data) {
      const foundPortfolio = portfoliosResponse.data.find(p => p.id === portfolioId);
      setPortfolio(foundPortfolio || null);
    }
  }, [portfoliosResponse, portfolioId]);

  // Get the most recent backtest result for analytics
  const latestBacktest = backtestHistory?.data?.[0];
  const hasBacktestData = latestBacktest;

  // For now, we'll use basic metrics from the database
  // TODO: Store full performance data in database or re-run calculation
  const riskGrade = latestBacktest ? getRiskGrade(latestBacktest.sharpe_ratio) : null;

  // Generate synthetic performance data for drawdown analysis
  // In production, this would come from stored backtest results
  const generateSyntheticPerformanceData = (backtest: any) => {
    if (!backtest) return [];
    
    const startDate = new Date(backtest.start_date);
    const endDate = new Date(backtest.end_date);
    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const performanceData = [];
    
    // Create a simplified performance curve based on total return
    for (let i = 0; i <= totalDays; i += 7) { // Weekly data points for now
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Simple curved growth with some volatility simulation
      const progress = i / totalDays;
      const baseReturn = backtest.total_return * progress;
      // Add some realistic volatility (drawdowns and recoveries)
      const volatilityFactor = Math.sin(progress * Math.PI * 6) * 0.05 * backtest.volatility;
      const adjustedReturn = baseReturn + volatilityFactor;
      
      const value = backtest.initial_investment * (1 + adjustedReturn);
      const dailyReturn: number = i > 0 ? (value - performanceData[performanceData.length - 1].value) / performanceData[performanceData.length - 1].value : 0;
      
      performanceData.push({
        date: date.toISOString().split('T')[0],
        value,
        dailyReturn,
        cumulativeReturn: adjustedReturn
      });
    }
    
    return performanceData;
  };

  // Use stored performance data if available, otherwise generate synthetic data
  const performanceData = (latestBacktest?.performance_data && Array.isArray(latestBacktest.performance_data)) 
    ? latestBacktest.performance_data 
    : latestBacktest ? generateSyntheticPerformanceData(latestBacktest) : [];
  
  const drawdownPeriods = (latestBacktest?.drawdown_periods && Array.isArray(latestBacktest.drawdown_periods))
    ? latestBacktest.drawdown_periods
    : performanceData.length > 0 ? analyzeDrawdownPeriods(performanceData) : [];
    
  const monthlyReturns = (latestBacktest?.monthly_returns && Array.isArray(latestBacktest.monthly_returns))
    ? latestBacktest.monthly_returns
    : performanceData.length > 0 ? generateMonthlyReturns(performanceData) : [];
    
  const advancedMetrics = latestBacktest?.advanced_metrics || 
    (performanceData.length > 0 ? calculateAdvancedMetrics(performanceData, latestBacktest?.max_drawdown || 0) : null);

  // Create BacktestResult for PerformanceGrid
  const backtestResultForGrid = latestBacktest ? {
    portfolioId: latestBacktest.portfolio_id,
    startDate: latestBacktest.start_date,
    endDate: latestBacktest.end_date,
    initialInvestment: latestBacktest.initial_investment,
    finalValue: latestBacktest.initial_investment * (1 + latestBacktest.total_return),
    totalReturn: latestBacktest.total_return,
    annualizedReturn: latestBacktest.annualized_return,
    volatility: latestBacktest.volatility,
    sharpeRatio: latestBacktest.sharpe_ratio,
    maxDrawdown: latestBacktest.max_drawdown,
    totalDays: Math.floor((new Date(latestBacktest.end_date).getTime() - new Date(latestBacktest.start_date).getTime()) / (1000 * 60 * 60 * 24)),
    performanceData: performanceData,
    monthlyReturns: monthlyReturns.map(m => m.return),
    yearlyReturns: [], // Will be calculated by PerformanceGrid
    bestMonth: monthlyReturns.length > 0 ? {
      date: monthlyReturns.reduce((max, r) => r.return > max.return ? r : max, monthlyReturns[0])?.year + '-' + monthlyReturns.reduce((max, r) => r.return > max.return ? r : max, monthlyReturns[0])?.month.toString().padStart(2, '0') || '',
      return: monthlyReturns.reduce((max, r) => r.return > max.return ? r : max, monthlyReturns[0])?.return || 0
    } : { date: '', return: 0 },
    worstMonth: monthlyReturns.length > 0 ? {
      date: monthlyReturns.reduce((min, r) => r.return < min.return ? r : min, monthlyReturns[0])?.year + '-' + monthlyReturns.reduce((min, r) => r.return < min.return ? r : min, monthlyReturns[0])?.month.toString().padStart(2, '0') || '',
      return: monthlyReturns.reduce((min, r) => r.return < min.return ? r : min, monthlyReturns[0])?.return || 0
    } : { date: '', return: 0 },
    positiveMonths: latestBacktest.positive_months,
    negativeMonths: latestBacktest.negative_months,
    winRate: latestBacktest.positive_months / (latestBacktest.positive_months + latestBacktest.negative_months)
  } : null;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !portfolio) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Portfolio Not Found</h2>
            <p className="text-gray-600 mt-2">
              The portfolio you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
            </p>
          </div>
          <Button onClick={() => router.push('/portfolios')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Portfolios
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const totalAllocation = portfolio.portfolio_allocations?.reduce((sum, allocation) => sum + allocation.percentage, 0) || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{portfolio.name}</h1>
              {portfolio.description && (
                <p className="text-muted-foreground mt-1">{portfolio.description}</p>
              )}
              {latestBacktest && (
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="outline">
                    Last backtest: {new Date(latestBacktest.created_at).toLocaleDateString()}
                  </Badge>
                  <Badge variant="secondary">
                    {latestBacktest.start_date} to {latestBacktest.end_date}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/portfolios/${portfolio.id}/edit`}>
                <Settings className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button 
              size="sm"
              onClick={() => router.push(`/portfolios/${portfolio.id}/backtest`)}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              {latestBacktest ? 'Run New Backtest' : 'Run First Backtest'}
            </Button>
          </div>
        </div>

        {hasBacktestData ? (
          <>
            {/* Performance Overview Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <MetricsCard
                title="Portfolio Value"
                value={latestBacktest.initial_investment * (1 + latestBacktest.total_return)}
                format="currency"
                description={`From ${formatCurrency(latestBacktest.initial_investment)}`}
                change={latestBacktest.initial_investment * latestBacktest.total_return}
                changeLabel="total return"
                status={latestBacktest.total_return >= 0 ? 'positive' : 'negative'}
                trend={latestBacktest.total_return >= 0 ? 'up' : 'down'}
                size="lg"
              />
              
              <MetricsCard
                title="Total Return"
                value={latestBacktest.total_return}
                format="percentage"
                description={`${formatDecimalAsPercentage(latestBacktest.annualized_return)} annualized`}
                status={latestBacktest.total_return >= 0 ? 'positive' : 'negative'}
                trend={latestBacktest.total_return >= 0 ? 'up' : 'down'}
                icon={<TrendingUp className="h-4 w-4" />}
              />
              
              <MetricsCard
                title="Sharpe Ratio"
                value={latestBacktest.sharpe_ratio.toFixed(2)}
                format="ratio"
                description={`${formatDecimalAsPercentage(latestBacktest.volatility)} volatility`}
                status={latestBacktest.sharpe_ratio >= 1 ? 'positive' : latestBacktest.sharpe_ratio >= 0.5 ? 'neutral' : 'negative'}
                icon={<Activity className="h-4 w-4" />}
              />
              
              <MetricsCard
                title="Max Drawdown"
                value={latestBacktest.max_drawdown}
                format="percentage"
                description="Peak to trough decline"
                status={latestBacktest.max_drawdown > 0.2 ? 'negative' : latestBacktest.max_drawdown > 0.1 ? 'warning' : 'positive'}
                icon={<Target className="h-4 w-4" />}
              />

              <MetricsCard
                title="Win Rate"
                value={latestBacktest.positive_months / (latestBacktest.positive_months + latestBacktest.negative_months)}
                format="percentage"
                description={`${latestBacktest.positive_months}W / ${latestBacktest.negative_months}L`}
                status={latestBacktest.positive_months / (latestBacktest.positive_months + latestBacktest.negative_months) >= 0.6 ? 'positive' : 'neutral'}
                icon={<Target className="h-4 w-4" />}
              />
            </div>

            {/* Portfolio Performance Over Time */}
            {performanceData.length > 0 && (
              <PerformanceChart
                data={performanceData}
                initialInvestment={latestBacktest.initial_investment}
                title="Portfolio Performance Over Time"
                height={400}
                enableTimePeriodSelector={true}
                enableViewToggle={true}
              />
            )}

            {/* Advanced Analytics Section */}
            <div className="grid gap-6 xl:grid-cols-2">
              {/* Drawdown Analysis */}
              {performanceData.length > 0 && (
                <DrawdownChart
                  performanceData={performanceData}
                  drawdownPeriods={drawdownPeriods}
                  title="Drawdown Analysis"
                  height={320}
                  className="xl:col-span-1"
                />
              )}

              {/* Monthly Returns Heatmap */}
              {monthlyReturns.length > 0 && (
                <MonthlyHeatmap
                  monthlyReturns={monthlyReturns}
                  title="Monthly Returns"
                  className="xl:col-span-1"
                />
              )}
            </div>

            {/* Performance Data Grid */}
            {backtestResultForGrid && monthlyReturns.length > 0 && (
              <PerformanceGrid
                data={backtestResultForGrid}
                monthlyReturns={monthlyReturns}
                title="Historical Performance Analysis"
              />
            )}

            {/* Asset Allocation Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>Asset Allocation</span>
                </CardTitle>
                <CardDescription>
                  Current portfolio composition
                </CardDescription>
              </CardHeader>
              <CardContent>
                {portfolio.portfolio_allocations && portfolio.portfolio_allocations.length > 0 ? (
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Doughnut Chart */}
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={portfolio.portfolio_allocations.map(allocation => ({
                              name: allocation.assets?.symbol || 'Unknown',
                              value: allocation.percentage,
                              fullName: allocation.assets?.name || 'Unknown Asset',
                              exchange: allocation.assets?.exchange || '',
                              currency: allocation.assets?.currency || ''
                            }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={120}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {portfolio.portfolio_allocations.map((_, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={`hsl(${(index * 360) / portfolio.portfolio_allocations!.length}, 70%, 50%)`}
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number, name: string, props: any) => [
                              `${value}%`,
                              props.payload.fullName
                            ]}
                          />
                          <Legend 
                            verticalAlign="bottom" 
                            height={36}
                            formatter={(value, entry) => `${value} (${entry.payload?.value}%)`}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Asset Details List */}
                    <div className="space-y-3">
                      {portfolio.portfolio_allocations.map((allocation, index) => (
                        <div key={allocation.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: `hsl(${(index * 360) / portfolio.portfolio_allocations!.length}, 70%, 50%)` }}
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{allocation.assets?.symbol}</span>
                                <Badge variant="outline" className="text-xs">
                                  {allocation.assets?.exchange}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {allocation.assets?.currency}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {allocation.assets?.name}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">{allocation.percentage}%</div>
                            {latestBacktest && (
                              <div className="text-sm text-muted-foreground">
                                ≈{formatCurrency((allocation.percentage / 100) * latestBacktest.initial_investment * (1 + latestBacktest.total_return))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {totalAllocation !== 100 && (
                        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                            <span className="text-sm font-medium">
                              Portfolio allocation is {totalAllocation}% 
                              ({100 - totalAllocation}% remaining)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No assets allocated yet.</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => router.push(`/portfolios/${portfolio.id}/edit`)}
                    >
                      Add Assets
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Portfolio Overview Cards - Without Performance Data */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{portfolio.portfolio_allocations?.length || 0}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Allocation</CardTitle>
                  <div className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalAllocation.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">
                    {totalAllocation === 100 ? 'Complete' : 'Incomplete'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rebalance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{portfolio.rebalance_frequency}</div>
                  <div className="text-xs text-muted-foreground">
                    {portfolio.rebalance_threshold}% threshold
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={totalAllocation === 100 ? "default" : "secondary"}>
                    {totalAllocation === 100 ? "Ready" : "Incomplete"}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* No Backtest Data State */}
            <Card>
              <CardContent className="py-16">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">No Performance Data Yet</h3>
                    <p className="text-muted-foreground mt-2">
                      Run your first backtest to see comprehensive portfolio analytics and performance metrics.
                    </p>
                  </div>
                  <Button 
                    size="lg"
                    onClick={() => router.push(`/portfolios/${portfolio.id}/backtest`)}
                    disabled={totalAllocation !== 100}
                  >
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Run First Backtest
                  </Button>
                  {totalAllocation !== 100 && (
                    <p className="text-sm text-muted-foreground">
                      Complete your portfolio allocation (currently {totalAllocation.toFixed(1)}%) before running a backtest.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Asset Allocation - Always Show */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>Asset Allocation</span>
                </CardTitle>
                <CardDescription>
                  Current portfolio composition
                </CardDescription>
              </CardHeader>
              <CardContent>
                {portfolio.portfolio_allocations && portfolio.portfolio_allocations.length > 0 ? (
                  <div className="space-y-4">
                    {portfolio.portfolio_allocations.map((allocation) => (
                      <div key={allocation.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{allocation.assets?.symbol}</span>
                            <Badge variant="outline" className="text-xs">
                              {allocation.assets?.exchange}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {allocation.assets?.currency}
                            </Badge>
                          </div>
                          <span className="font-medium">{allocation.percentage}%</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {allocation.assets?.name}
                        </div>
                        <Progress 
                          value={allocation.percentage} 
                          className="w-full h-2" 
                        />
                      </div>
                    ))}
                    
                    {totalAllocation !== 100 && (
                      <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                          <span className="text-sm font-medium">
                            Portfolio allocation is {totalAllocation}% 
                            ({100 - totalAllocation}% remaining)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No assets allocated yet.</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => router.push(`/portfolios/${portfolio.id}/edit`)}
                    >
                      Add Assets
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}