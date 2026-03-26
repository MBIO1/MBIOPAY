import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, ArrowLeft, Smartphone, ShieldCheck, CheckCircle2, Copy, AlertCircle, Loader2 } from "lucide-react";
import { useQuote, useCreateOrder, useOrder } from "@/hooks/use-orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, cn, truncateAddress } from "@/lib/utils";
import { Link } from "wouter";

// Schemas
const recipientSchema = z.object({
  network: z.enum(["MTN", "Airtel"]),
  phone: z.string().regex(/^0[7|8][0-9]{8}$/, "Must be a valid 10-digit Uganda number (e.g. 077... or 075...)"),
});

const quoteSchema = z.object({
  amount: z.coerce.number().min(5, "Minimum 5 USDT").max(10000, "Maximum 10,000 USDT"),
});

export default function SendPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [depositAddress, setDepositAddress] = useState<string>("");
  
  // Forms
  const recipientForm = useForm<z.infer<typeof recipientSchema>>({
    resolver: zodResolver(recipientSchema),
    defaultValues: { network: "MTN", phone: "" }
  });

  const quoteForm = useForm<z.infer<typeof quoteSchema>>({
    resolver: zodResolver(quoteSchema),
    defaultValues: { amount: 50 }
  });

  // Watchers & Queries
  const watchAmount = quoteForm.watch("amount");
  const { data: quote, isLoading: loadingQuote } = useQuote(watchAmount || 0);
  const createOrderMutation = useCreateOrder();
  
  // Polling order status in step 3
  const { data: orderStatus } = useOrder(step === 3 ? orderId : null);

  // Step 1 -> 2
  const onRecipientSubmit = (data: z.infer<typeof recipientSchema>) => {
    // In a real app, we'd call GET /api/resolve-account here to verify the name
    setStep(2);
  };

  // Step 2 -> 3
  const onQuoteSubmit = async (data: z.infer<typeof quoteSchema>) => {
    try {
      const recipient = recipientForm.getValues();
      const res = await createOrderMutation.mutateAsync({
        phone: recipient.phone,
        network: recipient.network,
        expectedUsdt: data.amount
      });
      
      setOrderId(res.orderId);
      setDepositAddress(res.address);
      setStep(3);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Order failed", description: error.message });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Address copied to clipboard" });
  };

  // Transition variants
  const variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="max-w-2xl mx-auto w-full pt-4 md:pt-10">
      
      {/* Progress Tracker */}
      <div className="mb-8 relative">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/5 -translate-y-1/2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
        <div className="flex justify-between relative z-10 px-2">
          {[1, 2, 3].map((num) => (
            <div 
              key={num}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300",
                step >= num 
                  ? "bg-primary text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]" 
                  : "bg-card text-muted-foreground border-2 border-white/10"
              )}
            >
              {step > num ? <CheckCircle2 className="w-5 h-5" /> : num}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-[2rem] p-6 md:p-10 relative overflow-hidden">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: RECIPIENT */}
          {step === 1 && (
            <motion.div
              key="step1"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h2 className="text-2xl font-display font-bold text-white">Who are you sending to?</h2>
                <p className="text-muted-foreground mt-1">Enter the recipient's mobile money details.</p>
              </div>

              <form onSubmit={recipientForm.handleSubmit(onRecipientSubmit)} className="space-y-6">
                
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Select Network</label>
                  <div className="grid grid-cols-2 gap-4">
                    {(["MTN", "Airtel"] as const).map((net) => (
                      <button
                        key={net}
                        type="button"
                        onClick={() => recipientForm.setValue("network", net)}
                        className={cn(
                          "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all duration-200",
                          recipientForm.watch("network") === net
                            ? "border-primary bg-primary/10 glow-primary text-white"
                            : "border-white/10 bg-black/20 text-muted-foreground hover:bg-white/5"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold",
                          net === "MTN" ? "bg-yellow-500 text-black" : "bg-red-500 text-white"
                        )}>
                          {net.charAt(0)}
                        </div>
                        <span className="font-medium">{net} Uganda</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Phone Number</label>
                  <Input 
                    placeholder="077..." 
                    icon={<Smartphone className="w-5 h-5" />}
                    className="h-14 text-lg"
                    {...recipientForm.register("phone")}
                  />
                  {recipientForm.formState.errors.phone && (
                    <p className="text-xs text-destructive">{recipientForm.formState.errors.phone.message}</p>
                  )}
                </div>

                <Button type="submit" size="lg" className="w-full mt-4 h-14 text-lg">
                  Continue <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </form>
            </motion.div>
          )}

          {/* STEP 2: QUOTE */}
          {step === 2 && (
            <motion.div
              key="step2"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-4 mb-8">
                <button 
                  onClick={() => setStep(1)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div>
                  <h2 className="text-2xl font-display font-bold text-white">Send Amount</h2>
                  <p className="text-muted-foreground mt-1">Specify how much USDT to send.</p>
                </div>
              </div>

              <form onSubmit={quoteForm.handleSubmit(onQuoteSubmit)} className="space-y-6">
                
                <div className="p-6 rounded-2xl bg-black/40 border border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                    <span className="text-xs font-medium px-2 py-1 rounded bg-white/10 text-muted-foreground">TRC-20</span>
                  </div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">You Send (USDT)</label>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-display font-bold text-white">$</span>
                    <input 
                      type="number"
                      className="bg-transparent border-none outline-none text-5xl font-display font-bold text-white w-full placeholder:text-white/20 focus:ring-0 p-0"
                      placeholder="50"
                      {...quoteForm.register("amount")}
                    />
                  </div>
                  {quoteForm.formState.errors.amount && (
                    <p className="text-xs text-destructive mt-2">{quoteForm.formState.errors.amount.message}</p>
                  )}
                </div>

                {/* Quote Breakdown */}
                <div className="glass-card rounded-2xl p-6 space-y-4">
                  {loadingQuote ? (
                    <div className="flex justify-center py-4">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : quote ? (
                    <>
                      <div className="flex justify-between items-center pb-4 border-b border-white/5">
                        <span className="text-muted-foreground">Exchange Rate</span>
                        <span className="text-white font-medium">1 USDT = {formatCurrency(quote.usdtRate, 'UGX')}</span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-white/5">
                        <span className="text-muted-foreground">Network Fee</span>
                        <span className="text-white font-medium">{quote.fee} USDT</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-lg font-medium text-white">Recipient Gets</span>
                        <span className="text-3xl font-display font-bold text-primary text-glow">
                          {formatCurrency(quote.payoutUGX, 'UGX')}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground py-4">Enter an amount to see quote</div>
                  )}
                </div>

                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-primary/90">
                    Rates are locked for 5 minutes. Funds will be sent directly to {recipientForm.getValues().phone}.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-14 text-lg" 
                  disabled={!quote || loadingQuote}
                  isLoading={createOrderMutation.isPending}
                >
                  Confirm & Generate Deposit <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </form>
            </motion.div>
          )}

          {/* STEP 3: PAYMENT & STATUS */}
          {step === 3 && (
            <motion.div
              key="step3"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              
              {orderStatus?.status === 'completed' ? (
                <div className="py-8">
                  <div className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-12 h-12 text-success" />
                  </div>
                  <h2 className="text-3xl font-display font-bold text-white mb-2">Transfer Complete!</h2>
                  <p className="text-muted-foreground mb-8">
                    The funds have been successfully sent to the recipient's mobile money wallet.
                  </p>
                  
                  <div className="glass-card rounded-xl p-4 text-left space-y-3 mb-8">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount Sent</span>
                      <span className="text-white font-medium">{formatCurrency(orderStatus.ugxAmount || 0, 'UGX')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recipient</span>
                      <span className="text-white font-medium">{orderStatus.phone}</span>
                    </div>
                    {orderStatus.txid && (
                      <div className="flex justify-between border-t border-white/5 pt-3">
                        <span className="text-muted-foreground">Tx Hash</span>
                        <span className="text-white font-medium text-xs font-mono">{truncateAddress(orderStatus.txid)}</span>
                      </div>
                    )}
                  </div>

                  <Link href="/">
                    <Button size="lg" className="w-full">Back to Dashboard</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-display font-bold text-white">Deposit USDT</h2>
                    <p className="text-muted-foreground mt-1">Send exact amount via TRC-20 network.</p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl inline-block mx-auto mb-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    <QRCodeSVG 
                      value={depositAddress} 
                      size={200}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="Q"
                    />
                  </div>

                  <div className="glass-card rounded-xl p-4 mb-6 relative group">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Deposit Address (TRC-20)</p>
                    <p className="font-mono text-white text-sm break-all pr-10">{depositAddress}</p>
                    <button 
                      onClick={() => copyToClipboard(depositAddress)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/5 hover:bg-primary/20 hover:text-primary text-muted-foreground transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/5 mb-8">
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Amount to send</p>
                      <p className="text-2xl font-display font-bold text-white">{quoteForm.getValues("amount")} <span className="text-sm text-muted-foreground">USDT</span></p>
                    </div>
                    <button onClick={() => copyToClipboard(quoteForm.getValues("amount").toString())} className="text-primary hover:text-primary/80">
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="border border-warning/20 bg-warning/10 rounded-xl p-4 flex items-center justify-center gap-3 mb-6">
                    {orderStatus?.status === 'processing' ? (
                      <>
                        <Loader2 className="w-5 h-5 text-warning animate-spin" />
                        <span className="text-warning font-medium">Payment detected! Processing payout...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-5 h-5 rounded-full border-2 border-warning/50 border-t-warning animate-spin" />
                        <span className="text-warning font-medium">Waiting for deposit...</span>
                      </>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Please send only via TRC-20 network.
                  </p>
                </>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
