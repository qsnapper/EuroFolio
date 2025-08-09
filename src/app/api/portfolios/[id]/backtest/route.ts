import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { backtestEngine, BacktestParams } from '@/lib/backtesting/engine';

// POST /api/portfolios/[id]/backtest - Run backtest for portfolio
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: portfolioId } = await params;
    const supabase = createSupabaseServerClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      startDate,
      endDate,
      initialInvestment = 10000,
      rebalanceFrequency = 'ANNUALLY'
    } = body;

    // Validate required fields
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    // Get portfolio with allocations
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select(`
        *,
        portfolio_allocations (
          id,
          asset_id,
          percentage,
          assets (
            id,
            symbol,
            exchange,
            name,
            currency,
            type
          )
        )
      `)
      .eq('id', portfolioId)
      .single();

    if (portfolioError || !portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this portfolio
    if (portfolio.user_id !== user.id && !portfolio.is_public) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Validate portfolio has allocations
    if (!portfolio.portfolio_allocations || portfolio.portfolio_allocations.length === 0) {
      return NextResponse.json(
        { error: 'Portfolio has no asset allocations' },
        { status: 400 }
      );
    }

    // Fetch price data for all assets in the portfolio
    const assetIds = portfolio.portfolio_allocations.map((a: any) => a.asset_id);
    const priceDataMap: { [key: string]: any[] } = {};

    for (const assetId of assetIds) {
      const { data: priceData, error: priceError } = await supabase
        .from('price_data')
        .select('*')
        .eq('asset_id', assetId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (priceError) {
        console.error(`Error fetching price data for asset ${assetId}:`, priceError);
        continue;
      }

      if (!priceData || priceData.length === 0) {
        // Try to fetch from external API if no cached data
        const asset = portfolio.portfolio_allocations.find((a: any) => a.asset_id === assetId)?.assets;
        if (asset) {
          console.warn(`No price data found for asset ${asset.symbol} (${assetId}). External API integration needed.`);
          // TODO: Integrate with EODHD API to fetch missing data
        }
        continue;
      }

      priceDataMap[assetId] = priceData;
    }

    // Check if we have sufficient price data
    const assetsWithData = Object.keys(priceDataMap).length;
    const totalAssets = portfolio.portfolio_allocations.length;
    
    if (assetsWithData === 0) {
      return NextResponse.json(
        { 
          error: 'No price data available for any assets in the selected date range',
          details: 'Please ensure the database has historical price data for the portfolio assets.'
        },
        { status: 400 }
      );
    }

    if (assetsWithData < totalAssets) {
      console.warn(`Only ${assetsWithData}/${totalAssets} assets have price data`);
    }

    // Filter allocations to only include assets with price data
    const allocationsWithData = portfolio.portfolio_allocations.filter(
      (allocation: any) => priceDataMap[allocation.asset_id]
    );

    // Recalculate percentages to sum to 100% for available assets
    const totalAvailablePercentage = allocationsWithData.reduce(
      (sum: number, a: any) => sum + a.percentage, 0
    );
    
    const normalizedAllocations = allocationsWithData.map((allocation: any) => ({
      ...allocation,
      percentage: (allocation.percentage / totalAvailablePercentage) * 100
    }));

    // Run the backtest
    const backtestParams: BacktestParams = {
      portfolioId,
      startDate: start,
      endDate: end,
      initialInvestment,
      rebalanceFrequency: rebalanceFrequency as any
    };

    const backtestResult = await backtestEngine.runBacktest(
      normalizedAllocations,
      priceDataMap,
      backtestParams
    );

    // Store backtest result in database
    const { data: savedResult, error: saveError } = await supabase
      .from('backtest_results')
      .insert({
        portfolio_id: portfolioId,
        start_date: startDate,
        end_date: endDate,
        initial_investment: initialInvestment,
        total_return: backtestResult.totalReturn,
        annualized_return: backtestResult.annualizedReturn,
        volatility: backtestResult.volatility,
        sharpe_ratio: backtestResult.sharpeRatio,
        max_drawdown: backtestResult.maxDrawdown,
        best_year: backtestResult.yearlyReturns.length > 0 ? 
          Math.max(...backtestResult.yearlyReturns.map(y => y.return)) : null,
        worst_year: backtestResult.yearlyReturns.length > 0 ? 
          Math.min(...backtestResult.yearlyReturns.map(y => y.return)) : null,
        positive_months: backtestResult.positiveMonths,
        negative_months: backtestResult.negativeMonths
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving backtest result:', saveError);
      // Continue anyway - we'll return the result even if save fails
    }

    return NextResponse.json({
      data: {
        ...backtestResult,
        backtestId: savedResult?.id,
        portfolio: {
          id: portfolio.id,
          name: portfolio.name,
          description: portfolio.description
        },
        assetsAnalyzed: assetsWithData,
        totalAssets: totalAssets,
        dataCompleteness: assetsWithData / totalAssets
      }
    });

  } catch (error) {
    console.error('Backtest API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/portfolios/[id]/backtest - Get backtest history for portfolio
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: portfolioId } = await params;
    const supabase = createSupabaseServerClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get portfolio to check access
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('user_id, is_public, name')
      .eq('id', portfolioId)
      .single();

    if (portfolioError || !portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this portfolio
    if (portfolio.user_id !== user.id && !portfolio.is_public) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get backtest history
    const { data: backtests, error: backtestError } = await supabase
      .from('backtest_results')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (backtestError) {
      console.error('Error fetching backtest history:', backtestError);
      return NextResponse.json(
        { error: 'Failed to fetch backtest history' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: backtests || [],
      portfolio: {
        id: portfolioId,
        name: portfolio.name
      }
    });

  } catch (error) {
    console.error('Backtest history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}