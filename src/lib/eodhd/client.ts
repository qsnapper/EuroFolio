/**
 * EODHD API client for market data
 * https://eodhd.com/financial-apis/
 * 
 * Uses real EODHD API for asset search and historical price data.
 * Focuses on European markets and popular asset types (ETF, Stocks, etc.)
 */

import { env } from '@/lib/env';

export interface EODHDSearchResult {
  Code: string;
  Name: string;
  Country: string;
  Exchange: string;
  Currency: string;
  Type: string;
  ISIN?: string;
}

export interface EODHDPriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjusted_close: number;
  volume: number;
}

export interface EODHDExchangeRate {
  date: string;
  rate: number;
}

class EODHDClient {
  private baseUrl = 'https://eodhd.com/api';
  private apiKey: string;
  private dailyCallCount = 0;
  private maxDailyCalls = 20; // Free tier limit
  private lastResetDate = new Date().toDateString();

  constructor() {
    this.apiKey = env.EODHD_API_TOKEN;
    if (!this.apiKey) {
      console.warn('EODHD API token not configured');
    }
  }

  private checkRateLimit(): boolean {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.dailyCallCount = 0;
      this.lastResetDate = today;
    }

    if (this.dailyCallCount >= this.maxDailyCalls) {
      console.warn('EODHD API rate limit reached for today');
      return false;
    }

    return true;
  }

  private incrementCallCount(): void {
    this.dailyCallCount++;
    // TODO: Update database with API usage tracking
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    if (!this.checkRateLimit()) {
      throw new Error('API rate limit exceeded');
    }

    if (!this.apiKey) {
      throw new Error('EODHD API token not configured');
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set('api_token', this.apiKey);
    url.searchParams.set('fmt', 'json');

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    try {
      console.log('Making EODHD API request to:', url.toString());
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        console.error(`EODHD API error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`EODHD API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('EODHD API raw response:', JSON.stringify(data, null, 2));
      this.incrementCallCount();
      
      return data;
    } catch (error) {
      console.error('EODHD API request failed:', error);
      throw error;
    }
  }

  /**
   * Search for assets by query string
   */
  async searchAssets(query: string): Promise<EODHDSearchResult[]> {
    try {
      console.log(`Searching for assets with query: ${query}`);
      
      // Try direct search with the query (could be symbol, ISIN, or name)
      const data = await this.makeRequest<EODHDSearchResult[]>(`/search/${query.toUpperCase()}`);
      
      console.log('Data is array:', Array.isArray(data));
      console.log('Data length:', data?.length);
      
      if (data && Array.isArray(data)) {
        const filtered = this.filterEuropeanAssets(data, query);
        console.log('Filtered results:', JSON.stringify(filtered, null, 2));
        return filtered;
      }
      
      // If direct search fails or returns non-array, try searching major European exchanges
      const exchanges = ['LSE', 'XETRA', 'AMS', 'EPA']; // Major European exchanges
      const allResults: EODHDSearchResult[] = [];
      
      for (const exchange of exchanges) {
        try {
          const exchangeData = await this.makeRequest<EODHDSearchResult[]>(`/exchange-symbol-list/${exchange}`);
          if (exchangeData && Array.isArray(exchangeData)) {
            // Filter by query within exchange data
            const filtered = exchangeData.filter(asset => 
              asset.Name?.toLowerCase().includes(query.toLowerCase()) ||
              asset.Code?.toLowerCase().includes(query.toLowerCase()) ||
              asset.ISIN?.toLowerCase().includes(query.toLowerCase())
            );
            allResults.push(...filtered);
          }
        } catch (exchangeError) {
          console.warn(`Search failed for exchange ${exchange}:`, exchangeError);
          continue;
        }
        
        // Limit results to avoid too many API calls
        if (allResults.length >= 20) break;
      }
      
      return this.filterEuropeanAssets(allResults, query).slice(0, 10);
      
    } catch (error) {
      console.error('Asset search failed:', error);
      return [];
    }
  }

  private filterEuropeanAssets(data: EODHDSearchResult[], query: string): EODHDSearchResult[] {
    console.log('Starting filtering with', data.length, 'assets');
    
    const europeanExchanges = [
      'XETRA', 'LSE', 'EPA', 'BIT', 'AMS', 'SWX', 'OSL', 'CPH', 
      'HEL', 'ICE', 'WSE', 'BVLP', 'BIST', 'BSE', 'BUD', 'RIS',
      'F', 'DU', 'STU', 'HAM', 'BE', 'MU', 'L'
    ];
    
    const relevantTypes = ['ETF', 'Common Stock', 'Fund', 'Index'];
    
    // For ISIN searches, be less restrictive on filtering
    const isISINQuery = query.match(/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/);
    
    return data.filter(asset => {
      console.log(`Checking asset: ${asset.Code} (${asset.Exchange}) - ${asset.Type} - ${asset.Name}`);
      
      // For ISIN queries, don't filter by query match since ISIN might not appear in name/code
      if (isISINQuery) {
        const isEuropean = europeanExchanges.includes(asset.Exchange);
        const isRelevantType = relevantTypes.includes(asset.Type);
        
        console.log(`  ISIN search - European: ${isEuropean}, RelevantType: ${isRelevantType}`);
        return isEuropean && isRelevantType;
      }
      
      // For non-ISIN queries, use the original logic
      const isEuropean = europeanExchanges.includes(asset.Exchange);
      const isRelevantType = relevantTypes.includes(asset.Type);
      const matchesQuery = asset.Name?.toLowerCase().includes(query.toLowerCase()) ||
                          asset.Code?.toLowerCase().includes(query.toLowerCase()) ||
                          asset.ISIN?.toLowerCase().includes(query.toLowerCase());
      
      console.log(`  European: ${isEuropean}, RelevantType: ${isRelevantType}, MatchesQuery: ${matchesQuery}`);
      return isEuropean && isRelevantType && matchesQuery;
    }).slice(0, 10); // Limit to top 10 results
  }

  /**
   * Get historical price data for an asset
   */
  async getHistoricalPrices(
    symbol: string,
    exchange: string,
    from: string,
    to: string,
    period = 'd' // d = daily, w = weekly, m = monthly
  ): Promise<EODHDPriceData[]> {
    try {
      const ticker = `${symbol}.${exchange}`;
      console.log(`Getting historical prices for ${ticker} from ${from} to ${to}`);
      
      // EODHD API format: /eod/{TICKER} not /eod?s={TICKER}
      const data = await this.makeRequest<EODHDPriceData[]>(`/eod/${ticker}`, {
        from,
        to,
        period
      });

      return data || [];
    } catch (error) {
      console.error(`Failed to get historical prices for ${symbol}.${exchange}:`, error);
      return [];
    }
  }

  /**
   * Get current/latest price for an asset
   */
  async getCurrentPrice(symbol: string, exchange: string): Promise<EODHDPriceData | null> {
    try {
      const ticker = `${symbol}.${exchange}`;
      const data = await this.makeRequest<EODHDPriceData[]>('/eod', {
        s: ticker,
        period: 'd'
      });

      return data && data.length > 0 ? data[data.length - 1] : null;
    } catch (error) {
      console.error('Current price fetch failed:', error);
      return null;
    }
  }

  /**
   * Get exchange rates between currencies
   */
  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    date?: string
  ): Promise<number> {
    if (fromCurrency === toCurrency) return 1;

    try {
      const ticker = `${fromCurrency}${toCurrency}`;
      const params: Record<string, string> = {
        s: ticker
      };

      if (date) {
        params.from = date;
        params.to = date;
      }

      const data = await this.makeRequest<EODHDExchangeRate[]>('/eod', params);
      
      if (data && data.length > 0) {
        return data[data.length - 1].rate;
      }

      // Fallback: try reverse rate
      const reverseTicker = `${toCurrency}${fromCurrency}`;
      const reverseData = await this.makeRequest<EODHDExchangeRate[]>('/eod', {
        s: reverseTicker,
        ...(date && { from: date, to: date })
      });

      if (reverseData && reverseData.length > 0) {
        return 1 / reverseData[reverseData.length - 1].rate;
      }

      throw new Error('Exchange rate not found');
    } catch (error) {
      console.error('Exchange rate fetch failed:', error);
      return 1; // Fallback to 1:1 rate
    }
  }

  /**
   * Get multiple assets' current prices in batch
   */
  async getBatchPrices(tickers: string[]): Promise<Record<string, EODHDPriceData>> {
    const results: Record<string, EODHDPriceData> = {};
    
    // EODHD doesn't support batch requests in free tier,
    // so we need to make individual requests (within rate limits)
    for (const ticker of tickers.slice(0, Math.min(tickers.length, this.maxDailyCalls - this.dailyCallCount))) {
      try {
        const [symbol, exchange] = ticker.split('.');
        const price = await this.getCurrentPrice(symbol, exchange);
        if (price) {
          results[ticker] = price;
        }
      } catch (error) {
        console.error(`Failed to get price for ${ticker}:`, error);
      }
    }

    return results;
  }

  /**
   * Get API usage statistics
   */
  getUsageStats() {
    return {
      dailyCallCount: this.dailyCallCount,
      maxDailyCalls: this.maxDailyCalls,
      remainingCalls: this.maxDailyCalls - this.dailyCallCount,
      resetDate: this.lastResetDate
    };
  }
}

// Export singleton instance
export const eodhd = new EODHDClient();