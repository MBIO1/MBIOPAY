import { Link } from "wouter";
import { ArrowRight, DollarSign, CheckCircle2, Shield, Info } from "lucide-react";

const FEE_ROWS = [
  { range: "$5 – $49", fee: "$1.99", note: "Flat fee" },
  { range: "$50 – $199", fee: "$3.99", note: "Flat fee" },
  { range: "$200 – $499", fee: "$6.99", note: "Flat fee" },
  { range: "$500+", fee: "$9.99", note: "Flat fee" },
];

const WHAT_YOU_GET = [
  "Live exchange rate locked at time of transfer",
  "Name verification on every recipient",
  "Automatic refund on any failed delivery",
  "24/7 real-time transfer monitoring",
  "Support via phone and email",
];

export default function FeesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <img src="/images/logo-icon.png" alt="MBIO PAY" className="h-9 w-9 rounded-xl object-cover shadow shadow-primary/20" />
              <div className="flex items-baseline gap-0.5">
                <span className="font-display text-lg font-bold text-foreground">MBIO</span>
                <span className="font-display text-lg font-bold text-primary">PAY</span>
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/auth">
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium px-4 py-2 rounded-xl hover:bg-secondary/50">
                Sign In
              </button>
            </Link>
            <Link href="/auth?mode=signup">
              <button className="text-sm bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-1.5">
                Get Started <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Transparent Pricing</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
            Simple, Flat Fees
          </h1>
          <p className="text-muted-foreground text-base max-w-md mx-auto leading-relaxed">
            No hidden charges. No percentage cuts. A single flat fee shown before you confirm — that's it.
          </p>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-border/40 bg-secondary/20 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Transfer Fee Schedule</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount Sent</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Service Fee</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {FEE_ROWS.map((row) => (
                <tr key={row.range} className="hover:bg-secondary/10 transition-colors">
                  <td className="px-5 py-4 text-sm text-foreground font-medium">{row.range}</td>
                  <td className="px-5 py-4 text-sm text-primary font-bold">{row.fee}</td>
                  <td className="px-5 py-4 text-xs text-muted-foreground hidden sm:table-cell">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex gap-3 mb-12">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            The exchange rate shown at the time of transfer is locked in for your transaction. You will never pay more than what is displayed before you confirm.
          </p>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-6 mb-12">
          <h2 className="text-base font-bold text-foreground mb-4">What's included</h2>
          <div className="space-y-3">
            {WHAT_YOU_GET.map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-3xl p-10 text-center">
          <Shield className="w-8 h-8 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-foreground mb-3">Start sending today</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
            No subscription. No monthly fee. Only pay when you send.
          </p>
          <Link href="/auth?mode=signup">
            <button className="bg-primary text-primary-foreground font-bold px-8 py-3.5 rounded-2xl hover:bg-primary/90 transition-all hover:scale-105 inline-flex items-center gap-2 shadow-lg shadow-primary/30">
              Create Free Account <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <Link href="/how-it-works" className="hover:text-primary transition-colors">How It Works</Link>
          <Link href="/support" className="hover:text-primary transition-colors">Support</Link>
          <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
        </div>
      </main>
    </div>
  );
}
