'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePortfolios } from '@/hooks/use-portfolios';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { 
  TrendingUp,
  Eye,
  Copy,
  Loader2,
  Star,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';

export default function PopularPortfoliosPage() {
  const { data: portfoliosData, isLoading, error } = usePortfolios(false, true);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  
  useDocumentTitle('Popular Portfolios - EuroFolio');

  const portfolios = portfoliosData?.data || [];

  const handleCopyPortfolio = async (portfolio: any) => {
    setCopyingId(portfolio.id);
    try {
      // Create a copy of this portfolio for the current user
      const portfolioData = {
        name: `${portfolio.name} (Copy)`,
        description: portfolio.description ? `${portfolio.description}\n\nCopied from popular portfolio.` : 'Copied from popular portfolio.',
        rebalance_frequency: portfolio.rebalance_frequency,
        rebalance_threshold: portfolio.rebalance_threshold,
        is_public: false, // Always private when copying
        allocations: portfolio.portfolio_allocations?.map((allocation: any) => ({
          asset_id: allocation.assets.id,
          percentage: allocation.percentage
        })) || []
      };

      const response = await fetch('/api/portfolios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(portfolioData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to copy portfolio');
      }

      const result = await response.json();
      
      // Navigate to the new portfolio
      window.location.href = `/portfolios/${result.data.id}`;
      
    } catch (error) {
      console.error('Portfolio copy error:', error);
      alert(error instanceof Error ? error.message : 'Failed to copy portfolio');
    } finally {
      setCopyingId(null);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Popular Portfolios">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Popular Portfolios">
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load popular portfolios</p>
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
      title="Popular Portfolios"
      description="Discover and copy successful portfolio strategies from the community"
    >
      {portfolios.length === 0 ? (
        <div className="text-center py-12">
          <Star className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Popular Portfolios Yet</h3>
          <p className="mt-2 text-muted-foreground">
            Check back later as our community creates and shares successful strategies
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/portfolios">
              <TrendingUp className="mr-2 h-4 w-4" />
              Browse All Portfolios
            </Link>
          </Button>
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
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Popular
                        </Badge>
                        {portfolio.is_benchmark && (
                          <Badge variant="outline" className="text-xs">
                            Benchmark
                          </Badge>
                        )}
                      </div>
                    </div>
                    {portfolio.description && (
                      <CardDescription className="line-clamp-3">
                        {portfolio.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {/* Allocation Summary */}
                  {portfolio.portfolio_allocations && portfolio.portfolio_allocations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Assets ({portfolio.portfolio_allocations.length})</h4>
                      <div className="space-y-1">
                        {portfolio.portfolio_allocations.slice(0, 3).map((allocation: any) => (
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

                  {/* Portfolio Metadata */}
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
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleCopyPortfolio(portfolio)}
                      disabled={copyingId === portfolio.id}
                    >
                      {copyingId === portfolio.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Copy className="mr-1 h-4 w-4" />
                      )}
                      Copy
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            About Popular Portfolios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Community Curated</h4>
              <p className="text-sm text-muted-foreground">
                These portfolios have been selected by our team for their strong performance, 
                sound methodology, or educational value for European investors.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">How to Use</h4>
              <p className="text-sm text-muted-foreground">
                Click &quot;Copy&quot; to create your own version of any popular portfolio. 
                You can then modify allocations and run backtests to see how it performs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}