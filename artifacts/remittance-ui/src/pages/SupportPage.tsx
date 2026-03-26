import { Link } from "wouter";
import { ArrowRight, Phone, Mail, Clock, MessageCircle, Shield } from "lucide-react";

const CONTACT_OPTIONS = [
  {
    icon: Mail,
    title: "Email Support",
    desc: "Send us a message and we'll get back to you within a few hours.",
    action: "support@mbiopay.com",
    href: "mailto:support@mbiopay.com",
  },
  {
    icon: Phone,
    title: "Phone Support",
    desc: "Speak directly with our support team during business hours.",
    action: "+1 213-510-5113",
    href: "tel:+12135105113",
  },
];

const COMMON_ISSUES = [
  {
    issue: "My transfer is still pending",
    resolution: "Most transfers complete in 2–5 minutes. If yours has been pending for over 30 minutes, contact us with your transfer reference number.",
  },
  {
    issue: "I entered the wrong phone number",
    resolution: "Contact support immediately with your order reference. If the payment hasn't been dispatched yet, we may be able to cancel it.",
  },
  {
    issue: "I need a refund",
    resolution: "If a transfer fails, refunds are processed automatically. For other cases, contact our support team with your order details.",
  },
  {
    issue: "I can't log in to my account",
    resolution: "Use the 'Forgot Password' option on the login page. If you're still having trouble, contact support with the email address on your account.",
  },
  {
    issue: "I want to increase my transfer limit",
    resolution: "Contact our support team to discuss higher limits. Additional verification may be required.",
  },
];

export default function SupportPage() {
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
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">We're Here to Help</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
            Support Center
          </h1>
          <p className="text-muted-foreground text-base max-w-md mx-auto leading-relaxed">
            Have a question or issue? Reach out through any of the options below and our team will help you quickly.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-10">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground">
            Support is available <span className="text-foreground font-medium">Monday – Friday, 9am – 6pm EST</span>. Email responses within 4 hours during business hours.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-14">
          {CONTACT_OPTIONS.map((opt) => (
            <a
              key={opt.title}
              href={opt.href}
              className="bg-card border border-border/50 rounded-2xl p-6 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                <opt.icon className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-sm font-bold text-foreground mb-1.5">{opt.title}</h2>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{opt.desc}</p>
              <span className="text-xs text-primary font-semibold">{opt.action}</span>
            </a>
          ))}
        </div>

        <div className="mb-14">
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">Common Issues</h2>
          </div>
          <div className="space-y-4">
            {COMMON_ISSUES.map((item) => (
              <div key={item.issue} className="bg-card border border-border/50 rounded-2xl p-5">
                <p className="text-sm font-semibold text-foreground mb-2">{item.issue}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.resolution}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-3xl p-10 text-center">
          <Shield className="w-8 h-8 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-foreground mb-3">Still need help?</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Email us at{" "}
            <a href="mailto:support@mbiopay.com" className="text-primary hover:underline font-medium">
              support@mbiopay.com
            </a>{" "}
            and we'll respond promptly.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <Link href="/how-it-works" className="hover:text-primary transition-colors">How It Works</Link>
          <Link href="/fees" className="hover:text-primary transition-colors">Fees</Link>
          <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
        </div>
      </main>
    </div>
  );
}
