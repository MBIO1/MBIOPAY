import { useState, useEffect, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, User, Key, LogOut, Sun, Moon, Monitor, Check, QrCode, Loader2 } from "lucide-react";
import { useUser, useLogout } from "@/hooks/use-auth";
import { useTheme, type Theme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { fetchApi, setup2FA, enable2FA, disable2FA, get2FAStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters").max(60),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Must have an uppercase letter")
    .regex(/[0-9]/, "Must have a number")
    .regex(/[^A-Za-z0-9]/, "Must have a special character"),
});

const twoFAEnableSchema = z.object({
  totpCode: z.string().length(6, "Enter the 6-digit code"),
});

const twoFADisableSchema = z.object({
  password: z.string().min(1, "Password required"),
  totpCode: z.string().length(6, "Enter the 6-digit code"),
});

type SettingsTab = "profile" | "security" | "appearance";

const THEME_OPTIONS: { value: Theme; label: string; icon: ReactNode; description: string }[] = [
  { value: "light",  label: "Light",  icon: <Sun className="w-5 h-5" />,     description: "Always use light mode" },
  { value: "dark",   label: "Dark",   icon: <Moon className="w-5 h-5" />,    description: "Always use dark mode" },
  { value: "auto",   label: "System", icon: <Monitor className="w-5 h-5" />, description: "Follow your device setting" },
];

export default function SettingsPage() {
  const { data: user, refetch: refetchUser } = useUser();
  const logout = useLogout();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // 2FA state
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [twoFaQr, setTwoFaQr] = useState<string | null>(null);
  const [twoFaLoading, setTwoFaLoading] = useState(false);

  const userData = (user as any)?.user ?? user as any;

  useEffect(() => {
    if (userData?.totpEnabled !== undefined) setTwoFaEnabled(!!userData.totpEnabled);
  }, [userData]);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: { displayName: userData?.displayName ?? "" },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  const enable2FAForm = useForm<z.infer<typeof twoFAEnableSchema>>({
    resolver: zodResolver(twoFAEnableSchema),
    defaultValues: { totpCode: "" },
  });

  const disable2FAForm = useForm<z.infer<typeof twoFADisableSchema>>({
    resolver: zodResolver(twoFADisableSchema),
    defaultValues: { password: "", totpCode: "" },
  });

  const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    try {
      await fetchApi("/profile", {
        method: "PATCH",
        body: JSON.stringify({ displayName: data.displayName }),
      });
      await refetchUser();
      toast({ title: "Profile updated", description: "Your display name has been saved." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update failed", description: err.message });
    }
  };

  const onPasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
    try {
      await fetchApi("/profile/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
      });
      passwordForm.reset();
      toast({ title: "Password changed", description: "Your security settings have been updated." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Password change failed", description: err.message });
    }
  };

  const handleSetup2FA = async () => {
    setTwoFaLoading(true);
    try {
      const data = await setup2FA();
      setTwoFaQr(data.qr);
    } catch (err: any) {
      toast({ variant: "destructive", title: "2FA setup failed", description: err.message });
    } finally {
      setTwoFaLoading(false);
    }
  };

  const onEnable2FA = async (data: z.infer<typeof twoFAEnableSchema>) => {
    try {
      await enable2FA(data.totpCode);
      setTwoFaEnabled(true);
      setTwoFaQr(null);
      enable2FAForm.reset();
      await refetchUser();
      toast({ title: "2FA Enabled", description: "Two-factor authentication is now active." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Enable failed", description: err.message });
    }
  };

  const onDisable2FA = async (data: z.infer<typeof twoFADisableSchema>) => {
    try {
      await disable2FA(data.password, data.totpCode);
      setTwoFaEnabled(false);
      disable2FAForm.reset();
      await refetchUser();
      toast({ title: "2FA Disabled", description: "Two-factor authentication has been turned off." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Disable failed", description: err.message });
    }
  };

  const NAV_TABS: { id: SettingsTab; label: string; icon: ReactNode }[] = [
    { id: "profile",    label: "Account Profile",  icon: <User className="w-5 h-5" /> },
    { id: "security",   label: "Security & 2FA",   icon: <Shield className="w-5 h-5" /> },
    { id: "appearance", label: "Appearance",        icon: <Sun className="w-5 h-5" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold text-white">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Settings Nav */}
        <div className="w-full md:w-64 space-y-2">
          {NAV_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left",
                activeTab === tab.id
                  ? "bg-primary/10 text-primary border border-primary/20 font-medium"
                  : "text-muted-foreground hover:bg-white/5 hover:text-white border border-transparent"
              )}
            >
              {tab.icon} {tab.label}
            </button>
          ))}

          <div className="pt-4 mt-4 border-t border-white/5">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors text-left font-medium"
            >
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">

          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="glass-card rounded-2xl p-6 md:p-8">
                <h3 className="text-xl font-display font-bold text-white mb-6">Personal Information</h3>

                <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center border-2 border-white/10 text-2xl font-bold text-white">
                    {userData?.displayName?.charAt(0).toUpperCase() || userData?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mt-2">Profile photo changes coming soon.</p>
                  </div>
                </div>

                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Display Name</label>
                      <Input {...profileForm.register("displayName")} />
                      {profileForm.formState.errors.displayName && (
                        <p className="text-xs text-destructive">{profileForm.formState.errors.displayName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Email Address</label>
                      <Input value={userData?.email ?? ""} disabled className="opacity-50 cursor-not-allowed" />
                      <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                    </div>
                  </div>

                  {userData?.phone && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Mobile Number</label>
                      <Input value={userData.phone} disabled className="opacity-50 cursor-not-allowed font-mono" />
                    </div>
                  )}

                  <div className="pt-4 flex justify-end">
                    <Button type="submit" isLoading={profileForm.formState.isSubmitting}>Save Changes</Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              {/* Change Password */}
              <div className="glass-card rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Key className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-display font-bold text-white">Change Password</h3>
                </div>

                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Current Password</label>
                    <Input type="password" {...passwordForm.register("currentPassword")} />
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-xs text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">New Password</label>
                    <Input type="password" {...passwordForm.register("newPassword")} />
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                    )}
                  </div>
                  <div className="pt-4">
                    <Button type="submit" isLoading={passwordForm.formState.isSubmitting}>Update Password</Button>
                  </div>
                </form>
              </div>

              {/* 2FA */}
              <div className="glass-card rounded-2xl p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="text-xl font-display font-bold text-white">Two-Factor Auth (2FA)</h3>
                    <p className="text-sm text-muted-foreground">
                      {twoFaEnabled ? "2FA is currently enabled." : "Add an extra layer of security."}
                    </p>
                  </div>
                  <span className={cn("ml-auto text-xs font-semibold px-2.5 py-1 rounded-full",
                    twoFaEnabled ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-muted-foreground"
                  )}>
                    {twoFaEnabled ? "ON" : "OFF"}
                  </span>
                </div>

                {!twoFaEnabled && !twoFaQr && (
                  <Button onClick={handleSetup2FA} disabled={twoFaLoading} variant="outline">
                    {twoFaLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <QrCode className="w-4 h-4 mr-2" />}
                    Set Up 2FA
                  </Button>
                )}

                {!twoFaEnabled && twoFaQr && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Scan this QR code with your authenticator app (e.g. Google Authenticator), then enter the 6-digit code below.</p>
                    <img src={twoFaQr} alt="2FA QR Code" className="w-48 h-48 rounded-xl border border-white/10" />
                    <form onSubmit={enable2FAForm.handleSubmit(onEnable2FA)} className="flex gap-3 items-start max-w-sm">
                      <div className="flex-1 space-y-1">
                        <Input
                          placeholder="6-digit code"
                          maxLength={6}
                          className="font-mono tracking-widest text-center"
                          {...enable2FAForm.register("totpCode")}
                        />
                        {enable2FAForm.formState.errors.totpCode && (
                          <p className="text-xs text-destructive">{enable2FAForm.formState.errors.totpCode.message}</p>
                        )}
                      </div>
                      <Button type="submit" isLoading={enable2FAForm.formState.isSubmitting}>Verify & Enable</Button>
                    </form>
                  </div>
                )}

                {twoFaEnabled && (
                  <form onSubmit={disable2FAForm.handleSubmit(onDisable2FA)} className="space-y-4 max-w-sm">
                    <p className="text-sm text-muted-foreground">Enter your password and current authenticator code to disable 2FA.</p>
                    <div className="space-y-2">
                      <Input type="password" placeholder="Current password" {...disable2FAForm.register("password")} />
                      {disable2FAForm.formState.errors.password && (
                        <p className="text-xs text-destructive">{disable2FAForm.formState.errors.password.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Input placeholder="6-digit code" maxLength={6} className="font-mono tracking-widest text-center" {...disable2FAForm.register("totpCode")} />
                      {disable2FAForm.formState.errors.totpCode && (
                        <p className="text-xs text-destructive">{disable2FAForm.formState.errors.totpCode.message}</p>
                      )}
                    </div>
                    <Button type="submit" variant="destructive" isLoading={disable2FAForm.formState.isSubmitting}>Disable 2FA</Button>
                  </form>
                )}
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="space-y-6">
              <div className="glass-card rounded-2xl p-6 md:p-8">
                <h3 className="text-xl font-display font-bold text-white mb-2">Theme</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Choose how MBIO Pay looks for you. Your preference is saved locally.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {THEME_OPTIONS.map((opt) => {
                    const selected = theme === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setTheme(opt.value)}
                        className={cn(
                          "relative flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all duration-200 text-center",
                          selected
                            ? "border-primary bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.2)]"
                            : "border-white/10 bg-card/40 hover:border-white/20 hover:bg-card/60"
                        )}
                      >
                        {selected && (
                          <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </span>
                        )}
                        <span className={selected ? "text-primary" : "text-muted-foreground"}>
                          {opt.icon}
                        </span>
                        <div>
                          <p className={cn("font-semibold text-sm", selected ? "text-primary" : "text-white")}>
                            {opt.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
