'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePortfolios, useDeletePortfolio } from '@/hooks/use-portfolios';
import { 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  BarChart3,
  Calendar,
  TrendingUp,
  Eye,
  EyeOff,
  Loader2,
  Briefcase
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/lib/utils';

export default function PortfoliosPage() {
  const [view, setView] = useState<'my' | 'popular'>('my');
  const { data: portfoliosData, isLoading, error } = usePortfolios(false, view === 'popular');
  const deletePortfolio = useDeletePortfolio();

  const portfolios = portfoliosData?.data || [];

  const handleDeletePortfolio = async (portfolioId: string, portfolioName: string) => {
    if (window.confirm(`Are you sure you want to delete "${portfolioName}"? This action cannot be undone.`)) {
      try {
        await deletePortfolio.mutateAsync(portfolioId);
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete portfolio. Please try again.');
      }
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Portfolios">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Portfolios">
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load portfolios</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="My Portfolios"
      description="Manage your investment portfolios and strategies"
      action={
        <Button asChild>
          <Link href="/portfolios/new">
            <Plus className="mr-2 h-4 w-4" />
            New Portfolio
          </Link>
        </Button>
      }
    >
      {/* View Toggle */}
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant={view === 'my' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('my')}
        >
          My Portfolios
        </Button>
        <Button
          variant={view === 'popular' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('popular')}
        >
          Popular
        </Button>
      </div>

      {/* Portfolios Grid */}
      {portfolios.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">
            {view === 'my' ? 'No portfolios yet' : 'No popular portfolios'}
          </h3>
          <p className="mt-2 text-muted-foreground">
            {view === 'my' 
              ? 'Create your first portfolio to get started with backtesting'
              : 'Check back later for community-created portfolios'
            }
          </p>
          {view === 'my' && (
            <Button asChild className="mt-4">
              <Link href="/portfolios/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Portfolio
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {portfolios.map((portfolio) => (
            <Card key={portfolio.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg truncate">
                        {portfolio.name}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        {portfolio.is_public ? (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                        {portfolio.is_popular && (
                          <Badge variant="secondary" className="text-xs">
                            Popular
                          </Badge>
                        )}
                        {portfolio.is_benchmark && (
                          <Badge variant="outline" className="text-xs">
                            Benchmark
                          </Badge>
                        )}
                      </div>
                    </div>
                    {portfolio.description && (
                      <CardDescription className="line-clamp-2">
                        {portfolio.description}
                      </CardDescription>
                    )}
                  </div>
                  
                  {view === 'my' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/portfolios/${portfolio.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/portfolios/${portfolio.id}/backtest`}>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Backtest
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeletePortfolio(portfolio.id, portfolio.name)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {/* Allocation Summary */}
                  {portfolio.portfolio_allocations && portfolio.portfolio_allocations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Assets ({portfolio.portfolio_allocations.length})</h4>
                      <div className="space-y-1">
                        {portfolio.portfolio_allocations.slice(0, 3).map((allocation) => (
                          <div key={allocation.id} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <span className="font-medium">{allocation.assets?.symbol}</span>
                              <Badge variant="outline" className="text-xs">
                                {allocation.assets?.type}
                              </Badge>
                            </span>
                            <span className="text-muted-foreground">
                              {allocation.percentage}%
                            </span>
                          </div>
                        ))}
                        {portfolio.portfolio_allocations.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{portfolio.portfolio_allocations.length - 3} more assets
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Portfolio Settings */}
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Rebalancing:</span>
                      <span className="font-medium">{portfolio.rebalance_frequency}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Created:</span>
                      <span className="font-medium">{formatDate(portfolio.created_at)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 flex gap-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/portfolios/${portfolio.id}`}>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/portfolios/${portfolio.id}/backtest`}>
                        <BarChart3 className="mr-1 h-4 w-4" />
                        Backtest
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}