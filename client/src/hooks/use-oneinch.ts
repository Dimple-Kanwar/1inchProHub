import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { TokenInfo, SwapQuote, SwapParams, Strategy, Portfolio } from '@/types/trading';

export function useTokens(chainId: number = 1) {
  return useQuery({
    queryKey: ['/api/tokens', chainId],
    enabled: !!chainId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSwapQuote(
  chainId: number,
  src: string,
  dst: string,
  amount: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['/api/quote', chainId, { src, dst, amount }],
    enabled: enabled && !!src && !!dst && !!amount && parseFloat(amount) > 0,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 15 * 1000, // 15 seconds
  });
}

export function useCreateSwap() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: SwapParams & { userId?: string }) => {
      const response = await apiRequest('POST', `/api/swap/${params.chainId}`, params);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['/api/history'] });
    },
  });
}

export function useFusionQuote(
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  walletAddress: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['/api/fusion/quote', { fromTokenAddress, toTokenAddress, amount, walletAddress }],
    enabled: enabled && !!fromTokenAddress && !!toTokenAddress && !!amount && !!walletAddress,
    staleTime: 10 * 1000,
  });
}

export function useCreateFusionOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest('POST', '/api/fusion/order', orderData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cross-chain'] });
    },
  });
}

export function useUserPortfolio(userId: string) {
  return useQuery({
    queryKey: ['/api/portfolio', userId],
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useUpdatePortfolio() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<Portfolio> }) => {
      const response = await apiRequest('PUT', `/api/portfolio/${userId}`, updates);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/portfolio', data.userId], data);
    },
  });
}

export function useUserStrategies(userId: string) {
  return useQuery({
    queryKey: ['/api/strategies', userId],
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useCreateStrategy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (strategyData: Omit<Strategy, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await apiRequest('POST', '/api/strategies', strategyData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/strategies', data.userId] });
    },
  });
}

export function useUpdateStrategy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Strategy> }) => {
      const response = await apiRequest('PUT', `/api/strategies/${id}`, updates);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/strategies', data.userId] });
    },
  });
}

export function useDeleteStrategy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/strategies/${id}`);
      return response.json();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/strategies'] });
    },
  });
}

export function useGasPrices(chainId: number = 1) {
  return useQuery({
    queryKey: ['/api/gas-prices', chainId],
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000,
  });
}

export function useSpotPrices(addresses: string[], chainId: number = 1) {
  return useQuery({
    queryKey: ['/api/spot-prices', chainId, { addresses: addresses.join(',') }],
    enabled: addresses.length > 0,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useTransactionHistory(address: string, chainId: number = 1, page: number = 1) {
  return useQuery({
    queryKey: ['/api/history', address, chainId, { page }],
    enabled: !!address,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useLimitOrders(walletAddress: string, page: number = 1, limit: number = 100) {
  return useQuery({
    queryKey: ['/api/limit-orders', walletAddress, { page, limit }],
    enabled: !!walletAddress,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useCreateLimitOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest('POST', '/api/limit-orders', orderData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/limit-orders'] });
    },
  });
}

export function useCrossChainBridges(userId: string) {
  return useQuery({
    queryKey: ['/api/cross-chain', userId],
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

export function useInitiateCrossChainBridge() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (bridgeData: any) => {
      const response = await apiRequest('POST', '/api/cross-chain/initiate', bridgeData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/cross-chain', data.userId] });
    },
  });
}
