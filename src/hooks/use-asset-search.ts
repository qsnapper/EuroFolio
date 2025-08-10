import { useQuery } from '@tanstack/react-query';
import { Asset } from '@/types';

interface AssetSearchResponse {
  data: Asset[];
  source: {
    cached: number;
    api: number;
    total: number;
  };
}

async function searchAssets(query: string): Promise<AssetSearchResponse> {
  if (!query || query.length < 2) {
    return { data: [], source: { cached: 0, api: 0, total: 0 } };
  }

  const response = await fetch(`/api/assets/search?q=${encodeURIComponent(query)}`);
  
  if (!response.ok) {
    throw new Error('Failed to search assets');
  }

  const data = await response.json();
  console.log('Frontend received data:', JSON.stringify(data, null, 2));
  
  return data;
}

export function useAssetSearch(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['assets', 'search', query],
    queryFn: () => searchAssets(query),
    enabled: enabled && query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}