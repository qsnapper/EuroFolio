'use client';

import { useAuth } from '@/context/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePortfolios } from '@/hooks/use-portfolios';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { 
  Plus, 
  TrendingUp, 
  BarChart3, 
  Briefcase,
  ArrowUpRight,
  Loader2,
  Eye,
  Star
} from 'lucide-react';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { data: portfoliosData, isLoading: portfoliosLoading } = usePortfolios(false, false);
  const { data: popularPortfoliosData, isLoading: popularLoading } = usePortfolios(false, true);

  const portfolios = portfoliosData?.data || [];
  const popularPortfolios = popularPortfoliosData?.data || [];
  const portfolioCount = portfolios.length;

  // Calculate subscription limits
  const maxPortfolios = profile?.subscription_tier === 'FREE' ? 3 : 
                       profile?.subscription_tier === 'PREMIUM' ? 100 : 1000;
  const remainingPortfolios = Math.max(0, maxPortfolios - portfolioCount);

  if (!user) {
    return null; // Middleware should redirect, but just in case
  }

  return (
    <DashboardLayout
      title={`Welcome back${profile?.full_name ? `, ${profile.full_name}` : ''}!`}
      description="Here's an overview of your portfolio performance"
      action={
        <Button asChild>
          <Link href="/portfolios/new">
            <Plus className="mr-2 h-4 w-4" />
            New Portfolio
          </Link>
        </Button>
      }
    >
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolios</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {portfoliosLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <div className="text-2xl font-bold">-</div>
              </div>
            ) : (
              <div className="text-2xl font-bold">{portfolioCount}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {portfolioCount === 0 
                ? 'Create your first portfolio to get started'
                : `${remainingPortfolios} remaining in ${profile?.subscription_tier || 'FREE'} plan`
              }
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backtest Results</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              No backtests run yet
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Performing</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Create portfolios to see performance
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            <Badge variant="secondary">{profile?.subscription_tier || 'FREE'}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.subscription_tier || 'Free'}</div>
            <p className="text-xs text-muted-foreground">
              {portfoliosLoading 
                ? 'Loading...'
                : `${remainingPortfolios} portfolios remaining`
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Portfolios */}
      {portfolios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Recent Portfolios
            </CardTitle>
            <CardDescription>
              Your latest portfolio activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {portfolios.slice(0, 5).map((portfolio) => (
                <div key={portfolio.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{portfolio.name}</p>
                      <div className="flex items-center gap-1">
                        {portfolio.is_public && <Eye className="h-3 w-3 text-muted-foreground" />}
                        {portfolio.is_popular && (
                          <Badge variant="secondary" className="text-xs">Popular</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {portfolio.portfolio_allocations?.length || 0} assets • 
                      Created {formatDate(portfolio.created_at)}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/portfolios/${portfolio.id}`}>
                      View
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
            
            {portfolios.length > 5 && (
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/portfolios">
                  View All Portfolios ({portfolios.length})
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Getting Started or Quick Actions */}
      <div className={portfolios.length > 0 ? "grid gap-6 md:grid-cols-1" : "grid gap-6 md:grid-cols-2"}>
        {portfolios.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Quick Start
              </CardTitle>
              <CardDescription>
                Get started with portfolio analysis in minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Create your first portfolio</p>
                    <p className="text-sm text-muted-foreground">Add assets and set allocations</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Run your first backtest</p>
                    <p className="text-sm text-muted-foreground">See historical performance</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Analyze and optimize</p>
                    <p className="text-sm text-muted-foreground">Compare with benchmarks</p>
                  </div>
                </div>
              </div>
              
              <Button className="w-full" asChild>
                <Link href="/portfolios/new">
                  Create Your First Portfolio
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common portfolio management tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" asChild>
                <Link href="/portfolios/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Portfolio
                </Link>
              </Button>
              
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/portfolios">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Manage Portfolios ({portfolioCount})
                </Link>
              </Button>
              
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/portfolios/popular">
                  <Star className="mr-2 h-4 w-4" />
                  Browse Popular Portfolios
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Popular Portfolios
            </CardTitle>
            <CardDescription>
              Explore community-created portfolios
            </CardDescription>
          </CardHeader>
          <CardContent>
            {popularLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : popularPortfolios.length > 0 ? (
              <div className="space-y-3">
                {popularPortfolios.slice(0, 3).map((portfolio) => (
                  <div key={portfolio.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{portfolio.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {portfolio.portfolio_allocations?.length || 0} assets • 
                        {portfolio.rebalance_frequency.toLowerCase()}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/portfolios/${portfolio.id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">
                  No popular portfolios available yet
                </p>
              </div>
            )}
            
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/portfolios/popular">
                Browse All Popular Portfolios
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your account details and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Primary Currency</p>
              <p className="text-sm text-muted-foreground">{profile?.primary_currency || 'EUR'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Country</p>
              <p className="text-sm text-muted-foreground">{profile?.country || 'Spain'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Member Since</p>
              <p className="text-sm text-muted-foreground">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Today'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}