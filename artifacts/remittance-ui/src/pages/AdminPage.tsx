import { useState, useEffect, useCallback } from "react";
import {
  Loader2, LogOut, Users, ShoppingCart, Shield, Ban,
  LayoutDashboard, RefreshCw, Lock, Eye, EyeOff,
  TrendingUp, Wallet, AlertTriangle, CheckCircle2, XCircle,
} from "lucide-react";

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

const STATUS_COLOR: Record<string, string> = {
  completed:  "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  failed:     "bg-red-500/15 text-red-400 border border-red-500/20",
  waiting:    "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  processing: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  expired:    "bg-gray-500/15 text-gray-400 border border-gray-500/20",
};

const SEV_COLOR: Record<string, string> = {
  low:      "bg-blue-500/15 text-blue-400",
  medium:   "bg-amber-500/15 text-amber-400",
  high:     "bg-red-500/15 text-red-400",
  critical: "bg-purple-500/15 text-purple-400",
};

// ─── Login form ───────────────────────────────────────────────────────────────
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
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 mb-4">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
          <p className="text-gray-500 text-sm mt-1">MBIO PAY — Restricted Access</p>
        </div>

        <form onSubmit={submit} className="bg-[#0d1424] border border-white/8 rounded-2xl p-6 space-y-4 shadow-2xl">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Email</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@mbiopay.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Authenticator Code</label>
            <input
              type="text" inputMode="numeric" pattern="\d{6}" maxLength={6} required
              value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="6-digit code"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/40 tracking-[0.3em]"
            />
            <p className="text-[11px] text-gray-600 mt-1">Open your authenticator app and enter the current code.</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-primary text-black font-bold rounded-xl py-3 text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, accent, warn,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "green" | "red" | "amber" | "blue";
  warn?: boolean;
}) {
  const accentClasses: Record<string, string> = {
    green: "text-emerald-400",
    red:   "text-red-400",
    amber: "text-amber-400",
    blue:  "text-blue-400",
  };
  const textClass = accent ? accentClasses[accent] : warn ? "text-red-400" : "text-white";
  return (
    <div className={`bg-white/4 border rounded-xl p-4 ${warn ? "border-red-500/30" : "border-white/8"}`}>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1.5">{label}</p>
      <p className={`text-2xl font-bold ${textClass}`}>{value}</p>
      {sub && <p className="text-[11px] text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Overview tab ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch("/admin/overview")
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorMsg msg={error} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-3">Users</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total Users"  value={data.totalUsers ?? 0} />
          <StatCard label="Verified"     value={data.activeUsers ?? 0} accent="green" />
          <StatCard label="Frozen"       value={data.frozenUsers ?? 0} warn={(data.frozenUsers ?? 0) > 0} />
          <StatCard label="Fraud Flags"  value={data.fraudFlags ?? 0} warn={(data.fraudFlags ?? 0) > 0} />
        </div>
      </div>

      <div>
        <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-3">Orders</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total Orders"     value={data.totalOrders ?? 0} />
          <StatCard label="Completed"        value={data.completedOrders ?? 0} accent="green" />
          <StatCard label="Pending"          value={data.pendingOrders ?? 0} accent="amber" />
          <StatCard label="Failed"           value={data.failedOrders ?? 0} warn={(data.failedOrders ?? 0) > 0} />
        </div>
      </div>

      <div>
        <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-3">Wallet & Revenue</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            label="Total Revenue"
            value={`${(data.totalRevenue ?? 0).toFixed(2)} USDT`}
            accent="green"
          />
          <StatCard
            label="Hot Wallet"
            value={`${(data.hotBalance ?? 0).toFixed(2)} USDT`}
            sub={data.hotIsLow ? "⚠ Balance low — top up needed" : undefined}
            warn={data.hotIsLow}
          />
          <StatCard
            label="FLW Balance"
            value={`${((data.flwBalance ?? 0) / 1).toLocaleString(undefined, { maximumFractionDigits: 0 })} UGX`}
            accent="blue"
          />
        </div>
      </div>

      <div>
        <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-3">Security</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          <StatCard label="Blocked Phones" value={data.blockedPhones ?? 0} />
          <StatCard label="Fraud Events"   value={data.fraudFlags ?? 0} warn={(data.fraudFlags ?? 0) > 0} />
        </div>
      </div>
    </div>
  );
}

// ─── Users tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actioning, setActioning] = useState<number | null>(null);
  const [freezeReason, setFreezeReason] = useState("");

  const load = () => {
    setLoading(true);
    adminFetch("/admin/users").then(setUsers).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const freeze = async (id: number) => {
    const reason = prompt("Reason for freeze:", "Admin action") ?? "";
    if (reason === null) return;
    setActioning(id);
    try {
      await adminFetch(`/admin/freeze/${id}`, { method: "POST", body: JSON.stringify({ reason: reason || "Admin action" }) });
      load();
    } finally {
      setActioning(null);
    }
  };
  const unfreeze = async (id: number) => {
    setActioning(id);
    try {
      await adminFetch(`/admin/unfreeze/${id}`, { method: "POST", body: "{}" });
      load();
    } finally {
      setActioning(null);
    }
  };
  const resetRisk = async (id: number) => {
    setActioning(id);
    try {
      await adminFetch(`/admin/reset-risk/${id}`, { method: "POST", body: "{}" });
      load();
    } finally {
      setActioning(null);
    }
  };

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.uid?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search email, username, or UID…"
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button onClick={load} className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-gray-600">{filtered.length} of {users.length} users</p>
      <div className="space-y-2">
        {filtered.map(u => (
          <div key={u.id} className={`border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${u.isFrozen ? "bg-red-500/5 border-red-500/20" : "bg-white/4 border-white/8"}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-white truncate">{u.email}</p>
                {u.isFrozen && <Badge color="red" label="FROZEN" />}
                {u.emailVerified && <Badge color="green" label="Verified" />}
                {u.totpEnabled && <Badge color="blue" label="2FA" />}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-gray-500">@{u.username}</span>
                <span className="text-gray-700">·</span>
                <span className="text-xs text-gray-500 font-mono">UID {u.uid}</span>
                <span className="text-gray-700">·</span>
                <span className="text-xs" style={{ color: u.riskScore >= 80 ? "#f87171" : u.riskScore >= 40 ? "#fbbf24" : "#6b7280" }}>
                  Risk {u.riskScore ?? 0}
                </span>
                <span className="text-gray-700">·</span>
                <span className="text-xs text-gray-600">{fmt(u.createdAt)}</span>
              </div>
              {u.isFrozen && u.frozenReason && (
                <p className="text-xs text-red-400/70 mt-1 italic">"{u.frozenReason}"</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              {u.isFrozen
                ? <ActionBtn label="Unfreeze" onClick={() => unfreeze(u.id)} loading={actioning === u.id} color="green" />
                : <ActionBtn label="Freeze"   onClick={() => freeze(u.id)}   loading={actioning === u.id} color="red" />
              }
              <ActionBtn label="Reset Risk" onClick={() => resetRisk(u.id)} loading={actioning === u.id} color="gray" />
            </div>
          </div>
        ))}
        {filtered.length === 0 && <EmptyState msg="No users found." />}
      </div>
    </div>
  );
}

// ─── Orders tab ───────────────────────────────────────────────────────────────
function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    adminFetch("/admin/orders").then(setOrders).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = orders.filter(o => {
    const matchStatus = filter === "all" || o.status === filter;
    const matchSearch = !search || o.phone?.includes(search) || String(o.id).includes(search);
    return matchStatus && matchSearch;
  });

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search phone or order ID…"
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/40 flex-1 min-w-[160px]"
        />
        <button onClick={load} className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {["all", "waiting", "processing", "completed", "failed", "expired"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors ${filter === s ? "bg-primary text-black" : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300"}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-600">{filtered.length} order{filtered.length !== 1 ? "s" : ""}</p>
      <div className="space-y-2">
        {filtered.map(o => (
          <div key={o.id} className="bg-white/4 border border-white/8 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-white">#{o.id}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STATUS_COLOR[o.status] ?? "bg-gray-500/15 text-gray-400"}`}>
                    {o.status}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">{o.network}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  <span className="text-white font-mono">{o.phone}</span>
                  {" · "}
                  <span className="text-gray-300">{Number(o.amount).toFixed(4)} → {(o.ugxAmount ?? 0).toLocaleString()} UGX</span>
                </p>
                {o.depositAddress && (
                  <p className="text-[11px] text-gray-600 font-mono mt-1 truncate max-w-[320px]">{o.depositAddress}</p>
                )}
                {o.txid && (
                  <p className="text-[11px] text-emerald-600 font-mono mt-0.5 truncate max-w-[320px]">tx: {o.txid}</p>
                )}
              </div>
              <p className="text-[11px] text-gray-600 shrink-0">{fmt(o.createdAt)}</p>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <EmptyState msg="No orders found." />}
      </div>
    </div>
  );
}

// ─── Fraud tab ────────────────────────────────────────────────────────────────
function FraudTab() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminFetch("/admin/fraud-events").then(setEvents).finally(() => setLoading(false));
  };
  useEffect(load, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={load} className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      {events.map((e, i) => (
        <div key={i} className="bg-white/4 border border-white/8 rounded-xl p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${SEV_COLOR[e.severity] ?? "bg-gray-500/15 text-gray-400"}`}>
                  {e.severity}
                </span>
                <p className="text-sm font-semibold text-white">{e.ruleName}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">{e.description}</p>
            </div>
            <p className="text-[11px] text-gray-600 shrink-0">{fmt(e.createdAt)}</p>
          </div>
          {e.metadata && (
            <pre className="text-[11px] text-gray-600 mt-2 bg-black/30 rounded-lg p-2 overflow-auto max-h-24 border border-white/5">
              {JSON.stringify(e.metadata, null, 2)}
            </pre>
          )}
        </div>
      ))}
      {events.length === 0 && <EmptyState msg="No fraud events recorded." />}
    </div>
  );
}

// ─── Blocklist tab ────────────────────────────────────────────────────────────
function BlocklistTab() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [actioning, setActioning] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    adminFetch("/admin/blocklist").then(setList).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const blockPhone = async () => {
    if (!phone.trim()) return;
    setError("");
    setActioning(true);
    try {
      await adminFetch("/admin/block-phone", {
        method: "POST",
        body: JSON.stringify({ phone: phone.trim(), reason: reason.trim() || "Manual block" }),
      });
      setPhone(""); setReason("");
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActioning(false);
    }
  };

  const unblock = async (p: string) => {
    if (!confirm(`Unblock ${p}?`)) return;
    await fetch(`${API}/api/admin/block-phone/${encodeURIComponent(p)}`, { method: "DELETE", credentials: "include" });
    load();
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="bg-white/4 border border-white/8 rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-white">Block a Phone Number</p>
        <div className="flex gap-2 flex-wrap">
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="256XXXXXXXXX"
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/40 flex-1 min-w-[140px]" />
          <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason (optional)"
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/40 flex-1 min-w-[140px]" />
          <button onClick={blockPhone} disabled={actioning || !phone.trim()}
            className="px-4 py-2.5 bg-red-500/80 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
            {actioning ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Block"}
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
      <div className="space-y-2">
        {list.map((entry, i) => (
          <div key={i} className="bg-white/4 border border-white/8 rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white font-mono">{entry.phone}</p>
              <p className="text-xs text-gray-500 mt-0.5">{entry.reason} · {fmt(entry.createdAt)}</p>
            </div>
            <button onClick={() => unblock(entry.phone)}
              className="px-3 py-1.5 bg-emerald-500/15 text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-500/25 transition-colors border border-emerald-500/20">
              Unblock
            </button>
          </div>
        ))}
        {list.length === 0 && <EmptyState msg="No blocked numbers." />}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return <p className="text-gray-600 text-sm text-center py-12">{msg}</p>;
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
      <AlertTriangle className="w-4 h-4 shrink-0" />{msg}
    </div>
  );
}

function Badge({ color, label }: { color: "green" | "red" | "blue" | "gray"; label: string }) {
  const c = {
    green: "bg-emerald-500/15 text-emerald-400",
    red:   "bg-red-500/15 text-red-400",
    blue:  "bg-blue-500/15 text-blue-400",
    gray:  "bg-gray-500/15 text-gray-400",
  }[color];
  return <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${c}`}>{label}</span>;
}

function ActionBtn({
  label, onClick, loading, color,
}: {
  label: string; onClick: () => void; loading: boolean; color: string;
}) {
  const colors: Record<string, string> = {
    red:   "bg-red-500/15 text-red-400 hover:bg-red-500/25",
    green: "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25",
    gray:  "bg-white/5 text-gray-400 hover:bg-white/10",
  };
  return (
    <button onClick={onClick} disabled={loading}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-40 ${colors[color] ?? colors.gray}`}>
      {loading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : label}
    </button>
  );
}

// ─── Main AdminPage ───────────────────────────────────────────────────────────
const TABS = [
  { id: "overview",  label: "Overview",  icon: LayoutDashboard },
  { id: "users",     label: "Users",     icon: Users           },
  { id: "orders",    label: "Orders",    icon: ShoppingCart    },
  { id: "fraud",     label: "Fraud",     icon: Shield          },
  { id: "blocklist", label: "Blocklist", icon: Ban             },
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
    await adminFetch("/admin/logout", { method: "POST" }).catch(() => {});
    setAuthed(false);
    setAdminEmail("");
  };

  if (authed === null) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return <LoginForm onSuccess={() => { setAuthed(true); checkSession(); }} />;
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      {/* Top bar */}
      <div className="border-b border-white/8 bg-[#0d1424] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/20 flex items-center justify-center">
            <Lock className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">MBIO PAY Admin</p>
            <p className="text-[11px] text-gray-600">{adminEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
            title="Refresh all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-red-500/15 text-gray-500 hover:text-red-400 text-xs font-semibold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="border-b border-white/8 bg-[#0d1424] px-4 flex gap-0.5 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              tab === id
                ? "border-primary text-primary"
                : "border-transparent text-gray-600 hover:text-gray-300"
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
