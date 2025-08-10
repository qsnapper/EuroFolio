/**
 * Core TypeScript types for EuroFolio application
 */

// Database Types
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  country: string;
  primary_currency: string;
  secondary_currency: string;
  locale: string;
  subscription_tier: 'FREE' | 'PREMIUM' | 'PRO';
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  symbol: string;
  exchange: string;
  name: string;
  isin?: string;
  type: 'ETF' | 'STOCK' | 'BOND' | 'INDEX';
  currency: string;
  country?: string;
  expense_ratio?: number;
  symbol_variations?: string[];
  search_keywords?: string;
  previous_close?: number;
  previous_close_date?: string;
  last_api_update?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  rebalance_frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'NEVER';
  rebalance_threshold: number;
  is_public: boolean;
  is_popular: boolean;
  is_benchmark: boolean;
  created_at: string;
  updated_at: string;
  // Joined data from portfolio_allocations
  portfolio_allocations?: PortfolioAllocationWithAsset[];
}

export interface PortfolioAllocation {
  id: string;
  portfolio_id: string;
  asset_id: string;
  percentage: number;
  created_at: string;
}

export interface PortfolioAllocationWithAsset extends PortfolioAllocation {
  assets?: Asset;
}

export interface PriceData {
  id: string;
  asset_id: string;
  date: string;
  open_price?: number;
  high_price?: number;
  low_price?: number;
  close_price: number;
  adjusted_close?: number;
  volume?: number;
  created_at: string;
}

// Business Logic Types
export interface BacktestParams {
  portfolioId: string;
  startDate: Date;
  endDate: Date;
  initialInvestment?: number;
  rebalanceFrequency?: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'NEVER';
}

export interface BacktestResult {
  id: string;
  portfolio_id: string;
  start_date: string;
  end_date: string;
  initial_investment: number;
  total_return: number;
  annualized_return: number;
  volatility: number;
  sharpe_ratio: number;
  max_drawdown: number;
  created_at: string;
}

export interface PerformancePoint {
  date: string;
  value: number;
  dailyReturn?: number;
  cumulativeReturn: number;
}

// API Types
export interface AssetSearchResult {
  Code: string;
  Name: string;
  Country: string;
  Exchange: string;
  Currency: string;
  Type: string;
  ISIN?: string;
}

export interface EODHDApiResponse<T> {
  data: T;
  error?: string;
}

// Form Types
export interface PortfolioFormData {
  name: string;
  description?: string;
  rebalance_frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'NEVER';
  rebalance_threshold: number;
  is_public: boolean;
}

export interface AssetAllocationForm {
  asset_id: string;
  symbol: string;
  name: string;
  percentage: number;
}

// State Management Types
export interface AppState {
  user: Profile | null;
  portfolios: Portfolio[];
  selectedPortfolio: Portfolio | null;
  isLoading: boolean;
  error: string | null;
}

// Utility Types
export type DateRange = {
  from: Date;
  to: Date;
};

export type SortOrder = 'asc' | 'desc';

export type TableColumn<T> = {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
};