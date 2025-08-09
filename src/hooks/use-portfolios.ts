import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Portfolio } from '@/types';

interface PortfoliosResponse {
  data: Portfolio[];
}

async function fetchPortfolios(includePublic = false, popular = false): Promise<PortfoliosResponse> {
  const params = new URLSearchParams();
  if (includePublic) params.set('include_public', 'true');
  if (popular) params.set('popular', 'true');
  
  const response = await fetch(`/api/portfolios?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch portfolios');
  }

  return response.json();
}

async function deletePortfolio(portfolioId: string): Promise<void> {
  const response = await fetch(`/api/portfolios/${portfolioId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete portfolio');
  }
}

export function usePortfolios(includePublic = false, popular = false) {
  return useQuery({
    queryKey: ['portfolios', { includePublic, popular }],
    queryFn: () => fetchPortfolios(includePublic, popular),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useDeletePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePortfolio,
    onSuccess: () => {
      // Invalidate and refetch portfolios
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
}