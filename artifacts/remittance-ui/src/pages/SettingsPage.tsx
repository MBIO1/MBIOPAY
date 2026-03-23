import { useState, useRef } from "react";
import {
  Camera, User, Mail, Hash, Edit2, Lock, Check, X,
  Loader2, Copy, CheckCircle2, LogOut, Calendar,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
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

interface FieldRowProps {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}
function FieldRow({ label, icon, children }: FieldRowProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        {icon} {label}
      </label>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  // Display name state
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [editingDisplay, setEditingDisplay] = useState(false);
  const [savingDisplay, setSavingDisplay] = useState(false);

  // Username state
  const [newUsername, setNewUsername] = useState(user?.username ?? "");
  const [editingUsername, setEditingUsername] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");

  // Avatar state
  const [avatarUploading, setAvatarUploading] = useState(false);

  // UID copy
  const [uidCopied, setUidCopied] = useState(false);

  // Generic save error
  const [saveError, setSaveError] = useState("");

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

  if (!user) return null;

  const initials = (user.displayName || user.username || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Profile & Settings</h2>
        <p className="text-muted-foreground mt-1 text-sm">Manage your account information</p>
      </div>

      {/* Avatar card */}
      <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center gap-4">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/30 bg-secondary flex items-center justify-center">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-display font-bold text-primary">{initials}</span>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={avatarUploading}
            className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            {avatarUploading ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-white" />
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={avatarUploading}
          className="text-sm text-primary hover:underline font-medium"
        >
          {avatarUploading ? "Uploading..." : "Change photo"}
        </button>

        <div className="text-center">
          <p className="font-display font-bold text-lg text-foreground">
            {user.displayName || user.username}
          </p>
          <p className="text-muted-foreground text-sm">@{user.username}</p>
        </div>
      </div>

      {/* Profile fields */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Personal Info</h3>

        {/* Display Name */}
        <FieldRow label="Display Name" icon={<User className="w-3.5 h-3.5" />}>
          {editingDisplay ? (
            <div className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={60}
                placeholder="Your display name"
                className="flex-1 bg-input/50 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
            <div className="flex items-center justify-between bg-secondary/40 border border-border/50 rounded-xl px-4 py-3">
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
        </FieldRow>

        {/* Username */}
        <FieldRow
          label={
            user.usernameSet
              ? "Username (locked — already changed once)"
              : "Username (can be changed once)"
          }
          icon={user.usernameSet ? <Lock className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
        >
          {editingUsername && !user.usernameSet ? (
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                  <input
                    autoFocus
                    type="text"
                    value={newUsername}
                    onChange={(e) => { setNewUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, "")); setUsernameError(""); }}
                    maxLength={30}
                    placeholder="new_username"
                    className="w-full bg-input/50 border border-border rounded-xl pl-7 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
            <div className="flex items-center justify-between bg-secondary/40 border border-border/50 rounded-xl px-4 py-3">
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
        </FieldRow>

        {/* Email (read-only) */}
        <FieldRow label="Email" icon={<Mail className="w-3.5 h-3.5" />}>
          <div className="flex items-center bg-secondary/40 border border-border/50 rounded-xl px-4 py-3 gap-2">
            <span className="text-sm text-foreground flex-1">{user.email}</span>
            <span className="text-[10px] bg-secondary text-muted-foreground rounded-md px-1.5 py-0.5">Read only</span>
          </div>
        </FieldRow>

        {saveError && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-3 py-2">
            {saveError}
          </div>
        )}
      </div>

      {/* Account info card */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Account</h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
              <Hash className="w-3 h-3" /> Your UID
            </p>
            <p className="font-mono text-lg font-bold text-primary">{user.uid}</p>
          </div>
          <button
            onClick={copyUid}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors bg-secondary/50 border border-border/50 rounded-lg px-3 py-2"
          >
            {uidCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
            {uidCopied ? "Copied!" : "Copy"}
          </button>
        </div>

        {user.createdAt && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            Member since {format(new Date(user.createdAt), "MMMM d, yyyy")}
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Account Actions</h3>
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
