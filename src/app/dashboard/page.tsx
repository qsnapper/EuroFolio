'use client';

import { useAuth } from '@/context/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  Plus, 
  TrendingUp, 
  BarChart3, 
  Briefcase,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function DashboardPage() {
  const { user, profile } = useAuth();

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
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Create your first portfolio to get started
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
            <div className="text-2xl font-bold">Free</div>
            <p className="text-xs text-muted-foreground">
              3 portfolios remaining
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Section */}
      <div className="grid gap-6 md:grid-cols-2">
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">European Index Fund Mix</p>
                  <p className="text-sm text-muted-foreground">70% Stocks, 30% Bonds</p>
                </div>
                <Badge variant="outline">+8.2%</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Tech Growth Portfolio</p>
                  <p className="text-sm text-muted-foreground">Focus on EU tech stocks</p>
                </div>
                <Badge variant="outline">+12.4%</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Conservative Balanced</p>
                  <p className="text-sm text-muted-foreground">Low-risk diversified</p>
                </div>
                <Badge variant="outline">+5.8%</Badge>
              </div>
            </div>
            
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/portfolios/popular">
                Browse Popular Portfolios
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