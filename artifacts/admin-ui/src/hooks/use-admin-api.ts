import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

// --- Custom Fetcher with 401/403 Interception ---
async function adminFetch(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  });

  if (res.status === 401 || res.status === 403) {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    let errorMsg = "An error occurred";
    try {
      const errData = await res.json();
      errorMsg = errData.error || errorMsg;
    } catch {
      errorMsg = res.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

function parseWithLogging<T>(schema: z.ZodType<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod Error] ${label}:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

// --- Schemas ---

export const sessionSchema = z.object({
  authenticated: z.boolean(),
  email: z.string().optional(),
});

export const overviewSchema = z.object({
  totalUsers: z.coerce.number().default(0),
  activeUsers: z.coerce.number().default(0),
  frozenUsers: z.coerce.number().default(0),
  totalOrders: z.coerce.number().default(0),
  completedOrders: z.coerce.number().default(0),
  pendingOrders: z.coerce.number().default(0),
  failedOrders: z.coerce.number().default(0),
  totalRevenue: z.coerce.number().default(0),
  hotBalance: z.coerce.number().default(0),
  hotIsLow: z.boolean().default(false),
  flwBalance: z.coerce.number().nullable().default(null),
  fraudFlags: z.coerce.number().default(0),
  blockedPhones: z.coerce.number().default(0),
});

// Maps actual backend fields to UI-friendly names via transform
export const userSchema = z.object({
  id: z.coerce.number(),
  email: z.string(),
  username: z.string().nullable().optional(),
  displayName: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  isFrozen: z.boolean().default(false),
  riskScore: z.coerce.number().default(0),
  createdAt: z.coerce.date(),
}).transform((u) => ({
  ...u,
  name: u.displayName ?? u.username ?? u.email.split("@")[0],
  joinedAt: u.createdAt,
}));

export const orderSchema = z.object({
  id: z.coerce.number(),
  userId: z.coerce.number().nullable().optional(),
  phone: z.string(),
  network: z.string(),
  amount: z.coerce.number().nullable().default(0),
  ugxAmount: z.coerce.number().nullable().default(0),
  status: z.string(),
  txid: z.string().nullable().optional(),
  depositAddress: z.string().nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
}).transform((o) => ({
  ...o,
  amountUsdt: o.amount ?? 0,
  amountUgx: o.ugxAmount ?? 0,
  recipientPhone: o.phone,
}));

export const analyticsSchema = z.object({
  totalVisits: z.coerce.number().default(0),
  totalLeads: z.coerce.number().default(0),
  topCountries: z.array(z.object({
    country: z.string(),
    count: z.coerce.number(),
  })).default([]),
});

// Inferred types
export type OverviewData = z.infer<typeof overviewSchema>;
export type UserData = z.output<typeof userSchema>;
export type OrderData = z.output<typeof orderSchema>;
export type AnalyticsData = z.infer<typeof analyticsSchema>;

// --- Hooks ---

export function useAdminSession() {
  return useQuery({
    queryKey: ["admin", "session"],
    queryFn: async () => {
      try {
        const data = await adminFetch("/admin/session");
        const parsed = parseWithLogging(sessionSchema, data, "Admin Session");
        return parsed.authenticated ? parsed : null;
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string; token: string }) => {
      const data = await adminFetch("/admin/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      return data as { ok: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "session"] });
    },
  });
}

export function useAdminLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await adminFetch("/admin/logout", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.setQueryData(["admin", "session"], null);
      queryClient.clear();
      window.location.href = "/login";
    },
  });
}

export function useOverview() {
  return useQuery({
    queryKey: ["admin", "overview"],
    queryFn: async () => {
      const data = await adminFetch("/admin/overview");
      return parseWithLogging(overviewSchema, data, "Overview");
    },
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const data = await adminFetch("/admin/users");
      return parseWithLogging(z.array(userSchema), data, "Users");
    },
  });
}

export function useFreezeUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      await adminFetch(`/admin/freeze/${id}`, {
        method: "POST",
        body: JSON.stringify({ reason: reason ?? "Manual freeze by admin" }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useUnfreezeUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await adminFetch(`/admin/unfreeze/${id}`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useAdminOrders() {
  return useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const data = await adminFetch("/admin/orders");
      return parseWithLogging(z.array(orderSchema), data, "Orders");
    },
  });
}

export function useAnalytics() {
  return useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: async () => {
      const data = await adminFetch("/admin/mongo-analytics");
      return parseWithLogging(analyticsSchema, data, "Analytics");
    },
  });
}

export function useResetRisk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await adminFetch(`/admin/reset-risk/${id}`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}
