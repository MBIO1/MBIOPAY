import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";

export interface WalletBalance {
  usdtBalance: number;
  ugxEquivalent: number;
  usdtRate: number;
  address: string;
}

export interface Stats {
  totalOrders: number;
  completedOrders: number;
  totalUgxPaidOut: number;
  totalUsdtReceived: number;
  pendingOrders: number;
}

export function useWalletBalance() {
  return useQuery({
    queryKey: ['/wallet/balance'],
    queryFn: () => fetchApi<WalletBalance>('/wallet/balance'),
    refetchInterval: 30000,
  });
}

export function useStats() {
  return useQuery({
    queryKey: ['/stats'],
    queryFn: () => fetchApi<Stats>('/stats'),
  });
}
