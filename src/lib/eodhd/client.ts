/**
 * EODHD API client for market data
 * https://eodhd.com/financial-apis/
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
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`EODHD API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
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
      const data = await this.makeRequest<EODHDSearchResult[]>('/search', {
        s: query.toUpperCase()
      });

      // Filter for European exchanges and relevant asset types
      return data.filter(asset => {
        const europeanExchanges = [
          'XETRA', 'LSE', 'EPA', 'BIT', 'AMS', 'SWX', 'OSL', 'CPH', 
          'HEL', 'ICE', 'WSE', 'BVLP', 'BIST', 'BSE', 'BUD', 'RIS',
          'F', 'DU', 'STU', 'HAM', 'BE', 'MU', 'L'
        ];
        
        const relevantTypes = ['ETF', 'Common Stock', 'Fund', 'Index'];
        
        return europeanExchanges.includes(asset.Exchange) && 
               relevantTypes.includes(asset.Type);
      });
    } catch (error) {
      console.error('Asset search failed:', error);
      return [];
    }
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
    const ticker = `${symbol}.${exchange}`;
    
    const data = await this.makeRequest<EODHDPriceData[]>('/eod', {
      s: ticker,
      from,
      to,
      period
    });

    return data || [];
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