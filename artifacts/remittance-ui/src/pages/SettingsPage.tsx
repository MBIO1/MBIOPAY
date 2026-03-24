import { useState, useRef } from "react";
import {
  Camera, User, Mail, Hash, Edit2, Lock, Check, X,
  Loader2, Copy, CheckCircle2, LogOut, Calendar,
  KeyRound, Shield, ChevronRight, Eye, EyeOff,
  ShieldCheck, ShieldOff, Smartphone, QrCode, AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, setup2FA, enable2FA, disable2FA } from "@/lib/api";
import { format } from "date-fns";

function resizeImageToBase64(file: File, maxPx = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = reject;
    img.src = url;
  });
}

function SectionHeader({ label }: { label: string }) {
  return (
    <h3 className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-3">
      {label}
    </h3>
  );
}

function FieldLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
      {icon}
      {label}
    </p>
  );
}

function ReadOnlyField({ value, badge }: { value: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between bg-secondary/30 border border-border/40 rounded-xl px-4 py-3">
      <span className="text-sm text-foreground">{value}</span>
      {badge && (
        <span className="text-[10px] bg-secondary text-muted-foreground border border-border/50 rounded-md px-2 py-0.5 font-medium">
          {badge}
        </span>
      )}
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="relative">
        <input
          autoFocus={autoFocus}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-input/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring pr-10"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [editingDisplay, setEditingDisplay] = useState(false);
  const [savingDisplay, setSavingDisplay] = useState(false);

  const [newUsername, setNewUsername] = useState(user?.username ?? "");
  const [editingUsername, setEditingUsername] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");

  const [avatarUploading, setAvatarUploading] = useState(false);

  const [uidCopied, setUidCopied] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [changingPw, setChangingPw] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  const copyUid = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      setUidCopied(true);
      setTimeout(() => setUidCopied(false), 2000);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setSaveError("");
    try {
      const base64 = await resizeImageToBase64(file, 256);
      await apiFetch("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ avatarUrl: base64 }),
      });
      await refreshUser();
    } catch (err: any) {
      setSaveError(err.message ?? "Failed to upload photo");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const saveDisplayName = async () => {
    setSavingDisplay(true);
    setSaveError("");
    try {
      await apiFetch("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ displayName }),
      });
      await refreshUser();
      setEditingDisplay(false);
    } catch (err: any) {
      setSaveError(err.message ?? "Failed to save");
    } finally {
      setSavingDisplay(false);
    }
  };

  const saveUsername = async () => {
    setUsernameError("");
    setSavingUsername(true);
    try {
      await apiFetch("/api/profile/username", {
        method: "PATCH",
        body: JSON.stringify({ username: newUsername }),
      });
      await refreshUser();
      setEditingUsername(false);
    } catch (err: any) {
      setUsernameError(err.message ?? "Failed to save username");
    } finally {
      setSavingUsername(false);
    }
  };

  const savePassword = async () => {
    setPwError("");
    if (newPw !== confirmPw) {
      setPwError("Passwords do not match");
      return;
    }
    if (newPw.length < 8) {
      setPwError("New password must be at least 8 characters");
      return;
    }
    setSavingPw(true);
    try {
      await apiFetch("/api/profile/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      setPwSuccess("Password updated. You'll be signed out.");
      setTimeout(() => logout(), 2000);
    } catch (err: any) {
      setPwError(err.message ?? "Failed to change password");
    } finally {
      setSavingPw(false);
    }
  };

  const cancelPassword = () => {
    setChangingPw(false);
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    setPwError("");
    setPwSuccess("");
  };

  if (!user) return null;

  const initials = (user.displayName || user.username || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-xl mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Page title */}
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Profile & Settings</h2>
        <p className="text-muted-foreground mt-1 text-sm">Manage your account information and security</p>
      </div>

      {/* Avatar */}
      <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center gap-4">
        <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
          <div className="w-20 h-20 rounded-full overflow-hidden border-[3px] border-primary/40 bg-secondary flex items-center justify-center">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-display font-bold text-primary">{initials}</span>
            )}
          </div>
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {avatarUploading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Camera className="w-5 h-5 text-white" />
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div className="text-center">
          <p className="font-display font-bold text-lg text-foreground">{user.displayName || user.username}</p>
          <p className="text-muted-foreground text-sm">@{user.username}</p>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={avatarUploading}
          className="text-xs text-primary hover:underline font-medium"
        >
          {avatarUploading ? "Uploading..." : "Change photo"}
        </button>
      </div>

      {/* Personal Info */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <SectionHeader label="Personal Info" />

        {/* Display Name */}
        <div>
          <FieldLabel icon={<User className="w-3 h-3" />} label="Display Name" />
          {editingDisplay ? (
            <div className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={60}
                placeholder="Your display name"
                className="flex-1 bg-input/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={saveDisplayName}
                disabled={savingDisplay || !displayName.trim()}
                className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
              >
                {savingDisplay ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button
                onClick={() => { setEditingDisplay(false); setDisplayName(user.displayName ?? ""); }}
                className="p-2.5 rounded-xl bg-secondary text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-secondary/30 border border-border/40 rounded-xl px-4 py-3">
              <span className="text-sm text-foreground">
                {user.displayName || <span className="text-muted-foreground italic">Not set</span>}
              </span>
              <button
                onClick={() => { setEditingDisplay(true); setDisplayName(user.displayName ?? ""); }}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Username */}
        <div>
          <FieldLabel
            icon={user.usernameSet ? <Lock className="w-3 h-3" /> : <Edit2 className="w-3 h-3" />}
            label={user.usernameSet ? "Username (locked)" : "Username (can be changed once)"}
          />
          {editingUsername && !user.usernameSet ? (
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                  <input
                    autoFocus
                    type="text"
                    value={newUsername}
                    onChange={(e) => { setNewUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, "")); setUsernameError(""); }}
                    maxLength={30}
                    className="w-full bg-input/50 border border-border rounded-xl pl-8 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <button
                  onClick={saveUsername}
                  disabled={savingUsername || !newUsername.trim() || newUsername === user.username}
                  className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
                >
                  {savingUsername ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => { setEditingUsername(false); setNewUsername(user.username); setUsernameError(""); }}
                  className="p-2.5 rounded-xl bg-secondary text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {usernameError && <p className="text-xs text-destructive">{usernameError}</p>}
              <p className="text-xs text-muted-foreground">Only letters, numbers and underscores. This can only be changed once.</p>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-secondary/30 border border-border/40 rounded-xl px-4 py-3">
              <span className="text-sm text-foreground font-medium">@{user.username}</span>
              {user.usernameSet ? (
                <Lock className="w-4 h-4 text-muted-foreground" />
              ) : (
                <button
                  onClick={() => { setEditingUsername(true); setNewUsername(user.username); }}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Email */}
        <div>
          <FieldLabel icon={<Mail className="w-3 h-3" />} label="Email" />
          <ReadOnlyField value={user.email} badge="Read only" />
        </div>

        {saveError && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-4 py-3">
            {saveError}
          </div>
        )}
      </div>

      {/* Security */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <SectionHeader label="Security" />

        {/* Password */}
        <div>
          <FieldLabel icon={<KeyRound className="w-3 h-3" />} label="Password" />

          {!changingPw ? (
            <button
              onClick={() => setChangingPw(true)}
              className="w-full flex items-center justify-between bg-secondary/30 border border-border/40 rounded-xl px-4 py-3 hover:border-primary/40 transition-colors group"
            >
              <span className="text-sm text-foreground">••••••••••••</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors font-medium">
                Change <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </button>
          ) : (
            <div className="space-y-3 bg-secondary/20 border border-border/40 rounded-xl p-4">
              <PasswordInput
                label="Current password"
                value={currentPw}
                onChange={setCurrentPw}
                placeholder="Enter current password"
                autoFocus
              />
              <PasswordInput
                label="New password"
                value={newPw}
                onChange={setNewPw}
                placeholder="Min 8 characters"
              />
              <PasswordInput
                label="Confirm new password"
                value={confirmPw}
                onChange={setConfirmPw}
                placeholder="Repeat new password"
              />

              {pwError && (
                <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  {pwError}
                </p>
              )}
              {pwSuccess && (
                <p className="text-xs text-primary bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {pwSuccess}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={savePassword}
                  disabled={savingPw || !currentPw || !newPw || !confirmPw}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 transition-opacity"
                >
                  {savingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Update password
                </button>
                <button
                  onClick={cancelPassword}
                  disabled={savingPw}
                  className="px-4 rounded-xl bg-secondary text-muted-foreground text-sm font-medium hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2FA */}
        <div>
          <FieldLabel icon={<Shield className="w-3 h-3" />} label="Two-Factor Authentication" />
          <TwoFASection />
        </div>
      </div>

      {/* Account */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <SectionHeader label="Account" />

        <div>
          <FieldLabel icon={<Hash className="w-3 h-3" />} label="Your UID" />
          <div className="flex items-center justify-between bg-secondary/30 border border-border/40 rounded-xl px-4 py-3">
            <span className="font-mono text-lg font-bold text-primary tracking-wider">{user.uid}</span>
            <button
              onClick={copyUid}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors bg-secondary border border-border/60 rounded-lg px-3 py-1.5 font-medium"
            >
              {uidCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
              {uidCopied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {user.createdAt && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 text-muted-foreground/60" />
            Member since {format(new Date(user.createdAt), "MMMM d, yyyy")}
          </div>
        )}
      </div>

      {/* Sign out */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <SectionHeader label="Account Actions" />
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 border border-destructive/30 text-destructive bg-destructive/5 hover:bg-destructive/10 rounded-xl py-3 text-sm font-semibold transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ─── 2FA Management Section ───────────────────────────────────────────────────
type TwoFAFlow = "idle" | "setup-qr" | "setup-confirm" | "disable";

function TwoFASection() {
  const { user, refreshUser } = useAuth();
  const [flow, setFlow] = useState<TwoFAFlow>("idle");
  const [qrData, setQrData] = useState<{ secret: string; qr: string } | null>(null);
  const [setupCode, setSetupCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [disableToken, setDisableToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isEnabled = user?.totpEnabled ?? false;

  const startSetup = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await setup2FA();
      setQrData({ secret: data.secret, qr: data.qr });
      setFlow("setup-qr");
    } catch (err: any) {
      setError(err.message ?? "Failed to start setup");
    } finally {
      setLoading(false);
    }
  };

  const confirmSetup = async () => {
    setError("");
    setLoading(true);
    try {
      await enable2FA(setupCode);
      await refreshUser();
      setFlow("idle");
      setSetupCode("");
      setQrData(null);
      setSuccess("Two-factor authentication enabled!");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message ?? "Failed to enable 2FA");
    } finally {
      setLoading(false);
    }
  };

  const confirmDisable = async () => {
    setError("");
    setLoading(true);
    try {
      await disable2FA(disablePassword, disableToken);
      await refreshUser();
      setFlow("idle");
      setDisablePassword("");
      setDisableToken("");
      setSuccess("Two-factor authentication disabled.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message ?? "Failed to disable 2FA");
    } finally {
      setLoading(false);
    }
  };

  const cancel = () => {
    setFlow("idle");
    setError("");
    setSetupCode("");
    setDisablePassword("");
    setDisableToken("");
    setQrData(null);
  };

  if (success && flow === "idle") {
    return (
      <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 flex items-center gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm text-primary font-medium">{success}</span>
      </div>
    );
  }

  if (!isEnabled && flow === "idle") {
    return (
      <div className="bg-secondary/30 border border-border/40 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <ShieldOff className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Not enabled</p>
            <p className="text-xs text-muted-foreground mt-0.5">Add an extra layer of security using an authenticator app.</p>
          </div>
        </div>
        <button
          onClick={startSetup}
          disabled={loading}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          Enable 2FA
        </button>
        {error && <p className="text-xs text-destructive mt-2">{error}</p>}
      </div>
    );
  }

  if (isEnabled && flow === "idle") {
    return (
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">Enabled</p>
              <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5 font-semibold">Active</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Your account is protected with an authenticator app.</p>
          </div>
        </div>
        <button
          onClick={() => { setFlow("disable"); setError(""); }}
          className="mt-4 w-full flex items-center justify-center gap-2 border border-destructive/30 text-destructive bg-destructive/5 hover:bg-destructive/10 rounded-xl py-2.5 text-sm font-semibold transition-colors"
        >
          <ShieldOff className="w-4 h-4" />
          Disable 2FA
        </button>
        {success && <p className="text-xs text-primary mt-2">{success}</p>}
      </div>
    );
  }

  if (flow === "setup-qr" && qrData) {
    return (
      <div className="bg-secondary/20 border border-border/50 rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2">
          <QrCode className="w-4 h-4 text-primary" />
          <p className="text-sm font-bold text-foreground">Scan with your authenticator app</p>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Open Google Authenticator, Authy, or any TOTP app and scan the QR code below.
        </p>
        <div className="flex justify-center">
          <div className="bg-white p-3 rounded-xl">
            <img src={qrData.qr} alt="2FA QR Code" className="w-40 h-40" />
          </div>
        </div>
        <div className="bg-secondary/50 border border-border/40 rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground mb-1 font-semibold uppercase tracking-wider">Manual entry key</p>
          <p className="font-mono text-xs text-foreground break-all select-all">{qrData.secret}</p>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => setFlow("setup-confirm")}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Smartphone className="w-4 h-4" /> I've scanned it
          </button>
          <button onClick={cancel} className="px-4 rounded-xl bg-secondary text-muted-foreground text-sm font-medium hover:text-foreground transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (flow === "setup-confirm") {
    return (
      <div className="bg-secondary/20 border border-border/50 rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-primary" />
          <p className="text-sm font-bold text-foreground">Enter the code from your app</p>
        </div>
        <p className="text-xs text-muted-foreground">Enter the 6-digit code shown in your authenticator app to confirm setup.</p>
        <input
          type="text" inputMode="numeric" maxLength={6} autoFocus
          placeholder="000000" value={setupCode}
          onChange={(e) => { setSetupCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
          className="w-full bg-input/50 border border-border rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-widest text-foreground placeholder:text-muted-foreground/40 placeholder:text-lg focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={confirmSetup}
            disabled={loading || setupCode.length < 6}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Activate 2FA
          </button>
          <button onClick={() => { setFlow("setup-qr"); setError(""); setSetupCode(""); }} className="px-4 rounded-xl bg-secondary text-muted-foreground text-sm font-medium hover:text-foreground transition-colors">
            Back
          </button>
        </div>
      </div>
    );
  }

  if (flow === "disable") {
    return (
      <div className="bg-secondary/20 border border-border/50 rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <p className="text-sm font-bold">Disable two-factor authentication?</p>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          You'll be signed out of all devices. Enter your password and current authenticator code to confirm.
        </p>
        <PasswordInput label="Current password" value={disablePassword} onChange={setDisablePassword} placeholder="Your account password" autoFocus />
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Authenticator code</label>
          <input
            type="text" inputMode="numeric" maxLength={6}
            placeholder="000000" value={disableToken}
            onChange={(e) => { setDisableToken(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
            className="w-full bg-input/50 border border-border rounded-xl px-4 py-2.5 text-center text-xl font-bold tracking-widest text-foreground placeholder:text-muted-foreground/40 placeholder:text-base focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={confirmDisable}
            disabled={loading || !disablePassword || disableToken.length < 6}
            className="flex-1 flex items-center justify-center gap-2 border border-destructive/40 text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
            Disable 2FA
          </button>
          <button onClick={cancel} className="px-4 rounded-xl bg-secondary text-muted-foreground text-sm font-medium hover:text-foreground transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return null;
}
