import { useQuery } from '@tanstack/react-query';
import { PriceData } from '@/types';

interface PriceDataResponse {
  data: PriceData[];
  asset: {
    id: string;
    symbol: string;
    exchange: string;
    name: string;
    currency: string;
  };
  source: {
    cached: number;
    api: number;
    total: number;
  };
  warning?: string;
}

async function getAssetPrices(
  assetId: string, 
  from: string, 
  to: string
): Promise<PriceDataResponse> {
  const response = await fetch(
    `/api/assets/${assetId}/prices?from=${from}&to=${to}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch asset prices');
  }

  return response.json();
}

export function useAssetPrices(
  assetId: string | undefined,
  dateRange: { from: Date; to: Date },
  enabled: boolean = true
) {
  const from = dateRange.from.toISOString().split('T')[0];
  const to = dateRange.to.toISOString().split('T')[0];

  return useQuery({
    queryKey: ['assets', assetId, 'prices', from, to],
    queryFn: () => getAssetPrices(assetId!, from, to),
    enabled: enabled && !!assetId,
    staleTime: 10 * 60 * 1000, // 10 minutes for price data
    retry: 1,
  });
}