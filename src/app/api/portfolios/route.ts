import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// GET /api/portfolios - Get user's portfolios
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includePublic = searchParams.get('include_public') === 'true';
    const isPopular = searchParams.get('popular') === 'true';

    let query = supabase
      .from('portfolios')
      .select(`
        *,
        portfolio_allocations (
          id,
          percentage,
          expense_ratio,
          assets (
            id,
            symbol,
            exchange,
            name,
            currency,
            type,
            expense_ratio
          )
        )
      `);

    if (isPopular) {
      // Get popular public portfolios
      query = query.eq('is_popular', true).eq('is_public', true);
    } else if (includePublic) {
      // Get user's portfolios + public ones
      query = query.or(`user_id.eq.${user.id},is_public.eq.true`);
    } else {
      // Get only user's portfolios
      query = query.eq('user_id', user.id);
    }

    query = query.order('created_at', { ascending: false });

    const { data: portfolios, error } = await query;

    if (error) {
      console.error('Portfolio fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch portfolios' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: portfolios });

  } catch (error) {
    console.error('Portfolio API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/portfolios - Create new portfolio
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      rebalance_frequency = 'ANNUALLY',
      rebalance_threshold = 5.0,
      is_public = false,
      allocations = []
    } = body;

    // Validate required fields
    if (!name || !Array.isArray(allocations) || allocations.length === 0) {
      return NextResponse.json(
        { error: 'Name and allocations are required' },
        { status: 400 }
      );
    }

    // Validate allocation percentages sum to 100%
    const totalPercentage = allocations.reduce((sum: number, allocation: any) => {
      return sum + (allocation.percentage || 0);
    }, 0);

    if (Math.abs(totalPercentage - 100) > 0.01) {
      return NextResponse.json(
        { error: `Allocation percentages must sum to 100%. Current total: ${totalPercentage}%` },
        { status: 400 }
      );
    }

    // Check subscription limits (Free tier: 3 portfolios)
    const { data: existingPortfolios } = await supabase
      .from('portfolios')
      .select('id')
      .eq('user_id', user.id);

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const maxPortfolios = profile?.subscription_tier === 'FREE' ? 3 : 
                         profile?.subscription_tier === 'PREMIUM' ? 100 : 1000;

    if (existingPortfolios && existingPortfolios.length >= maxPortfolios) {
      return NextResponse.json(
        { error: `Portfolio limit reached. Upgrade to create more portfolios.` },
        { status: 403 }
      );
    }

    // Create portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .insert({
        user_id: user.id,
        name,
        description,
        rebalance_frequency,
        rebalance_threshold,
        is_public
      })
      .select()
      .single();

    if (portfolioError || !portfolio) {
      console.error('Portfolio creation error:', portfolioError);
      return NextResponse.json(
        { error: 'Failed to create portfolio' },
        { status: 500 }
      );
    }

    // Create portfolio allocations
    const allocationInserts = allocations.map((allocation: any) => ({
      portfolio_id: portfolio.id,
      asset_id: allocation.asset_id,
      percentage: allocation.percentage,
      expense_ratio: allocation.expense_ratio || null
    }));

    const { error: allocationError } = await supabase
      .from('portfolio_allocations')
      .insert(allocationInserts);

    if (allocationError) {
      console.error('Allocation creation error:', allocationError);
      // Rollback - delete the portfolio
      await supabase.from('portfolios').delete().eq('id', portfolio.id);
      return NextResponse.json(
        { error: 'Failed to create portfolio allocations' },
        { status: 500 }
      );
    }

    // Fetch the complete portfolio with allocations
    const { data: completePortfolio } = await supabase
      .from('portfolios')
      .select(`
        *,
        portfolio_allocations (
          id,
          percentage,
          expense_ratio,
          assets (
            id,
            symbol,
            exchange,
            name,
            currency,
            type,
            expense_ratio
          )
        )
      `)
      .eq('id', portfolio.id)
      .single();

    return NextResponse.json({
      data: completePortfolio,
      message: 'Portfolio created successfully'
    });

  } catch (error) {
    console.error('Portfolio creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}