'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRunBacktest, useBacktestHistory } from '@/hooks/use-backtest';
import { usePortfolios } from '@/hooks/use-portfolios';
import { 
  Play, 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Calendar,
  Target,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency, formatDecimalAsPercentage, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { PerformanceChart } from '@/components/charts/performance-chart';

interface BacktestPageProps {
  params: Promise<{ id: string }>;
}

export default function BacktestPage({ params }: BacktestPageProps) {
  const { id: portfolioId } = use(params);
  const router = useRouter();
  
  // Form state
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [initialInvestment, setInitialInvestment] = useState(10000);
  const [rebalanceFrequency, setRebalanceFrequency] = useState<string>('ANNUALLY');
  
  // Active backtest result
  const [activeResult, setActiveResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('configure');

  const runBacktest = useRunBacktest(portfolioId);
  const { data: historyData } = useBacktestHistory(portfolioId);
  const { data: portfoliosData } = usePortfolios();

  const portfolio = portfoliosData?.data.find(p => p.id === portfolioId);

  const handleRunBacktest = async () => {
    try {
      
      const result = await runBacktest.mutateAsync({
        startDate,
        endDate,
        initialInvestment,
        rebalanceFrequency: rebalanceFrequency as 'NEVER' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY'
      });
      
      
      setActiveResult(result.data);
      setActiveTab('results'); // Auto-switch to results tab
    } catch (error) {
      console.error('Backtest failed:', error);
    }
  };

  const canRunBacktest = startDate && endDate && 
                        new Date(startDate) < new Date(endDate) && 
                        initialInvestment > 0 &&
                        !runBacktest.isPending;

  if (!portfolio) {
    return (
      <DashboardLayout title="Backtest Portfolio">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Portfolio not found</p>
          <Button onClick={() => router.push('/portfolios')} className="mt-4">
            Back to Portfolios
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`Backtest: ${portfolio.name}`}
      description="Test your portfolio's historical performance"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configure">Configure Test</TabsTrigger>
          <TabsTrigger value="results" disabled={!activeResult}>Results</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Configure Tab */}
        <TabsContent value="configure" className="space-y-6">
          {/* Portfolio Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Portfolio Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Assets</Label>
                  <p className="text-2xl font-bold">
                    {portfolio.portfolio_allocations?.length || 0}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Rebalancing</Label>
                  <p className="text-2xl font-bold">{portfolio.rebalance_frequency}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Threshold</Label>
                  <p className="text-2xl font-bold">{portfolio.rebalance_threshold}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Backtest Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Backtest Configuration
              </CardTitle>
              <CardDescription>
                Set the parameters for your historical analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={endDate}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="initialInvestment">Initial Investment (€)</Label>
                  <Input
                    id="initialInvestment"
                    type="number"
                    min="100"
                    max="1000000"
                    step="100"
                    value={initialInvestment}
                    onChange={(e) => setInitialInvestment(parseInt(e.target.value) || 10000)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rebalanceFrequency">Rebalancing Frequency</Label>
                  <Select
                    value={rebalanceFrequency}
                    onValueChange={setRebalanceFrequency}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEVER">Never</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                      <SelectItem value="ANNUALLY">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleRunBacktest}
                  disabled={!canRunBacktest}
                  className="w-full md:w-auto"
                  size="lg"
                >
                  {runBacktest.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Backtest...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Run Backtest
                    </>
                  )}
                </Button>
              </div>

              {runBacktest.error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Backtest Failed:</span>
                  </div>
                  <p className="mt-1 text-sm text-destructive">
                    {runBacktest.error.message}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {activeResult ? (
            <>
              {/* Key Metrics */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Return</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatDecimalAsPercentage(activeResult.totalReturn)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(activeResult.finalValue - activeResult.initialInvestment)} profit
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Annualized Return</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatDecimalAsPercentage(activeResult.annualizedReturn)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Per year average
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {activeResult.sharpeRatio.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Risk-adjusted return
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">
                      {formatDecimalAsPercentage(-activeResult.maxDrawdown)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Worst decline
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Chart */}
              {activeResult.performanceData && (
                <PerformanceChart
                  data={activeResult.performanceData}
                  initialInvestment={activeResult.initialInvestment}
                  title="Portfolio Performance Over Time"
                  height={400}
                />
              )}

              {/* Additional Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Volatility</Label>
                      <p className="text-xl font-bold">{formatDecimalAsPercentage(activeResult.volatility)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Win Rate</Label>
                      <p className="text-xl font-bold">{formatDecimalAsPercentage(activeResult.winRate)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Positive Months</Label>
                      <p className="text-xl font-bold">{activeResult.positiveMonths}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Negative Months</Label>
                      <p className="text-xl font-bold">{activeResult.negativeMonths}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Quality */}
              <Card>
                <CardHeader>
                  <CardTitle>Data Quality</CardTitle>
                  <CardDescription>
                    Information about the analysis data coverage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Assets Analyzed</span>
                      <span>{activeResult.assetsAnalyzed} / {activeResult.totalAssets}</span>
                    </div>
                    <Progress value={activeResult.dataCompleteness * 100} className="w-full" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Data Completeness</span>
                      <span>{formatDecimalAsPercentage(activeResult.dataCompleteness)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No backtest results yet. Run a backtest to see results here.</p>
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Backtest History</CardTitle>
              <CardDescription>
                Previous backtest results for this portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyData?.data && historyData.data.length > 0 ? (
                <div className="space-y-4">
                  {historyData.data.map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {result.start_date} to {result.end_date}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(result.initial_investment)} initial investment
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(result.created_at)}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <div className={cn(
                          "text-lg font-bold",
                          result.total_return >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {formatDecimalAsPercentage(result.total_return)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Sharpe: {result.sharpe_ratio.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No backtest history</h3>
                  <p className="mt-2 text-muted-foreground">
                    Run your first backtest to see historical analysis
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}