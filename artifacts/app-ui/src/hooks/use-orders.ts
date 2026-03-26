import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";

export interface Order {
  id: number;
  orderId?: number; // Aliased occasionally
  phone: string;
  network: string;
  amount: number | null;
  ugxAmount: number | null;
  status: 'waiting' | 'processing' | 'completed' | 'failed';
  txid: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  usdtAmount: number;
  payoutUGX: number;
  usdtRate: number;
  fee: number;
}

export function useRecentOrders() {
  return useQuery({
    queryKey: ['/orders/recent'],
    queryFn: () => fetchApi<Order[]>('/orders/recent'),
    refetchInterval: 15000,
  });
}

export function useOrder(id?: number | string | null) {
  return useQuery({
    queryKey: ['/orders', id],
    queryFn: () => fetchApi<Order>(`/orders/${id}`),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return (status === 'waiting' || status === 'processing') ? 5000 : false;
    }
  });
}

export function useQuote(amount: number) {
  return useQuery({
    queryKey: ['/quote', amount],
    queryFn: () => fetchApi<Quote>(`/quote?amount=${amount}`),
    enabled: amount > 0,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { phone: string; network: string; expectedUsdt: number }) => 
      fetchApi<{ orderId: number; address: string; message: string; payoutUGX: number }>('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/orders/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/stats'] });
    },
  });
}
