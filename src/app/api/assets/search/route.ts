import { NextRequest, NextResponse } from 'next/server';
import { eodhd } from '@/lib/eodhd/client';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required and must be at least 2 characters' },
        { status: 400 }
      );
    }

    // First, search in our local database for cached assets
    const supabase = createSupabaseServerClient();
    const { data: cachedAssets, error: dbError } = await supabase
      .from('assets')
      .select('*')
      .or(`symbol.ilike.%${query}%,name.ilike.%${query}%,search_keywords.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(20);

    if (dbError) {
      console.error('Database search error:', dbError);
    }

    // If we have cached results, return them first
    const cachedResults = cachedAssets || [];

    // If we have less than 10 cached results, search EODHD API for more
    let apiResults: any[] = [];
    if (cachedResults.length < 10) {
      try {
        const searchResults = await eodhd.searchAssets(query);
        
        // Transform EODHD results to our format and cache them
        for (const asset of searchResults.slice(0, 10 - cachedResults.length)) {
          // Check if we already have this asset in our database
          const { data: existingAsset } = await supabase
            .from('assets')
            .select('id')
            .eq('symbol', asset.Code)
            .eq('exchange', asset.Exchange)
            .single();

          if (!existingAsset) {
            // Insert new asset into database
            const { data: newAsset, error: insertError } = await supabase
              .from('assets')
              .insert({
                symbol: asset.Code,
                exchange: asset.Exchange,
                name: asset.Name,
                isin: asset.ISIN,
                type: asset.Type === 'ETF' ? 'ETF' : 'STOCK',
                currency: asset.Currency,
                country: asset.Country,
                search_keywords: `${asset.Code} ${asset.Name} ${asset.ISIN || ''}`.toLowerCase(),
                last_api_update: new Date().toISOString()
              })
              .select()
              .single();

            if (!insertError && newAsset) {
              apiResults.push(newAsset);
            }
          }
        }
      } catch (apiError) {
        console.error('EODHD API search error:', apiError);
        // Continue with cached results only
      }
    }

    const allResults = [...cachedResults, ...apiResults];

    return NextResponse.json({
      data: allResults.slice(0, 20), // Limit to 20 results
      source: {
        cached: cachedResults.length,
        api: apiResults.length,
        total: allResults.length
      }
    });

  } catch (error) {
    console.error('Asset search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}