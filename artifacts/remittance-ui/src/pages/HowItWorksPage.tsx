import { Link } from "wouter";
import { ArrowRight, Smartphone, TrendingUp, Zap, CheckCircle2, Shield, Clock } from "lucide-react";

const STEPS = [
  {
    step: "01",
    icon: Smartphone,
    title: "Create your free account",
    desc: "Sign up with your email address. Verification takes seconds — no paperwork, no waiting.",
  },
  {
    step: "02",
    icon: TrendingUp,
    title: "Enter recipient details",
    desc: "Provide the recipient's MTN or Airtel mobile number. We verify their registered name before you confirm, so you always know where the money is going.",
  },
  {
    step: "03",
    icon: CheckCircle2,
    title: "Lock your rate and pay",
    desc: "Review the live exchange rate, see the flat service fee up front, and follow the payment instructions. Your rate is locked the moment you initiate.",
  },
  {
    step: "04",
    icon: Zap,
    title: "Funds delivered",
    desc: "Your transfer is processed and delivered directly to the recipient's mobile money wallet — typically within minutes.",
  },
];

const FAQS = [
  {
    q: "How long does a transfer take?",
    a: "Most transfers are delivered within 2–5 minutes. In rare cases of network delays, delivery may take up to 30 minutes.",
  },
  {
    q: "What happens if the transfer fails?",
    a: "If a payout fails for any reason, your funds are automatically returned. You will never lose money on a failed transfer.",
  },
  {
    q: "Which networks do you support?",
    a: "We support MTN Mobile Money and Airtel Money — the two largest mobile money networks in Uganda.",
  },
  {
    q: "Is there a minimum or maximum transfer amount?",
    a: "The minimum transfer is $5 USD. Maximum limits depend on your account level. Contact support for higher limits.",
  },
  {
    q: "Are my payment details secure?",
    a: "Yes. All transactions are processed through encrypted, secure infrastructure with continuous monitoring.",
  },
];

export default function HowItWorksPage() {
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Simple Process</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
            How MBIO PAY Works
          </h1>
          <p className="text-muted-foreground text-base max-w-xl mx-auto leading-relaxed">
            Sending money to Uganda has never been simpler. Follow these four steps and your recipient gets paid in minutes.
          </p>
        </div>

        <div className="space-y-4 mb-20">
          {STEPS.map((s, i) => (
            <div key={s.step} className="flex gap-5 bg-card border border-border/50 rounded-2xl p-6 hover:border-primary/30 transition-colors">
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                {i < STEPS.length - 1 && <div className="w-px flex-1 bg-border/40 min-h-[24px]" />}
              </div>
              <div className="pt-1.5">
                <span className="text-[10px] font-mono font-bold text-primary/60 uppercase tracking-widest">Step {s.step}</span>
                <h2 className="text-sm font-bold text-foreground mt-0.5 mb-2">{s.title}</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-secondary/10 border border-border/30 rounded-3xl p-8 mb-20">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-display font-bold text-foreground">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-5">
            {FAQS.map((faq) => (
              <div key={faq.q} className="border-b border-border/30 pb-5 last:border-0 last:pb-0">
                <p className="text-sm font-semibold text-foreground mb-1.5">{faq.q}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-3xl p-10 text-center">
          <Shield className="w-8 h-8 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-foreground mb-3">Ready to send?</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
            Create a free account in seconds and start sending money to Uganda today.
          </p>
          <Link href="/auth?mode=signup">
            <button className="bg-primary text-primary-foreground font-bold px-8 py-3.5 rounded-2xl hover:bg-primary/90 transition-all hover:scale-105 inline-flex items-center gap-2 shadow-lg shadow-primary/30">
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <Link href="/fees" className="hover:text-primary transition-colors">Fees</Link>
          <Link href="/support" className="hover:text-primary transition-colors">Support</Link>
          <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
        </div>
      </main>
    </div>
  );
}
