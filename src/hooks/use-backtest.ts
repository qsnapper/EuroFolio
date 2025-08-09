import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BacktestResult } from '@/lib/backtesting/engine';

interface BacktestRequest {
  startDate: string;
  endDate: string;
  initialInvestment?: number;
  rebalanceFrequency?: 'NEVER' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
}

interface BacktestResponse {
  data: BacktestResult & {
    backtestId?: string;
    portfolio: {
      id: string;
      name: string;
      description?: string;
    };
    assetsAnalyzed: number;
    totalAssets: number;
    dataCompleteness: number;
  };
}

interface BacktestHistoryResponse {
  data: Array<{
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
  }>;
  portfolio: {
    id: string;
    name: string;
  };
}

async function runBacktest(portfolioId: string, params: BacktestRequest): Promise<BacktestResponse> {
  const response = await fetch(`/api/portfolios/${portfolioId}/backtest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to run backtest');
  }

  return response.json();
}

async function getBacktestHistory(portfolioId: string): Promise<BacktestHistoryResponse> {
  const response = await fetch(`/api/portfolios/${portfolioId}/backtest`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch backtest history');
  }

  return response.json();
}

export function useRunBacktest(portfolioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: BacktestRequest) => runBacktest(portfolioId, params),
    onSuccess: () => {
      // Invalidate backtest history to refresh the list
      queryClient.invalidateQueries({ 
        queryKey: ['backtest-history', portfolioId] 
      });
    },
  });
}

export function useBacktestHistory(portfolioId: string, enabled = true) {
  return useQuery({
    queryKey: ['backtest-history', portfolioId],
    queryFn: () => getBacktestHistory(portfolioId),
    enabled: enabled && !!portfolioId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}