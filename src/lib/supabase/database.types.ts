/**
 * Database types for Supabase integration
 * These will be auto-generated once the schema is applied
 */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          country: string;
          primary_currency: string;
          secondary_currency: string;
          locale: string;
          is_admin: boolean;
          subscription_tier: 'FREE' | 'PREMIUM' | 'PRO';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          country?: string;
          primary_currency?: string;
          secondary_currency?: string;
          locale?: string;
          is_admin?: boolean;
          subscription_tier?: 'FREE' | 'PREMIUM' | 'PRO';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          country?: string;
          primary_currency?: string;
          secondary_currency?: string;
          locale?: string;
          is_admin?: boolean;
          subscription_tier?: 'FREE' | 'PREMIUM' | 'PRO';
          created_at?: string;
          updated_at?: string;
        };
      };
      assets: {
        Row: {
          id: string;
          symbol: string;
          exchange: string;
          name: string;
          isin: string | null;
          type: 'ETF' | 'STOCK' | 'BOND' | 'INDEX';
          currency: string;
          country: string | null;
          expense_ratio: number | null;
          symbol_variations: string[] | null;
          search_keywords: string | null;
          previous_close: number | null;
          previous_close_date: string | null;
          last_api_update: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          symbol: string;
          exchange: string;
          name: string;
          isin?: string | null;
          type: 'ETF' | 'STOCK' | 'BOND' | 'INDEX';
          currency?: string;
          country?: string | null;
          expense_ratio?: number | null;
          symbol_variations?: string[] | null;
          search_keywords?: string | null;
          previous_close?: number | null;
          previous_close_date?: string | null;
          last_api_update?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          symbol?: string;
          exchange?: string;
          name?: string;
          isin?: string | null;
          type?: 'ETF' | 'STOCK' | 'BOND' | 'INDEX';
          currency?: string;
          country?: string | null;
          expense_ratio?: number | null;
          symbol_variations?: string[] | null;
          search_keywords?: string | null;
          previous_close?: number | null;
          previous_close_date?: string | null;
          last_api_update?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      portfolios: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          rebalance_frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'NEVER';
          rebalance_threshold: number;
          is_public: boolean;
          is_popular: boolean;
          is_benchmark: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          rebalance_frequency?: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'NEVER';
          rebalance_threshold?: number;
          is_public?: boolean;
          is_popular?: boolean;
          is_benchmark?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          rebalance_frequency?: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'NEVER';
          rebalance_threshold?: number;
          is_public?: boolean;
          is_popular?: boolean;
          is_benchmark?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      portfolio_allocations: {
        Row: {
          id: string;
          portfolio_id: string;
          asset_id: string;
          percentage: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          portfolio_id: string;
          asset_id: string;
          percentage: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          portfolio_id?: string;
          asset_id?: string;
          percentage?: number;
          created_at?: string;
        };
      };
      price_data: {
        Row: {
          id: string;
          asset_id: string;
          date: string;
          open_price: number | null;
          high_price: number | null;
          low_price: number | null;
          close_price: number;
          adjusted_close: number | null;
          volume: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          asset_id: string;
          date: string;
          open_price?: number | null;
          high_price?: number | null;
          low_price?: number | null;
          close_price: number;
          adjusted_close?: number | null;
          volume?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          asset_id?: string;
          date?: string;
          open_price?: number | null;
          high_price?: number | null;
          low_price?: number | null;
          close_price?: number;
          adjusted_close?: number | null;
          volume?: number | null;
          created_at?: string;
        };
      };
      backtest_results: {
        Row: {
          id: string;
          portfolio_id: string;
          start_date: string;
          end_date: string;
          data_availability_start: string | null;
          initial_investment: number | null;
          total_return: number | null;
          annualized_return: number | null;
          volatility: number | null;
          sharpe_ratio: number | null;
          max_drawdown: number | null;
          benchmark_correlation: number | null;
          tracking_error: number | null;
          information_ratio: number | null;
          best_year: number | null;
          worst_year: number | null;
          positive_months: number | null;
          negative_months: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          portfolio_id: string;
          start_date: string;
          end_date: string;
          data_availability_start?: string | null;
          initial_investment?: number | null;
          total_return?: number | null;
          annualized_return?: number | null;
          volatility?: number | null;
          sharpe_ratio?: number | null;
          max_drawdown?: number | null;
          benchmark_correlation?: number | null;
          tracking_error?: number | null;
          information_ratio?: number | null;
          best_year?: number | null;
          worst_year?: number | null;
          positive_months?: number | null;
          negative_months?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          portfolio_id?: string;
          start_date?: string;
          end_date?: string;
          data_availability_start?: string | null;
          initial_investment?: number | null;
          total_return?: number | null;
          annualized_return?: number | null;
          volatility?: number | null;
          sharpe_ratio?: number | null;
          max_drawdown?: number | null;
          benchmark_correlation?: number | null;
          tracking_error?: number | null;
          information_ratio?: number | null;
          best_year?: number | null;
          worst_year?: number | null;
          positive_months?: number | null;
          negative_months?: number | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}