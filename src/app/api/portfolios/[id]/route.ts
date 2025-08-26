import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/portfolios/[id] - Get single portfolio
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createSupabaseServerClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get portfolio with allocations
    const { data: portfolio, error } = await supabase
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
      .eq('id', id)
      .or(`user_id.eq.${user.id},is_public.eq.true`)
      .single();

    if (error || !portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: portfolio });

  } catch (error) {
    console.error('Portfolio fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/portfolios/[id] - Update portfolio
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createSupabaseServerClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user owns this portfolio
    const { data: existingPortfolio, error: checkError } = await supabase
      .from('portfolios')
      .select('user_id')
      .eq('id', id)
      .single();

    if (checkError || !existingPortfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    if (existingPortfolio.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      rebalance_frequency = 'ANNUALLY',
      rebalance_threshold = 5.0,
      is_public = false,
      is_popular,
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

    // Check if user is admin for popular field updates
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    const updateData: any = {
      name,
      description,
      rebalance_frequency,
      rebalance_threshold,
      is_public,
      updated_at: new Date().toISOString()
    };

    // Only admins can update is_popular
    if (userProfile?.is_admin && typeof is_popular === 'boolean') {
      updateData.is_popular = is_popular;
    }

    // Update portfolio info
    const { error: portfolioError } = await supabase
      .from('portfolios')
      .update(updateData)
      .eq('id', id);

    if (portfolioError) {
      console.error('Portfolio update error:', portfolioError);
      return NextResponse.json(
        { error: 'Failed to update portfolio' },
        { status: 500 }
      );
    }

    // Delete existing allocations
    const { error: deleteError } = await supabase
      .from('portfolio_allocations')
      .delete()
      .eq('portfolio_id', id);

    if (deleteError) {
      console.error('Allocation deletion error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to update allocations' },
        { status: 500 }
      );
    }

    // Insert new allocations
    const allocationInserts = allocations.map((allocation: any) => ({
      portfolio_id: id,
      asset_id: allocation.asset_id,
      percentage: allocation.percentage,
      expense_ratio: allocation.expense_ratio || null
    }));

    const { error: allocationError } = await supabase
      .from('portfolio_allocations')
      .insert(allocationInserts);

    if (allocationError) {
      console.error('Allocation creation error:', allocationError);
      return NextResponse.json(
        { error: 'Failed to update allocations' },
        { status: 500 }
      );
    }

    // Fetch the updated portfolio with allocations
    const { data: updatedPortfolio } = await supabase
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
      .eq('id', id)
      .single();

    return NextResponse.json({
      data: updatedPortfolio,
      message: 'Portfolio updated successfully'
    });

  } catch (error) {
    console.error('Portfolio update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/portfolios/[id] - Delete portfolio  
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createSupabaseServerClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user owns this portfolio
    const { data: portfolio, error: checkError } = await supabase
      .from('portfolios')
      .select('user_id')
      .eq('id', id)
      .single();

    if (checkError || !portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    if (portfolio.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete portfolio (allocations will be cascade deleted)
    const { error: deleteError } = await supabase
      .from('portfolios')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Portfolio deletion error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete portfolio' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Portfolio deleted successfully' });

  } catch (error) {
    console.error('Portfolio deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}