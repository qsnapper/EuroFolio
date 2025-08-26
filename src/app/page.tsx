import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MainNav } from '@/components/layout/main-nav';
import { 
  BarChart3, 
  TrendingUp, 
  Shield, 
  Globe,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EuroFolio - European Portfolio Analytics & Backtesting Platform',
  description: 'Backtest investment strategies, analyze portfolio performance, and optimize your investments with comprehensive analytics designed for European investors. Start free today.',
  keywords: ['portfolio backtesting', 'European investing', 'ETF analysis', 'investment analytics', 'portfolio optimization', 'stock analysis'],
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      
      {/* Hero Section */}
      <section className="container space-y-6 py-8 md:py-12 lg:py-32">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <Badge variant="secondary" className="mb-4">
            🚀 Now in Development
          </Badge>
          <h1 className="font-bold text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
            European Portfolio Analytics
          </h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            Backtest investment strategies, analyze performance, and optimize your portfolio 
            with our comprehensive analytics platform designed for European investors.
          </p>
          <div className="space-x-4">
            <Button size="lg" asChild>
              <Link href="/auth/register">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container space-y-6 py-8 md:py-12 lg:py-24">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
            Features
          </h2>
          <p className="max-w-[85rem] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Everything you need to analyze and optimize your investment portfolio
          </p>
        </div>
        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
          <Card>
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-primary" />
              <CardTitle>Portfolio Backtesting</CardTitle>
              <CardDescription>
                Test your investment strategies against historical market data with comprehensive performance metrics.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <TrendingUp className="h-12 w-12 text-primary" />
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                Deep dive into risk metrics, Sharpe ratios, maximum drawdown, and benchmark comparisons.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <Globe className="h-12 w-12 text-primary" />
              <CardTitle>European Focus</CardTitle>
              <CardDescription>
                Multi-currency support, ISIN compatibility, and coverage of major European exchanges.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="container space-y-6 py-8 md:py-12 lg:py-24">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
            Simple Pricing
          </h2>
          <p className="max-w-[85rem] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Start free and upgrade as your portfolio grows
          </p>
        </div>
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-3">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">€0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  3 portfolios
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Basic backtesting (1 year limit)
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  1 broker account
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="flex flex-col border-primary">
            <CardHeader>
              <Badge className="w-fit" variant="default">Most Popular</Badge>
              <CardTitle>Premium</CardTitle>
              <CardDescription>For serious investors</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">€3.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Unlimited portfolios
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Advanced analytics
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Multiple broker accounts
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Pro</CardTitle>
              <CardDescription>For professionals</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">€24.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  API access
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Priority data updates
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  White-label options
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              Built for European investors. © 2024 EuroFolio.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}