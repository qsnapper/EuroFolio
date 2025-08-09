import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { eodhd } from '@/lib/eodhd/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Query parameters "from" and "to" are required (YYYY-MM-DD format)' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Get asset information
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .single();

    if (assetError || !asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    // First, try to get cached price data from database
    const { data: cachedPrices, error: priceError } = await supabase
      .from('price_data')
      .select('*')
      .eq('asset_id', id)
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: true });

    if (priceError) {
      console.error('Database price fetch error:', priceError);
    }

    const cachedData = cachedPrices || [];
    
    // Check if we need to fetch missing data from API
    const startDate = new Date(from);
    const endDate = new Date(to);
    const existingDates = new Set(cachedData.map(p => p.date));
    const missingDates: string[] = [];

    // Find missing dates (simplified - check if we have significant gaps)
    if (cachedData.length === 0 || 
        new Date(cachedData[0].date) > startDate ||
        new Date(cachedData[cachedData.length - 1].date) < endDate) {
      
      try {
        // Fetch missing data from EODHD
        const historicalPrices = await eodhd.getHistoricalPrices(
          asset.symbol,
          asset.exchange,
          from,
          to
        );

        // Insert new price data into database
        const newPriceData = [];
        for (const price of historicalPrices) {
          if (!existingDates.has(price.date)) {
            const { data: insertedPrice, error: insertError } = await supabase
              .from('price_data')
              .insert({
                asset_id: id,
                date: price.date,
                open_price: price.open,
                high_price: price.high,
                low_price: price.low,
                close_price: price.close,
                adjusted_close: price.adjusted_close,
                volume: price.volume
              })
              .select()
              .single();

            if (!insertError && insertedPrice) {
              newPriceData.push(insertedPrice);
            }
          }
        }

        // Combine cached and new data
        const allPriceData = [...cachedData, ...newPriceData]
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return NextResponse.json({
          data: allPriceData,
          asset: {
            id: asset.id,
            symbol: asset.symbol,
            exchange: asset.exchange,
            name: asset.name,
            currency: asset.currency
          },
          source: {
            cached: cachedData.length,
            api: newPriceData.length,
            total: allPriceData.length
          }
        });

      } catch (apiError) {
        console.error('EODHD API price fetch error:', apiError);
        // Return cached data only if API fails
        return NextResponse.json({
          data: cachedData,
          asset: {
            id: asset.id,
            symbol: asset.symbol,
            exchange: asset.exchange,
            name: asset.name,
            currency: asset.currency
          },
          source: {
            cached: cachedData.length,
            api: 0,
            total: cachedData.length
          },
          warning: 'Some data may be incomplete due to API limitations'
        });
      }
    }

    // Return cached data if complete
    return NextResponse.json({
      data: cachedData,
      asset: {
        id: asset.id,
        symbol: asset.symbol,
        exchange: asset.exchange,
        name: asset.name,
        currency: asset.currency
      },
      source: {
        cached: cachedData.length,
        api: 0,
        total: cachedData.length
      }
    });

  } catch (error) {
    console.error('Price data fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}