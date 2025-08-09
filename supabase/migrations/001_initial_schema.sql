-- EuroFolio Initial Database Schema
-- This implements the core database structure for the portfolio analytics platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles extending Supabase auth
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  country TEXT DEFAULT 'ES',
  primary_currency TEXT DEFAULT 'EUR',
  secondary_currency TEXT DEFAULT 'USD',
  locale TEXT DEFAULT 'en-GB', -- For number/date formatting
  is_admin BOOLEAN DEFAULT false,
  subscription_tier TEXT DEFAULT 'FREE' CHECK (subscription_tier IN ('FREE', 'PREMIUM', 'PRO')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Assets with enhanced discovery support
CREATE TABLE assets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  symbol TEXT NOT NULL,
  exchange TEXT NOT NULL,
  name TEXT NOT NULL,
  isin TEXT,
  type TEXT NOT NULL CHECK (type IN ('ETF', 'STOCK', 'BOND', 'INDEX')),
  currency TEXT NOT NULL DEFAULT 'EUR',
  country TEXT,
  expense_ratio DECIMAL(5,4),
  
  -- Enhanced discovery fields
  symbol_variations TEXT[], -- Alternative tickers
  search_keywords TEXT, -- For fuzzy matching
  
  -- Market data
  previous_close DECIMAL(12,4),
  previous_close_date DATE,
  last_api_update TIMESTAMP WITH TIME ZONE,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(symbol, exchange)
);

-- Historical price data
CREATE TABLE price_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  open_price DECIMAL(12,4),
  high_price DECIMAL(12,4),
  low_price DECIMAL(12,4),
  close_price DECIMAL(12,4) NOT NULL,
  adjusted_close DECIMAL(12,4),
  volume BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(asset_id, date)
);

-- Exchange rates with proper decimal storage
CREATE TABLE exchange_rates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate DECIMAL(12,6) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(from_currency, to_currency, date)
);

-- API rate limit tracking
CREATE TABLE api_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  api_provider TEXT NOT NULL DEFAULT 'EODHD',
  call_date DATE NOT NULL,
  call_count INTEGER DEFAULT 0,
  priority_1_calls INTEGER DEFAULT 0, -- Critical
  priority_2_calls INTEGER DEFAULT 0, -- High
  priority_3_calls INTEGER DEFAULT 0, -- Medium
  priority_4_calls INTEGER DEFAULT 0, -- Low
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(api_provider, call_date)
);

-- Portfolios with comparison features
CREATE TABLE portfolios (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rebalance_frequency TEXT DEFAULT 'ANNUALLY' CHECK (rebalance_frequency IN ('MONTHLY', 'QUARTERLY', 'ANNUALLY', 'NEVER')),
  rebalance_threshold DECIMAL(5,2) DEFAULT 5.0, -- Band rebalancing percentage
  is_public BOOLEAN DEFAULT false,
  is_popular BOOLEAN DEFAULT false,
  is_benchmark BOOLEAN DEFAULT false, -- For index comparisons
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Portfolio allocations
CREATE TABLE portfolio_allocations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  percentage DECIMAL(5,2) NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(portfolio_id, asset_id)
);

-- Enhanced backtest results
CREATE TABLE backtest_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  data_availability_start DATE, -- Actual start based on data
  initial_investment DECIMAL(15,2),
  total_return DECIMAL(10,4),
  annualized_return DECIMAL(8,4),
  volatility DECIMAL(8,4),
  sharpe_ratio DECIMAL(8,4),
  max_drawdown DECIMAL(8,4),
  
  -- Comparison metrics
  benchmark_correlation DECIMAL(5,4),
  tracking_error DECIMAL(8,4),
  information_ratio DECIMAL(8,4),
  
  -- Performance breakdowns
  best_year DECIMAL(8,4),
  worst_year DECIMAL(8,4),
  positive_months INTEGER,
  negative_months INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Performance indexes for optimization
CREATE INDEX idx_price_data_asset_date ON price_data(asset_id, date DESC);
CREATE INDEX idx_exchange_rates_currencies_date ON exchange_rates(from_currency, to_currency, date DESC);
CREATE INDEX idx_assets_symbol ON assets(symbol);
CREATE INDEX idx_assets_isin ON assets(isin) WHERE isin IS NOT NULL;
CREATE INDEX idx_assets_search ON assets USING gin(search_keywords gin_trgm_ops);
CREATE INDEX idx_portfolios_user ON portfolios(user_id);
CREATE INDEX idx_portfolio_allocations_portfolio ON portfolio_allocations(portfolio_id);

-- Enable trigram extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE backtest_results ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Portfolios: Users can see their own portfolios + public ones
CREATE POLICY "Users can view own portfolios" ON portfolios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view public portfolios" ON portfolios FOR SELECT USING (is_public = true);
CREATE POLICY "Users can insert own portfolios" ON portfolios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own portfolios" ON portfolios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own portfolios" ON portfolios FOR DELETE USING (auth.uid() = user_id);

-- Portfolio allocations: Users can manage allocations for their portfolios
CREATE POLICY "Users can view allocations for accessible portfolios" ON portfolio_allocations FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM portfolios 
    WHERE portfolios.id = portfolio_allocations.portfolio_id 
    AND (portfolios.user_id = auth.uid() OR portfolios.is_public = true)
  )
);

CREATE POLICY "Users can manage allocations for own portfolios" ON portfolio_allocations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM portfolios 
    WHERE portfolios.id = portfolio_allocations.portfolio_id 
    AND portfolios.user_id = auth.uid()
  )
);

-- Backtest results: Users can see results for accessible portfolios
CREATE POLICY "Users can view backtest results for accessible portfolios" ON backtest_results FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM portfolios 
    WHERE portfolios.id = backtest_results.portfolio_id 
    AND (portfolios.user_id = auth.uid() OR portfolios.is_public = true)
  )
);

CREATE POLICY "Users can create backtest results for own portfolios" ON backtest_results FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM portfolios 
    WHERE portfolios.id = backtest_results.portfolio_id 
    AND portfolios.user_id = auth.uid()
  )
);

-- Public tables (no RLS needed)
-- Assets, price_data, exchange_rates, api_usage are public for all authenticated users

-- Functions and triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to increment API usage with priority tracking
CREATE OR REPLACE FUNCTION increment_api_usage(
  p_date DATE DEFAULT CURRENT_DATE,
  p_priority INTEGER DEFAULT 4,
  p_provider TEXT DEFAULT 'EODHD'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO api_usage (api_provider, call_date, call_count, priority_1_calls, priority_2_calls, priority_3_calls, priority_4_calls)
  VALUES (
    p_provider,
    p_date,
    1,
    CASE WHEN p_priority = 1 THEN 1 ELSE 0 END,
    CASE WHEN p_priority = 2 THEN 1 ELSE 0 END,
    CASE WHEN p_priority = 3 THEN 1 ELSE 0 END,
    CASE WHEN p_priority = 4 THEN 1 ELSE 0 END
  )
  ON CONFLICT (api_provider, call_date)
  DO UPDATE SET
    call_count = api_usage.call_count + 1,
    priority_1_calls = api_usage.priority_1_calls + CASE WHEN p_priority = 1 THEN 1 ELSE 0 END,
    priority_2_calls = api_usage.priority_2_calls + CASE WHEN p_priority = 2 THEN 1 ELSE 0 END,
    priority_3_calls = api_usage.priority_3_calls + CASE WHEN p_priority = 3 THEN 1 ELSE 0 END,
    priority_4_calls = api_usage.priority_4_calls + CASE WHEN p_priority = 4 THEN 1 ELSE 0 END;
END;
$$ LANGUAGE plpgsql;