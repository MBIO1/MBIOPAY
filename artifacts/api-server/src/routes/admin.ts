import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  ordersTable,
  fraudEventsTable,
  phoneBlocklistTable,
} from "@workspace/db/schema";
import { eq, desc, count, sum } from "drizzle-orm";
import { getFlutterwaveUgxBalance } from "../lib/walletWatcher";

const router = Router();

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "";

function adminAuth(req: any, res: any, next: any) {
  const secret = (req.headers["x-admin-secret"] as string) || (req.query.secret as string);
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

// ─── Serve admin panel HTML ────────────────────────────────────────────────────
router.get("/admin-panel", (req, res) => {
  const secret = (req.query.secret as string) ?? "";
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    res.status(403).send(`<!DOCTYPE html><html><body style="background:#0f172a;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><h2>403 — Forbidden</h2></body></html>`);
    return;
  }
  res.setHeader("Content-Type", "text/html");
  res.send(ADMIN_HTML(secret));
});

function ADMIN_HTML(secret: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>MBIO PAY — Admin</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',system-ui,sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh}
    header{background:#1e293b;border-bottom:1px solid #334155;padding:16px 24px;display:flex;align-items:center;justify-content:space-between}
    header h1{font-size:1.2rem;font-weight:700;color:#22d3ee}
    header span{font-size:.75rem;color:#64748b}
    .tabs{display:flex;gap:2px;padding:16px 24px 0;border-bottom:1px solid #1e293b}
    .tab{padding:8px 18px;border-radius:8px 8px 0 0;cursor:pointer;font-size:.85rem;color:#94a3b8;background:transparent;border:none}
    .tab.active{background:#1e293b;color:#e2e8f0;font-weight:600}
    .main{padding:24px}
    .panel{display:none}.panel.active{display:block}
    .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:24px}
    .stat{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:16px}
    .stat-label{font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:6px}
    .stat-value{font-size:1.5rem;font-weight:700;color:#f1f5f9}
    .stat-value.green{color:#22d3ee}.stat-value.red{color:#f87171}.stat-value.yellow{color:#fbbf24}
    table{width:100%;border-collapse:collapse;font-size:.82rem}
    th{background:#1e293b;color:#94a3b8;text-align:left;padding:10px 12px;font-weight:600;font-size:.7rem;text-transform:uppercase;letter-spacing:.06em}
    td{padding:10px 12px;border-bottom:1px solid #1e293b;vertical-align:middle}
    tr:hover td{background:#1e293b44}
    .badge{display:inline-block;padding:2px 8px;border-radius:99px;font-size:.7rem;font-weight:700}
    .badge.green{background:#14532d;color:#4ade80}.badge.red{background:#450a0a;color:#f87171}
    .badge.yellow{background:#422006;color:#fbbf24}.badge.gray{background:#1e293b;color:#94a3b8}
    .badge.orange{background:#431407;color:#fb923c}.badge.blue{background:#0c1a3b;color:#60a5fa}
    .btn{padding:5px 12px;border-radius:6px;border:none;cursor:pointer;font-size:.75rem;font-weight:600}
    .btn-red{background:#450a0a;color:#f87171}.btn-red:hover{background:#7f1d1d}
    .btn-green{background:#14532d;color:#4ade80}.btn-green:hover{background:#166534}
    .btn-blue{background:#0c1a3b;color:#60a5fa}.btn-blue:hover{background:#1e3a8a}
    .btn-gray{background:#1e293b;color:#94a3b8}.btn-gray:hover{background:#334155}
    .toolbar{display:flex;gap:10px;margin-bottom:16px;align-items:center;flex-wrap:wrap}
    .toolbar input{background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:7px 12px;border-radius:8px;font-size:.82rem;outline:none;flex:1;min-width:160px}
    .toolbar input:focus{border-color:#22d3ee}
    .empty{text-align:center;padding:40px;color:#475569;font-size:.9rem}
    .risk-bar{height:6px;border-radius:3px;background:#1e293b;overflow:hidden}
    .risk-fill{height:100%;border-radius:3px;transition:width .3s}
    .refresh-btn{background:#0c1a3b;color:#60a5fa;border:1px solid #1e3a8a;border-radius:8px;padding:7px 16px;cursor:pointer;font-size:.82rem;font-weight:600}
    .refresh-btn:hover{background:#1e3a8a}
    .section-title{font-size:.85rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px}
    .card{background:#1e293b;border:1px solid #334155;border-radius:12px;overflow:hidden}
    .danger-sev{color:#f87171}.warn-sev{color:#fbbf24}.info-sev{color:#60a5fa}.crit-sev{color:#c026d3}
  </style>
</head>
<body>
<header>
  <h1>⚡ MBIO PAY Admin</h1>
  <div style="display:flex;gap:12px;align-items:center">
    <span id="last-refresh">Never refreshed</span>
    <button class="refresh-btn" onclick="loadAll()">↻ Refresh</button>
  </div>
</header>

<div class="tabs">
  <button class="tab active" onclick="switchTab('overview')">Overview</button>
  <button class="tab" onclick="switchTab('users')">Users</button>
  <button class="tab" onclick="switchTab('orders')">Orders</button>
  <button class="tab" onclick="switchTab('fraud')">Fraud Events</button>
  <button class="tab" onclick="switchTab('blocklist')">Blocklist</button>
</div>

<div class="main">
  <!-- OVERVIEW -->
  <div class="panel active" id="panel-overview">
    <div class="stats" id="stats"></div>
  </div>

  <!-- USERS -->
  <div class="panel" id="panel-users">
    <div class="toolbar">
      <input id="user-search" placeholder="Search by email or username…" oninput="filterUsers()"/>
      <button class="btn btn-gray" onclick="loadUsers()">Reload</button>
    </div>
    <div class="card"><table id="users-table">
      <thead><tr><th>ID</th><th>Email</th><th>Username</th><th>Risk Score</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
      <tbody id="users-body"><tr><td colspan="7" class="empty">Loading…</td></tr></tbody>
    </table></div>
  </div>

  <!-- ORDERS -->
  <div class="panel" id="panel-orders">
    <div class="toolbar">
      <input id="order-search" placeholder="Search by phone or order ID…" oninput="filterOrders()"/>
      <button class="btn btn-gray" onclick="loadOrders()">Reload</button>
    </div>
    <div class="card"><table>
      <thead><tr><th>#ID</th><th>User</th><th>Phone</th><th>Network</th><th>Amount</th><th>UGX</th><th>Status</th><th>Created</th></tr></thead>
      <tbody id="orders-body"><tr><td colspan="8" class="empty">Loading…</td></tr></tbody>
    </table></div>
  </div>

  <!-- FRAUD EVENTS -->
  <div class="panel" id="panel-fraud">
    <div class="toolbar">
      <button class="btn btn-gray" onclick="loadFraud()">Reload</button>
    </div>
    <div class="card"><table>
      <thead><tr><th>ID</th><th>User</th><th>Phone</th><th>Event</th><th>Severity</th><th>Details</th><th>Time</th></tr></thead>
      <tbody id="fraud-body"><tr><td colspan="7" class="empty">Loading…</td></tr></tbody>
    </table></div>
  </div>

  <!-- BLOCKLIST -->
  <div class="panel" id="panel-blocklist">
    <div class="toolbar">
      <input id="block-phone" placeholder="256700000000" style="flex:0 0 180px"/>
      <input id="block-reason" placeholder="Reason (optional)" style="flex:1"/>
      <button class="btn btn-red" onclick="blockPhone()">Block Phone</button>
      <button class="btn btn-gray" onclick="loadBlocklist()">Reload</button>
    </div>
    <div class="card"><table>
      <thead><tr><th>Phone</th><th>Reason</th><th>Blocked By</th><th>Date</th><th>Action</th></tr></thead>
      <tbody id="blocklist-body"><tr><td colspan="5" class="empty">Loading…</td></tr></tbody>
    </table></div>
  </div>
</div>

<script>
const S = "${secret}";
const api = (path, opts={}) => fetch("/api" + path + (path.includes("?")?"&":"?") + "secret=" + S, {
  headers: {"Content-Type":"application/json", "x-admin-secret": S},
  ...opts
}).then(r=>r.json());

let allUsers = [], allOrders = [];

function switchTab(name) {
  document.querySelectorAll(".tab").forEach((t,i)=>t.classList.toggle("active", ["overview","users","orders","fraud","blocklist"][i]===name));
  document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("active", p.id==="panel-"+name));
}

function fmtTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
}

function statusBadge(s) {
  const map = {completed:"green",failed:"red",waiting:"yellow",processing:"blue",expired:"gray"};
  return \`<span class="badge \${map[s]||"gray"}">\${s}</span>\`;
}

function sevBadge(s) {
  const map = {low:"info-sev",medium:"warn-sev",high:"danger-sev",critical:"crit-sev"};
  return \`<span class="\${map[s]||""}" style="font-weight:700;text-transform:uppercase;font-size:.7rem">\${s}</span>\`;
}

function riskColor(score) {
  if (score >= 80) return "#f87171";
  if (score >= 40) return "#fbbf24";
  return "#4ade80";
}

async function loadAll() {
  document.getElementById("last-refresh").textContent = "Refreshing…";
  await Promise.all([loadOverview(), loadUsers(), loadOrders(), loadFraud(), loadBlocklist()]);
  document.getElementById("last-refresh").textContent = "Updated " + new Date().toLocaleTimeString();
}

async function loadOverview() {
  const d = await api("/admin/overview");
  document.getElementById("stats").innerHTML = \`
    <div class="stat"><div class="stat-label">Total Users</div><div class="stat-value green">\${d.users}</div></div>
    <div class="stat"><div class="stat-label">Frozen Users</div><div class="stat-value red">\${d.frozenUsers}</div></div>
    <div class="stat"><div class="stat-label">Pending Orders</div><div class="stat-value yellow">\${d.pendingOrders}</div></div>
    <div class="stat"><div class="stat-label">Total Volume (USDT)</div><div class="stat-value green">\${d.totalVolumeUsdt}</div></div>
    <div class="stat"><div class="stat-label">FLW Balance (UGX)</div><div class="stat-value \${d.flwUgxBalance<50000?"red":"green"}">\${Number(d.flwUgxBalance).toLocaleString()}</div></div>
    <div class="stat"><div class="stat-label">Fraud Events</div><div class="stat-value \${d.fraudEvents>0?"yellow":"green"}">\${d.fraudEvents}</div></div>
    <div class="stat"><div class="stat-label">Blocked Phones</div><div class="stat-value \${d.blockedPhones>0?"red":"gray"}">\${d.blockedPhones}</div></div>
  \`;
}

async function loadUsers() {
  allUsers = await api("/admin/users");
  renderUsers(allUsers);
}

function renderUsers(users) {
  const tbody = document.getElementById("users-body");
  if (!users.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty">No users found</td></tr>'; return; }
  tbody.innerHTML = users.map(u => \`
    <tr>
      <td style="color:#64748b;font-size:.75rem">\${u.id}</td>
      <td>\${u.email}</td>
      <td style="color:#94a3b8">@\${u.username}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="risk-bar" style="width:80px"><div class="risk-fill" style="width:\${Math.min(u.riskScore,100)}%;background:\${riskColor(u.riskScore)}"></div></div>
          <span style="color:\${riskColor(u.riskScore)};font-weight:700;font-size:.8rem">\${u.riskScore}</span>
        </div>
      </td>
      <td>\${u.isFrozen ? '<span class="badge red">Frozen</span>' : '<span class="badge green">Active</span>'}</td>
      <td style="color:#64748b;font-size:.75rem">\${fmtTime(u.createdAt)}</td>
      <td style="display:flex;gap:4px;flex-wrap:wrap">
        \${u.isFrozen
          ? \`<button class="btn btn-green" onclick="unfreeze(\${u.id})">Unfreeze</button>\`
          : \`<button class="btn btn-red" onclick="freeze(\${u.id})">Freeze</button>\`}
        <button class="btn btn-blue" onclick="resetRisk(\${u.id})">Reset Risk</button>
      </td>
    </tr>
  \`).join("");
}

function filterUsers() {
  const q = document.getElementById("user-search").value.toLowerCase();
  renderUsers(allUsers.filter(u => u.email.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)));
}

async function loadOrders() {
  allOrders = await api("/admin/orders");
  renderOrders(allOrders);
}

function renderOrders(orders) {
  const tbody = document.getElementById("orders-body");
  if (!orders.length) { tbody.innerHTML = '<tr><td colspan="8" class="empty">No orders</td></tr>'; return; }
  tbody.innerHTML = orders.map(o => \`
    <tr>
      <td style="font-family:monospace;color:#64748b">#\${String(o.id).padStart(5,"0")}</td>
      <td style="color:#64748b;font-size:.75rem">\${o.userId||"—"}</td>
      <td style="font-family:monospace">\${o.phone}</td>
      <td><span class="badge \${o.network==="MTN"?"yellow":"red"}">\${o.network}</span></td>
      <td style="font-weight:600">\${o.amount ? o.amount.toFixed(4)+" USDT" : "—"}</td>
      <td style="color:#22d3ee">\${o.ugxAmount ? Number(o.ugxAmount).toLocaleString()+" UGX" : "—"}</td>
      <td>\${statusBadge(o.status)}</td>
      <td style="color:#64748b;font-size:.75rem">\${fmtTime(o.createdAt)}</td>
    </tr>
  \`).join("");
}

function filterOrders() {
  const q = document.getElementById("order-search").value.toLowerCase();
  renderOrders(allOrders.filter(o => o.phone.includes(q) || String(o.id).includes(q)));
}

async function loadFraud() {
  const events = await api("/admin/fraud-events");
  const tbody = document.getElementById("fraud-body");
  if (!events.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty">No fraud events 🎉</td></tr>'; return; }
  tbody.innerHTML = events.map(e => \`
    <tr>
      <td style="color:#64748b;font-size:.75rem">\${e.id}</td>
      <td style="color:#64748b">\${e.userId||"—"}</td>
      <td style="font-family:monospace;font-size:.75rem">\${e.phone||"—"}</td>
      <td style="font-weight:600;font-size:.8rem">\${e.eventType.replace(/_/g," ")}</td>
      <td>\${sevBadge(e.severity)}</td>
      <td style="color:#64748b;font-size:.73rem;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">\${JSON.stringify(e.details)}</td>
      <td style="color:#64748b;font-size:.75rem">\${fmtTime(e.createdAt)}</td>
    </tr>
  \`).join("");
}

async function loadBlocklist() {
  const list = await api("/admin/blocklist");
  const tbody = document.getElementById("blocklist-body");
  if (!list.length) { tbody.innerHTML = '<tr><td colspan="5" class="empty">No blocked phones</td></tr>'; return; }
  tbody.innerHTML = list.map(b => \`
    <tr>
      <td style="font-family:monospace;font-weight:600">\${b.phone}</td>
      <td>\${b.reason}</td>
      <td style="color:#64748b">\${b.blockedBy}</td>
      <td style="color:#64748b;font-size:.75rem">\${fmtTime(b.createdAt)}</td>
      <td><button class="btn btn-green" onclick="unblockPhone('\${b.phone}')">Unblock</button></td>
    </tr>
  \`).join("");
}

async function freeze(id) {
  const reason = prompt("Freeze reason (optional):", "Admin freeze") ?? "Admin freeze";
  await api("/admin/freeze/"+id, {method:"POST", body: JSON.stringify({reason})});
  loadUsers();
}

async function unfreeze(id) {
  await api("/admin/unfreeze/"+id, {method:"POST", body:"{}"});
  loadUsers();
}

async function resetRisk(id) {
  if (!confirm("Reset risk score for user " + id + "?")) return;
  await api("/admin/reset-risk/"+id, {method:"POST", body:"{}"});
  loadUsers();
}

async function blockPhone() {
  const phone = document.getElementById("block-phone").value.trim();
  const reason = document.getElementById("block-reason").value.trim() || "Manual admin block";
  if (!phone) { alert("Enter a phone number"); return; }
  await api("/admin/block-phone", {method:"POST", body: JSON.stringify({phone, reason})});
  document.getElementById("block-phone").value = "";
  document.getElementById("block-reason").value = "";
  loadBlocklist();
  loadOverview();
}

async function unblockPhone(phone) {
  if (!confirm("Unblock " + phone + "?")) return;
  await fetch("/api/admin/block-phone/" + encodeURIComponent(phone) + "?secret=" + S, {method:"DELETE", headers:{"x-admin-secret":S}});
  loadBlocklist();
  loadOverview();
}

loadAll();
setInterval(loadOverview, 30000);
</script>
</body>
</html>`;
}

// ─── Overview ─────────────────────────────────────────────────────────────────
router.get("/admin/overview", adminAuth, async (_req, res) => {
  const [userCount] = await db.select({ cnt: count() }).from(usersTable);
  const [frozenCount] = await db
    .select({ cnt: count() })
    .from(usersTable)
    .where(eq(usersTable.isFrozen, true));

  const [pendingOrders] = await db
    .select({ cnt: count() })
    .from(ordersTable)
    .where(eq(ordersTable.status, "waiting"));

  const [completedVolume] = await db
    .select({ total: sum(ordersTable.amount) })
    .from(ordersTable)
    .where(eq(ordersTable.status, "completed"));

  const [fraudCount] = await db
    .select({ cnt: count() })
    .from(fraudEventsTable);

  const [blockedPhones] = await db
    .select({ cnt: count() })
    .from(phoneBlocklistTable);

  let flwBalance = 0;
  try { flwBalance = await getFlutterwaveUgxBalance(); } catch {}

  res.json({
    users: userCount?.cnt ?? 0,
    frozenUsers: frozenCount?.cnt ?? 0,
    pendingOrders: pendingOrders?.cnt ?? 0,
    totalVolumeUsdt: parseFloat((completedVolume?.total ?? 0).toString()).toFixed(4),
    fraudEvents: fraudCount?.cnt ?? 0,
    blockedPhones: blockedPhones?.cnt ?? 0,
    flwUgxBalance: flwBalance,
  });
});

// ─── Users ────────────────────────────────────────────────────────────────────
router.get("/admin/users", adminAuth, async (_req, res) => {
  const users = await db
    .select({
      id: usersTable.id,
      uid: usersTable.uid,
      email: usersTable.email,
      username: usersTable.username,
      riskScore: usersTable.riskScore,
      isFrozen: usersTable.isFrozen,
      frozenReason: usersTable.frozenReason,
      frozenAt: usersTable.frozenAt,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.riskScore))
    .limit(100);

  res.json(users);
});

// ─── Orders ───────────────────────────────────────────────────────────────────
router.get("/admin/orders", adminAuth, async (_req, res) => {
  const orders = await db
    .select({
      id: ordersTable.id,
      userId: ordersTable.userId,
      phone: ordersTable.phone,
      network: ordersTable.network,
      amount: ordersTable.amount,
      ugxAmount: ordersTable.ugxAmount,
      status: ordersTable.status,
      txid: ordersTable.txid,
      depositAddress: ordersTable.depositAddress,
      expiresAt: ordersTable.expiresAt,
      createdAt: ordersTable.createdAt,
    })
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt))
    .limit(200);

  res.json(orders);
});

// ─── Fraud events ─────────────────────────────────────────────────────────────
router.get("/admin/fraud-events", adminAuth, async (_req, res) => {
  const events = await db
    .select()
    .from(fraudEventsTable)
    .orderBy(desc(fraudEventsTable.createdAt))
    .limit(200);

  res.json(events);
});

// ─── Blocklist ────────────────────────────────────────────────────────────────
router.get("/admin/blocklist", adminAuth, async (_req, res) => {
  const list = await db
    .select()
    .from(phoneBlocklistTable)
    .orderBy(desc(phoneBlocklistTable.createdAt));
  res.json(list);
});

router.post("/admin/block-phone", adminAuth, async (req, res) => {
  const { phone, reason } = req.body as { phone: string; reason?: string };
  if (!phone) { res.status(400).json({ error: "phone is required" }); return; }

  await db
    .insert(phoneBlocklistTable)
    .values({ phone, reason: reason ?? "Manual admin block", blockedBy: "admin" })
    .onConflictDoUpdate({ target: phoneBlocklistTable.phone, set: { reason: reason ?? "Manual admin block" } });

  res.json({ success: true });
});

router.delete("/admin/block-phone/:phone", adminAuth, async (req, res) => {
  await db
    .delete(phoneBlocklistTable)
    .where(eq(phoneBlocklistTable.phone, req.params.phone));
  res.json({ success: true });
});

// ─── Freeze / unfreeze user ───────────────────────────────────────────────────
router.post("/admin/freeze/:id", adminAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { reason } = req.body as { reason?: string };
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.update(usersTable).set({
    isFrozen: true,
    frozenAt: new Date(),
    frozenReason: reason ?? "Admin freeze",
    updatedAt: new Date(),
  }).where(eq(usersTable.id, id));

  res.json({ success: true });
});

router.post("/admin/unfreeze/:id", adminAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.update(usersTable).set({
    isFrozen: false,
    frozenAt: null,
    frozenReason: null,
    updatedAt: new Date(),
  }).where(eq(usersTable.id, id));

  res.json({ success: true });
});

// ─── Reset risk score ─────────────────────────────────────────────────────────
router.post("/admin/reset-risk/:id", adminAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.update(usersTable).set({
    riskScore: 0,
    updatedAt: new Date(),
  }).where(eq(usersTable.id, id));

  res.json({ success: true });
});

export default router;
