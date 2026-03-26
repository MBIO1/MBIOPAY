import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { ArrowRight, Zap, Shield, CheckCircle2, Clock, Lock, Globe } from "lucide-react";

export const RANKING_SLUGS = [
  "send-money-to-uganda",
  "fast-money-transfer-uganda",
  "mobile-money-uganda",
  "mtn-mobile-money-transfer",
  "airtel-money-uganda",
  "cheap-money-transfer-uganda",
  "instant-transfer-uganda",
  "uganda-remittance-service",
  "best-way-send-money-uganda",
  "uganda-digital-transfer",
  "secure-money-transfer-uganda",
  "online-money-transfer-uganda",
  "send-money-africa-uganda",
  "mobile-transfer-mtn-uganda",
  "airtel-transfer-fast",
  "uganda-payment-service",
  "send-funds-uganda-fast",
  "uganda-financial-transfer",
  "cross-border-uganda-transfer",
  "uganda-mobile-payment",
];

function toTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const PAGE_CONTENT: Record<string, { h1: string; intro: string; desc: string }> = {
  "send-money-to-uganda": {
    h1: "Send Money to Uganda",
    intro: "The fastest way to send money directly to mobile wallets in Uganda.",
    desc: "MBIO Pay makes it simple to send money to Uganda from anywhere. Funds are delivered directly to MTN or Airtel mobile money accounts, typically within minutes. No bank account needed on the receiving end.",
  },
  "fast-money-transfer-uganda": {
    h1: "Fast Money Transfer to Uganda",
    intro: "Speed matters. MBIO Pay delivers transfers in minutes, not days.",
    desc: "When your family needs funds, delays aren't an option. MBIO Pay processes every transfer in real time, so recipients in Uganda receive their money fast — usually within 2–5 minutes of your payment being confirmed.",
  },
  "mobile-money-uganda": {
    h1: "Mobile Money Uganda",
    intro: "Direct delivery to MTN Mobile Money and Airtel Money accounts.",
    desc: "Uganda's mobile money ecosystem is one of the most advanced in Africa. MBIO Pay integrates directly with both major networks, so your transfer lands exactly where your recipient can access it — on their phone.",
  },
  "mtn-mobile-money-transfer": {
    h1: "MTN Mobile Money Transfer",
    intro: "Send money straight to any MTN Mobile Money account in Uganda.",
    desc: "MTN Mobile Money is Uganda's largest mobile payment network. MBIO Pay delivers directly to MTN wallets with name verification, so you always know the money goes to the right person.",
  },
  "airtel-money-uganda": {
    h1: "Airtel Money Uganda",
    intro: "Fast, direct transfers to Airtel Money accounts across Uganda.",
    desc: "Airtel Money serves millions of Ugandans nationwide. MBIO Pay supports direct Airtel Money delivery with real-time processing, locked exchange rates, and full transaction monitoring.",
  },
  "cheap-money-transfer-uganda": {
    h1: "Cheap Money Transfer to Uganda",
    intro: "A flat, transparent service fee — no hidden charges, no surprises.",
    desc: "MBIO Pay charges a single flat fee per transfer — you see it before you confirm. No percentage cuts, no conversion markups hidden in the rate. What you see is what you pay.",
  },
  "instant-transfer-uganda": {
    h1: "Instant Transfer to Uganda",
    intro: "Near-instant delivery to mobile wallets across Uganda.",
    desc: "MBIO Pay processes transfers immediately. Most deliveries complete within 2–5 minutes. Rates are locked at the time you initiate, so there are no last-minute surprises between sending and delivery.",
  },
  "uganda-remittance-service": {
    h1: "Uganda Remittance Service",
    intro: "A modern remittance service built specifically for transfers to Uganda.",
    desc: "Sending remittances to Uganda used to mean high fees, long waits, and unreliable delivery. MBIO Pay changes that — flat fees, real-time processing, and direct mobile money delivery.",
  },
  "best-way-send-money-uganda": {
    h1: "Best Way to Send Money to Uganda",
    intro: "Direct, fast, and affordable — the better way to send to Uganda.",
    desc: "Compared to traditional wire transfers and cash pickup services, MBIO Pay offers faster delivery, lower fees, and no physical pickup required. Funds go straight to your recipient's mobile wallet.",
  },
  "uganda-digital-transfer": {
    h1: "Uganda Digital Transfer",
    intro: "100% digital transfers to Uganda — no cash, no branches, no waiting.",
    desc: "Everything happens online with MBIO Pay. Initiate, confirm, and track your transfer from any device. Your recipient gets the funds delivered digitally to their mobile money account.",
  },
  "secure-money-transfer-uganda": {
    h1: "Secure Money Transfer to Uganda",
    intro: "Every transfer protected by secure infrastructure and continuous monitoring.",
    desc: "MBIO Pay is built with security at its core. All transactions are encrypted, sessions are protected, and every transfer is monitored in real time. If a transfer fails, funds are automatically returned.",
  },
  "online-money-transfer-uganda": {
    h1: "Online Money Transfer to Uganda",
    intro: "Send money to Uganda online — fast, from anywhere in the world.",
    desc: "MBIO Pay is a fully online transfer platform. Create an account, initiate a transfer, and follow the guided steps to complete your payment. No branch visits, no paperwork.",
  },
  "send-money-africa-uganda": {
    h1: "Send Money to Africa — Uganda",
    intro: "Reliable digital transfers to Uganda, one of Africa's most mobile-connected countries.",
    desc: "Uganda leads Africa in mobile money adoption. MBIO Pay leverages this infrastructure to deliver transfers directly to the networks your recipient already uses — MTN and Airtel.",
  },
  "mobile-transfer-mtn-uganda": {
    h1: "Mobile Transfer to MTN Uganda",
    intro: "Send directly to any MTN Uganda mobile number.",
    desc: "Enter the recipient's MTN number, confirm their registered name, lock the rate, and pay. MBIO Pay handles delivery directly to their MTN wallet — no intermediaries.",
  },
  "airtel-transfer-fast": {
    h1: "Fast Airtel Transfer",
    intro: "Quick delivery to Airtel Money accounts across Uganda.",
    desc: "MBIO Pay delivers to Airtel Money accounts with the same speed and reliability as MTN. Both major networks are fully supported, so your recipient can use whichever they prefer.",
  },
  "uganda-payment-service": {
    h1: "Uganda Payment Service",
    intro: "A reliable payment service for transfers into Uganda.",
    desc: "MBIO Pay is a purpose-built payment service for Uganda. From rate locking to name verification to automatic refunds, every feature is designed around reliable, accurate delivery.",
  },
  "send-funds-uganda-fast": {
    h1: "Send Funds to Uganda Fast",
    intro: "Fast fund delivery to Uganda — typically within minutes.",
    desc: "MBIO Pay prioritizes speed without sacrificing security. Funds are dispatched immediately after payment confirmation and delivered to the recipient's mobile wallet in real time.",
  },
  "uganda-financial-transfer": {
    h1: "Uganda Financial Transfer",
    intro: "A modern financial transfer solution for sending money to Uganda.",
    desc: "MBIO Pay offers a streamlined financial transfer experience — locked rates, transparent fees, name verification, and direct mobile money delivery to MTN and Airtel accounts.",
  },
  "cross-border-uganda-transfer": {
    h1: "Cross-Border Transfer to Uganda",
    intro: "Send money across borders to Uganda with ease.",
    desc: "MBIO Pay makes cross-border transfers to Uganda simple. No complex forms, no bank accounts required on the recipient side. Just a mobile number and your payment.",
  },
  "uganda-mobile-payment": {
    h1: "Uganda Mobile Payment",
    intro: "The smart way to send mobile payments to Uganda.",
    desc: "Mobile payments are the standard in Uganda. MBIO Pay delivers straight to MTN and Airtel mobile wallets — no physical cash, no branch pickup, just instant mobile delivery.",
  },
};

const FAQ_ITEMS = [
  {
    q: "How long does a transfer take?",
    a: "Most transfers are delivered within 2–5 minutes. In rare cases of network delays, delivery may take up to 30 minutes.",
  },
  {
    q: "Is MBIO Pay secure?",
    a: "Yes. All transfers are processed through encrypted infrastructure with continuous real-time monitoring.",
  },
  {
    q: "Can I track my transfer?",
    a: "Yes. You receive confirmation once your transfer is processed. Account holders can view full transfer history.",
  },
  {
    q: "What happens if the transfer fails?",
    a: "If a payout fails for any reason, your funds are automatically returned. You will never lose money on a failed transfer.",
  },
];

const FEATURES = [
  { icon: Zap, title: "Fast Delivery", desc: "Transfers processed in real time, delivered within minutes." },
  { icon: Lock, title: "Locked Rates", desc: "Exchange rate confirmed at the moment you initiate." },
  { icon: Shield, title: "Protected Transfers", desc: "Automatic refund if delivery fails for any reason." },
  { icon: Globe, title: "MTN & Airtel", desc: "Both major Uganda mobile networks fully supported." },
  { icon: CheckCircle2, title: "Name Verification", desc: "Recipient name verified before you confirm." },
  { icon: Clock, title: "Available 24/7", desc: "Send money any time — no business hours restrictions." },
];

export default function RankingPage() {
  const [location] = useLocation();
  const slug = location.replace(/^\//, "");
  const content = PAGE_CONTENT[slug];
  const title = content?.h1 ?? toTitle(slug);
  const description = `${title} with MBIO Pay — fast, secure digital transfers directly to MTN and Airtel mobile money accounts in Uganda.`;

  useEffect(() => {
    document.title = `${title} | MBIO PAY`;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (meta) meta.content = description;
  }, [title, description]);

  const faqSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  });

  const serviceSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FinancialService",
    name: "MBIO PAY",
    url: `https://mbiopay.com/${slug}`,
    description,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqSchema }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serviceSchema }} />

      {/* Nav */}
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

        {/* Hero */}
        <div className="mb-16">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">MBIO PAY</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">{title}</h1>
          {content && (
            <p className="text-primary font-semibold text-base mb-4">{content.intro}</p>
          )}
          <p className="text-muted-foreground text-base leading-relaxed max-w-2xl">
            {content?.desc ?? `MBIO Pay provides a modern solution for ${title}. Transfers are processed in real time, allowing recipients to receive funds without delays.`}
          </p>
        </div>

        {/* How it works */}
        <div className="mb-14">
          <h2 className="text-xl font-display font-bold text-foreground mb-6">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { n: "01", t: "Create your account", d: "Sign up with your email and get started in seconds." },
              { n: "02", t: "Enter recipient details", d: "Provide the mobile number. We verify the registered name before you confirm." },
              { n: "03", t: "Funds delivered", d: "Your transfer is processed and delivered to their mobile wallet in minutes." },
            ].map((s) => (
              <div key={s.n} className="bg-card border border-border/50 rounded-2xl p-5">
                <span className="font-mono text-2xl font-bold text-primary/20">{s.n}</span>
                <h3 className="text-sm font-bold text-foreground mt-2 mb-1.5">{s.t}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Why MBIO Pay */}
        <div className="mb-14">
          <h2 className="text-xl font-display font-bold text-foreground mb-6">Why Choose MBIO Pay</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-card border border-border/50 rounded-2xl p-5 hover:border-primary/30 transition-colors group">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                  <f.icon className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Supported Networks */}
        <div className="bg-secondary/10 border border-border/30 rounded-2xl p-6 mb-14">
          <h2 className="text-base font-bold text-foreground mb-3">Supported Mobile Networks</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            MBIO Pay delivers transfers to both major mobile money networks in Uganda, covering the entire country.
          </p>
          <div className="flex gap-3">
            <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl px-4 py-2.5 text-sm font-bold text-yellow-400">MTN Mobile Money</div>
            <div className="bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5 text-sm font-bold text-red-400">Airtel Money</div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-14">
          <h2 className="text-xl font-display font-bold text-foreground mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((faq) => (
              <div key={faq.q} className="bg-card border border-border/50 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-2">{faq.q}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-primary/10 border border-primary/20 rounded-3xl p-10 text-center mb-14">
          <h2 className="text-xl font-display font-bold text-foreground mb-3">Start Sending Today</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
            Create a free account and send your first transfer in minutes.
          </p>
          <Link href="/auth?mode=signup">
            <button className="bg-primary text-primary-foreground font-bold px-8 py-3.5 rounded-2xl hover:bg-primary/90 transition-all hover:scale-105 inline-flex items-center gap-2 shadow-lg shadow-primary/30">
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>

        {/* Internal links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <Link href="/how-it-works" className="hover:text-primary transition-colors">How It Works</Link>
          <Link href="/fees" className="hover:text-primary transition-colors">Fees</Link>
          <Link href="/support" className="hover:text-primary transition-colors">Support</Link>
          <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
        </div>
      </main>
    </div>
  );
}
