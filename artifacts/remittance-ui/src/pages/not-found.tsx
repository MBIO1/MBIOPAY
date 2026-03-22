import { Link } from "wouter";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative">
      <div className="glass-panel max-w-md w-full rounded-3xl p-8 text-center space-y-6 relative z-10">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        
        <h1 className="text-4xl font-display font-bold text-foreground">404</h1>
        <p className="text-lg text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="pt-4">
          <Link href="/" className="inline-flex items-center justify-center h-12 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
