import { useState, useEffect, type FormEvent } from "react";
import { useLocation } from "wouter";
import { ShieldCheck, Mail, Lock, KeyRound } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAdminLogin, useAdminSession } from "@/hooks/use-admin-api";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { data: session, isLoading: sessionLoading } = useAdminSession();
  const loginMutation = useAdminLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      setLocation("/dashboard");
    }
  }, [session, setLocation]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password || !totp) {
      setError("All fields are required");
      return;
    }

    try {
      await loginMutation.mutateAsync({ email, password, token: totp });
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    }
  };

  if (sessionLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="glass-panel rounded-3xl p-8 relative overflow-hidden">
          {/* Subtle gradient border top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-sidebar border border-white/10 flex items-center justify-center shadow-xl shadow-black/50 mb-6 relative group">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:bg-primary/30 transition-colors" />
              <ShieldCheck className="w-8 h-8 text-primary relative z-10" />
            </div>
            <h1 className="text-3xl font-display font-bold text-white text-center">Admin Portal</h1>
            <p className="text-muted-foreground mt-2 text-center text-sm">Secure access to MBIO PAY infrastructure</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-destructive/15 border border-destructive/20 text-destructive text-sm text-center font-medium"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-4">
              <Input 
                type="email" 
                placeholder="Admin Email" 
                icon={<Mail className="w-5 h-5" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input 
                type="password" 
                placeholder="Password" 
                icon={<Lock className="w-5 h-5" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Input 
                type="text" 
                placeholder="Authenticator Code (TOTP)" 
                icon={<KeyRound className="w-5 h-5" />}
                value={totp}
                onChange={(e) => setTotp(e.target.value)}
                maxLength={6}
                className="tracking-[0.2em] font-mono"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-lg mt-2" 
              isLoading={loginMutation.isPending}
            >
              Verify & Authenticate
            </Button>
          </form>
          
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4" />
            <span>Protected by enterprise-grade security</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
