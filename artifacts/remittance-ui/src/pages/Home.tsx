import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRightLeft } from "lucide-react";
import { OrderForm } from "@/components/remittance/OrderForm";
import { OrderStatus } from "@/components/remittance/OrderStatus";
import { RecentOrders } from "@/components/remittance/RecentOrders";

export default function Home() {
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);

  return (
    <div className="min-h-screen relative w-full overflow-x-hidden">
      {/* Background Image / Mesh */}
      <div className="fixed inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/fintech-bg.png`}
          alt="Abstract Background" 
          className="w-full h-full object-cover opacity-60 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
        
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center p-3 bg-card/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl mb-4 glow-primary"
          >
            <ArrowRightLeft className="w-8 h-8 text-primary" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground tracking-tight"
          >
            Crypto to Mobile <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Money</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-xl mx-auto"
          >
            Send USDT seamlessly. We automatically convert and deposit UGX directly into any MTN or Airtel mobile wallet.
          </motion.p>
        </div>

        {/* Main Interface Card */}
        <div className="max-w-xl mx-auto">
          <motion.div 
            layout
            className="glass-panel rounded-3xl p-6 md:p-8"
          >
            <AnimatePresence mode="wait">
              {activeOrderId === null ? (
                <OrderForm key="form" onOrderCreated={setActiveOrderId} />
              ) : (
                <OrderStatus key="status" orderId={activeOrderId} onReset={() => setActiveOrderId(null)} />
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Live Activity Feed */}
        <div className="max-w-2xl mx-auto">
          <RecentOrders />
        </div>

      </main>
    </div>
  );
}
