import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, User, Key, Bell, CreditCard, LogOut } from "lucide-react";
import { useUser, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export default function SettingsPage() {
  const { data: user } = useUser();
  const logout = useLogout();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.user?.name || "",
      email: user?.user?.email || "",
    }
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "" }
  });

  const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    // Mock update - would hit PATCH /api/profile
    toast({ title: "Profile updated", description: "Your changes have been saved." });
  };

  const onPasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
    // Mock update - would hit PATCH /api/profile/password
    toast({ title: "Password changed", description: "Your security settings have been updated." });
    passwordForm.reset();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div>
        <h1 className="text-3xl font-display font-bold text-white">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and security preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Settings Nav */}
        <div className="w-full md:w-64 space-y-2">
          <button 
            onClick={() => setActiveTab("profile")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left",
              activeTab === "profile" 
                ? "bg-primary/10 text-primary border border-primary/20 font-medium" 
                : "text-muted-foreground hover:bg-white/5 hover:text-white border border-transparent"
            )}
          >
            <User className="w-5 h-5" /> Account Profile
          </button>
          <button 
            onClick={() => setActiveTab("security")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left",
              activeTab === "security" 
                ? "bg-primary/10 text-primary border border-primary/20 font-medium" 
                : "text-muted-foreground hover:bg-white/5 hover:text-white border border-transparent"
            )}
          >
            <Shield className="w-5 h-5" /> Security & 2FA
          </button>
          
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
                    {user?.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <Button variant="outline" size="sm">Change Avatar</Button>
                    <p className="text-xs text-muted-foreground mt-2">JPG, GIF or PNG. Max size 2MB.</p>
                  </div>
                </div>

                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Full Name</label>
                      <Input {...profileForm.register("name")} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Email Address</label>
                      <Input {...profileForm.register("email")} disabled className="opacity-50 cursor-not-allowed" />
                      <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <Button type="submit">Save Changes</Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              
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
                    <Button type="submit">Update Password</Button>
                  </div>
                </form>
              </div>

              <div className="glass-card rounded-2xl p-6 md:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <Shield className="w-6 h-6 text-primary" />
                      <h3 className="text-xl font-display font-bold text-white">Two-Factor Auth (2FA)</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
                  </div>
                  <Button variant="outline">Enable 2FA</Button>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
