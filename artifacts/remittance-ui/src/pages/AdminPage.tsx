import { useState, useEffect, useCallback } from "react";
import { Loader2, LogOut, Users, ShoppingCart, Shield, Ban, LayoutDashboard, RefreshCw, Lock, Eye, EyeOff } from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

async function adminFetch(path: string, opts: RequestInit = {}) {
  const r = await fetch(`${API}/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${r.status}`);
  }
  return r.json();
}

function fmt(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString([], { dateStyle: "short", timeStyle: "short" });
}
function fmtNum(n: number | null) {
  if (n == null) return "—";
  return n.toLocaleString();
}

const STATUS_COLOR: Record<string, string> = {
  completed: "bg-green-500/15 text-green-400",
  failed: "bg-red-500/15 text-red-400",
  waiting: "bg-yellow-500/15 text-yellow-400",
  processing: "bg-blue-500/15 text-blue-400",
  expired: "bg-gray-500/15 text-gray-400",
};

const SEV_COLOR: Record<string, string> = {
  low: "text-blue-400",
  medium: "text-yellow-400",
  high: "text-red-400",
  critical: "text-purple-400",
};

/* ─── Login form ─────────────────────────────────────────────────────────── */
function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const device = btoa(navigator.userAgent + screen.width + screen.height);
      await adminFetch("/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password, token: otp, device }),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/20 mb-4">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
          <p className="text-gray-400 text-sm mt-1">MBIO PAY — Restricted Access</p>
        </div>

        <form onSubmit={submit} className="bg-[#111827] border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@mbiopay.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Authenticator Code</label>
            <input
              type="text" inputMode="numeric" pattern="\d{6}" maxLength={6} required value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="6-digit code"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 tracking-[0.3em]"
            />
            <p className="text-[11px] text-gray-600">Open Google Authenticator and enter the current code.</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-primary text-black font-bold rounded-xl py-3 text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 mt-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Stat card ──────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{fmtNum(typeof value === "number" ? value : null) === "—" ? value : fmtNum(value as number)}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

/* ─── Overview tab ───────────────────────────────────────────────────────── */
function OverviewTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch("/admin/overview").then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data) return <p className="text-gray-500">Failed to load overview.</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Users" value={data.totalUsers ?? 0} />
        <StatCard label="Total Orders" value={data.totalOrders ?? 0} />
        <StatCard label="Completed" value={data.completedOrders ?? 0} />
        <StatCard label="Hot Balance" value={`${(data.hotBalance ?? 0).toFixed(2)} USDT`} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Revenue (USDT)" value={`${(data.totalRevenue ?? 0).toFixed(2)}`} />
        <StatCard label="Pending Orders" value={data.pendingOrders ?? 0} />
        <StatCard label="Fraud Flags" value={data.fraudFlags ?? 0} />
      </div>
    </div>
  );
}

/* ─── Users tab ──────────────────────────────────────────────────────────── */
function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actioning, setActioning] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    adminFetch("/admin/users").then(setUsers).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const freeze = async (id: number) => {
    if (!confirm("Freeze this user?")) return;
    setActioning(id);
    await adminFetch(`/admin/freeze/${id}`, { method: "POST", body: JSON.stringify({ reason: "Admin action" }) });
    load();
    setActioning(null);
  };
  const unfreeze = async (id: number) => {
    setActioning(id);
    await adminFetch(`/admin/unfreeze/${id}`, { method: "POST", body: "{}" });
    load();
    setActioning(null);
  };
  const resetRisk = async (id: number) => {
    setActioning(id);
    await adminFetch(`/admin/reset-risk/${id}`, { method: "POST", body: "{}" });
    load();
    setActioning(null);
  };

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search by email or username…"
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      <div className="space-y-2">
        {filtered.map(u => (
          <div key={u.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-white">{u.email}</p>
                {u.isFrozen && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">FROZEN</span>}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">@{u.username} · UID {u.uid} · Risk: <span style={{ color: u.riskScore >= 80 ? "#f87171" : u.riskScore >= 40 ? "#fbbf24" : "#4ade80" }}>{u.riskScore ?? 0}</span> · Joined {fmt(u.createdAt)}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              {u.isFrozen
                ? <ActionBtn label="Unfreeze" onClick={() => unfreeze(u.id)} loading={actioning === u.id} color="green" />
                : <ActionBtn label="Freeze" onClick={() => freeze(u.id)} loading={actioning === u.id} color="red" />
              }
              <ActionBtn label="Reset Risk" onClick={() => resetRisk(u.id)} loading={actioning === u.id} color="gray" />
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-gray-500 text-sm text-center py-8">No users found.</p>}
      </div>
    </div>
  );
}

/* ─── Orders tab ─────────────────────────────────────────────────────────── */
function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    adminFetch("/admin/orders").then(setOrders).finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {["all", "waiting", "processing", "completed", "failed", "expired"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === s ? "bg-primary text-black" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map(o => (
          <div key={o.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white">#{o.id} · {o.phone}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STATUS_COLOR[o.status] ?? "bg-gray-500/15 text-gray-400"}`}>{o.status}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{o.amount} USDT → {(o.ugxAmount ?? 0).toLocaleString()} UGX · {o.network} · {fmt(o.createdAt)}</p>
                {o.depositAddress && <p className="text-[11px] text-gray-600 font-mono mt-0.5 truncate max-w-[280px]">{o.depositAddress}</p>}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-gray-500 text-sm text-center py-8">No orders found.</p>}
      </div>
    </div>
  );
}

/* ─── Fraud tab ──────────────────────────────────────────────────────────── */
function FraudTab() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch("/admin/fraud-events").then(setEvents).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-2">
      {events.map((e, i) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <p className={`text-xs font-bold uppercase ${SEV_COLOR[e.severity] ?? "text-gray-400"}`}>{e.severity}</p>
                <p className="text-sm font-semibold text-white">{e.ruleName}</p>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{e.description}</p>
            </div>
            <p className="text-xs text-gray-600 shrink-0">{fmt(e.createdAt)}</p>
          </div>
          {e.metadata && (
            <pre className="text-[11px] text-gray-600 mt-2 bg-black/30 rounded-lg p-2 overflow-auto max-h-20">
              {JSON.stringify(e.metadata, null, 2)}
            </pre>
          )}
        </div>
      ))}
      {events.length === 0 && <p className="text-gray-500 text-sm text-center py-8">No fraud events recorded.</p>}
    </div>
  );
}

/* ─── Blocklist tab ──────────────────────────────────────────────────────── */
function BlocklistTab() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [actioning, setActioning] = useState(false);

  const load = () => {
    setLoading(true);
    adminFetch("/admin/blocklist").then(setList).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const blockPhone = async () => {
    if (!phone.trim()) return;
    setActioning(true);
    await adminFetch("/admin/block-phone", { method: "POST", body: JSON.stringify({ phone: phone.trim(), reason: reason.trim() || "Manual block" }) });
    setPhone(""); setReason("");
    load();
    setActioning(false);
  };

  const unblock = async (p: string) => {
    if (!confirm(`Unblock ${p}?`)) return;
    await fetch(`${API}/api/admin/block-phone/${encodeURIComponent(p)}`, { method: "DELETE", credentials: "include" });
    load();
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-white">Block a Phone Number</p>
        <div className="flex gap-2">
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="256XXXXXXXXX"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason (optional)"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <button onClick={blockPhone} disabled={actioning}
            className="px-4 py-2.5 bg-red-500/80 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 shrink-0">
            Block
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {list.map((entry, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white font-mono">{entry.phone}</p>
              <p className="text-xs text-gray-500 mt-0.5">{entry.reason} · {fmt(entry.createdAt)}</p>
            </div>
            <button onClick={() => unblock(entry.phone)} className="px-3 py-1.5 bg-green-500/15 text-green-400 text-xs font-bold rounded-lg hover:bg-green-500/25 transition-colors">
              Unblock
            </button>
          </div>
        ))}
        {list.length === 0 && <p className="text-gray-500 text-sm text-center py-8">No blocked numbers.</p>}
      </div>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  );
}

function ActionBtn({ label, onClick, loading, color }: { label: string; onClick: () => void; loading: boolean; color: string }) {
  const colors: Record<string, string> = {
    red: "bg-red-500/15 text-red-400 hover:bg-red-500/25",
    green: "bg-green-500/15 text-green-400 hover:bg-green-500/25",
    gray: "bg-white/5 text-gray-400 hover:bg-white/10",
  };
  return (
    <button onClick={onClick} disabled={loading}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-40 ${colors[color] ?? colors.gray}`}>
      {loading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : label}
    </button>
  );
}

/* ─── Main AdminPage ─────────────────────────────────────────────────────── */
const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "fraud", label: "Fraud", icon: Shield },
  { id: "blocklist", label: "Blocklist", icon: Ban },
];

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [tab, setTab] = useState("overview");
  const [refreshKey, setRefreshKey] = useState(0);

  const checkSession = useCallback(async () => {
    try {
      const d = await adminFetch("/admin/session");
      if (d.authenticated) {
        setAdminEmail(d.email);
        setAuthed(true);
      } else {
        setAuthed(false);
      }
    } catch {
      setAuthed(false);
    }
  }, []);

  useEffect(() => { checkSession(); }, [checkSession]);

  const logout = async () => {
    await adminFetch("/admin/logout", { method: "POST" });
    setAuthed(false);
    setAdminEmail("");
  };

  if (authed === null) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return <LoginForm onSuccess={() => { setAuthed(true); checkSession(); }} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      {/* Top bar */}
      <div className="border-b border-white/10 bg-[#0d1424] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Lock className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">MBIO PAY Admin</p>
            <p className="text-[11px] text-gray-500">{adminEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setRefreshKey(k => k + 1)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-red-500/15 text-gray-400 hover:text-red-400 text-xs font-semibold transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="border-b border-white/10 bg-[#0d1424] px-4 flex gap-1 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              tab === id ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-300"
            }`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-w-5xl mx-auto" key={refreshKey}>
        {tab === "overview"  && <OverviewTab />}
        {tab === "users"     && <UsersTab />}
        {tab === "orders"    && <OrdersTab />}
        {tab === "fraud"     && <FraudTab />}
        {tab === "blocklist" && <BlocklistTab />}
      </div>
    </div>
  );
}
