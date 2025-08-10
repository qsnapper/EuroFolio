'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BarChart3, Settings, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { usePortfolios } from '@/hooks/use-portfolios';
import { useBacktestHistory } from '@/hooks/use-backtest';
import type { Portfolio } from '@/types';

export default function PortfolioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const portfolioId = params.id as string;

  const { data: portfoliosResponse, isLoading, error } = usePortfolios();
  const { data: backtestHistory } = useBacktestHistory(portfolioId);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);

  useEffect(() => {
    if (portfoliosResponse?.data) {
      const foundPortfolio = portfoliosResponse.data.find(p => p.id === portfolioId);
      setPortfolio(foundPortfolio || null);
    }
  }, [portfoliosResponse, portfolioId]);

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
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button 
              size="sm"
              onClick={() => router.push(`/portfolios/${portfolio.id}/backtest`)}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Run Backtest
            </Button>
          </div>
        </div>

        {/* Portfolio Overview Cards */}
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

        {/* Tabs */}
        <Tabs defaultValue="allocations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="allocations">Asset Allocation</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="allocations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation</CardTitle>
                <CardDescription>
                  Current asset allocation breakdown for this portfolio
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
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Analysis</CardTitle>
                <CardDescription>
                  Historical backtest results for this portfolio
                </CardDescription>
              </CardHeader>
              <CardContent>
                {backtestHistory?.data && backtestHistory.data.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        {backtestHistory.data.length} backtest{backtestHistory.data.length > 1 ? 's' : ''} run
                      </p>
                      <Button 
                        size="sm"
                        onClick={() => router.push(`/portfolios/${portfolio.id}/backtest`)}
                      >
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Run New Backtest
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {backtestHistory.data.slice(0, 5).map((result) => (
                        <div key={result.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <p className="font-medium text-sm">
                              {result.start_date} to {result.end_date}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              €{result.initial_investment.toLocaleString()} initial • Sharpe {result.sharpe_ratio.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${result.total_return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {(result.total_return * 100).toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {backtestHistory.data.length > 5 && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => router.push(`/portfolios/${portfolio.id}/backtest?tab=history`)}
                      >
                        View All {backtestHistory.data.length} Results
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      No backtest results yet.
                    </p>
                    <Button 
                      onClick={() => router.push(`/portfolios/${portfolio.id}/backtest`)}
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Run First Backtest
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Settings</CardTitle>
                <CardDescription>
                  Manage portfolio configuration and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Rebalancing Frequency</label>
                    <p className="text-sm text-muted-foreground">{portfolio.rebalance_frequency}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Rebalancing Threshold</label>
                    <p className="text-sm text-muted-foreground">{portfolio.rebalance_threshold}%</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Created</label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(portfolio.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Updated</label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(portfolio.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Button variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    Edit Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}