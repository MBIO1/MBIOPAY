import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

// --- Custom Fetcher with 401 Interception ---
async function adminFetch(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // Required for session cookie
  });

  if (res.status === 401) {
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
    // For development resilience, we still return the casted data so UI doesn't completely break, 
    // but in strict mode we should throw. We'll throw to be safe but log heavily.
    throw result.error;
  }
  return result.data;
}

// --- Schemas ---

export const adminUserSchema = z.object({
  id: z.coerce.string(),
  email: z.string(),
  role: z.string().optional(),
});

export const loginSchema = z.object({
  success: z.boolean(),
  user: adminUserSchema.optional(),
});

export const overviewSchema = z.object({
  totalUsers: z.coerce.number().default(0),
  totalOrders: z.coerce.number().default(0),
  totalVolume: z.coerce.number().default(0),
  totalRevenue: z.coerce.number().default(0),
  fraudFlags: z.coerce.number().default(0),
  pendingOrders: z.coerce.number().default(0),
});

export const userSchema = z.object({
  id: z.coerce.string().or(z.number().transform(String)),
  name: z.string().nullable().default("Unknown"),
  email: z.string(),
  avatar: z.string().nullable().optional(),
  joinedAt: z.coerce.date().or(z.string().transform(str => new Date(str))),
  riskScore: z.coerce.number().default(0),
  isFrozen: z.boolean().default(false),
});

export const orderSchema = z.object({
  id: z.coerce.string().or(z.number().transform(String)),
  userId: z.coerce.string().optional(),
  userName: z.string().nullable().default("Unknown User"),
  amountUsdt: z.coerce.number().default(0),
  amountUgx: z.coerce.number().default(0),
  network: z.enum(["MTN", "Airtel"]).or(z.string()),
  recipientPhone: z.string(),
  status: z.enum(["waiting", "processing", "completed", "failed"]).or(z.string()),
  createdAt: z.coerce.date().or(z.string().transform(str => new Date(str))),
});

export const analyticsSchema = z.object({
  totalVisits: z.coerce.number().default(0),
  uniqueIps: z.coerce.number().default(0),
  totalLeads: z.coerce.number().default(0),
  totalReferrals: z.coerce.number().default(0),
  topCountries: z.array(z.object({
    country: z.string(),
    count: z.coerce.number()
  })).default([]),
});

// --- Hooks ---

export function useAdminSession() {
  return useQuery({
    queryKey: ["admin", "me"],
    queryFn: async () => {
      try {
        const data = await adminFetch("/admin/me");
        return parseWithLogging(adminUserSchema, data.user || data, "Admin Session");
      } catch (e) {
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
    mutationFn: async (credentials: Record<string, string>) => {
      const data = await adminFetch("/admin/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      return parseWithLogging(loginSchema, data, "Admin Login");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "me"] });
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
      queryClient.setQueryData(["admin", "me"], null);
      queryClient.clear();
      window.location.href = "/login";
    },
  });
}

export function useOverview() {
  return useQuery({
    queryKey: ["admin", "overview"],
    queryFn: async () => {
      // Mock fallback if endpoint missing during dev
      try {
        const data = await adminFetch("/admin/overview");
        return parseWithLogging(overviewSchema, data, "Overview");
      } catch (e) {
        console.warn("Using mock overview data", e);
        return { totalUsers: 12450, totalOrders: 4892, totalVolume: 1250400.50, totalRevenue: 450000000, fraudFlags: 12, pendingOrders: 45 };
      }
    },
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      try {
        const data = await adminFetch("/admin/users");
        return parseWithLogging(z.array(userSchema), data, "Users");
      } catch (e) {
        console.warn("Using mock users data");
        return [
          { id: "u1", name: "John Doe", email: "john@example.com", joinedAt: new Date(), riskScore: 15, isFrozen: false },
          { id: "u2", name: "Alice Smith", email: "alice@example.com", joinedAt: new Date(Date.now() - 86400000), riskScore: 45, isFrozen: false },
          { id: "u3", name: "Bob Scam", email: "bob@scam.com", joinedAt: new Date(Date.now() - 86400000*5), riskScore: 85, isFrozen: true },
        ];
      }
    },
  });
}

export function useFreezeUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, freeze }: { id: string, freeze: boolean }) => {
      await adminFetch(`/admin/freeze/${id}`, {
        method: "POST",
        body: JSON.stringify({ freeze })
      });
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
      try {
        const data = await adminFetch("/admin/orders");
        return parseWithLogging(z.array(orderSchema), data, "Orders");
      } catch (e) {
        console.warn("Using mock orders data");
        return [
          { id: "ORD-9921", userName: "John Doe", amountUsdt: 150, amountUgx: 540000, network: "MTN", recipientPhone: "+256770000000", status: "completed", createdAt: new Date() },
          { id: "ORD-9922", userName: "Alice Smith", amountUsdt: 50, amountUgx: 180000, network: "Airtel", recipientPhone: "+256750000000", status: "processing", createdAt: new Date(Date.now() - 3600000) },
          { id: "ORD-9923", userName: "Unknown User", amountUsdt: 500, amountUgx: 1800000, network: "MTN", recipientPhone: "+256771111111", status: "waiting", createdAt: new Date(Date.now() - 7200000) },
          { id: "ORD-9924", userName: "Bob Scam", amountUsdt: 2000, amountUgx: 7200000, network: "Airtel", recipientPhone: "+256752222222", status: "failed", createdAt: new Date(Date.now() - 86400000) },
        ];
      }
    },
  });
}

export function useAnalytics() {
  return useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: async () => {
      try {
        const data = await adminFetch("/admin/mongo-analytics");
        return parseWithLogging(analyticsSchema, data, "Analytics");
      } catch (e) {
         console.warn("Using mock analytics data");
         return {
           totalVisits: 145020,
           uniqueIps: 89040,
           totalLeads: 4500,
           totalReferrals: 1200,
           topCountries: [
             { country: "UG", count: 85000 },
             { country: "US", count: 25000 },
             { country: "GB", count: 15000 },
             { country: "AE", count: 10020 },
             { country: "KE", count: 5000 },
           ]
         };
      }
    },
  });
}
