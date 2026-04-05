import { motion } from "framer-motion";
import QRCode from "react-qr-code";
import { CheckCircle2, Clock, Copy, AlertCircle, RefreshCw, Wallet, ArrowLeft, TimerOff } from "lucide-react";
import { useGetOrder, useGetWalletAddress } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { formatPhone } from "@/lib/utils";

interface OrderStatusProps {
  orderId: number;
  onReset: () => void;
}

export function OrderStatus({ orderId, onReset }: OrderStatusProps) {
  // Always fetch wallet address to ensure we have the correct global deposit address
  const { data: walletData } = useGetWalletAddress();
  
  // Poll order status
  const { data: order, isError, refetch } = useGetOrder(orderId, {
    query: {
      // Poll every 5 seconds unless the order reaches a terminal state
      refetchInterval: (query) => {
        const status = query.state?.data?.status;
        if (status === "completed" || status === "failed" || status === "expired") return false;
        return 5000;
      },
    }
  });

  const handleCopy = () => {
    if (walletData?.address) {
      navigator.clipboard.writeText(walletData.address);
      toast({
        title: "Copied to clipboard",
        description: "Wallet address copied successfully.",
      });
    }
  };

  if (isError) {
    return (
      <div className="text-center py-8 space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <h3 className="text-xl font-bold text-foreground">Failed to load order</h3>
        <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground">Loading order details...</p>
      </div>
    );
  }

  const isCompleted = order.status === "completed";
  const isFailed = order.status === "failed";
  const isExpired = order.status === "expired";
  const isProcessing = order.status === "processing";
  const isWaiting = order.status === "waiting";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full space-y-8"
    >
      {/* Header / Back */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onReset} className="rounded-full -ml-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
          Order #{orderId}
        </div>
      </div>

      {/* Deposit Instructions (Hidden if done) */}
      {!isCompleted && !isFailed && !isExpired && (
        <div className="flex flex-col items-center justify-center p-6 bg-secondary/30 rounded-2xl border border-primary/20 glow-primary relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
          
          <h3 className="text-xl font-display font-bold mb-2">Send USDT (TRC-20)</h3>
          <p className="text-sm text-muted-foreground text-center mb-6 max-w-[250px]">
            Send any amount of USDT to the address below. It will automatically convert to UGX.
          </p>

          <div className="bg-white p-4 rounded-2xl shadow-xl mb-6 transform transition-transform hover:scale-105 duration-300">
            {walletData?.address ? (
              <QRCode
                value={walletData.address}
                size={180}
                level="H"
                fgColor="#000000"
                bgColor="#ffffff"
              />
            ) : (
              <div className="w-[180px] h-[180px] flex items-center justify-center bg-gray-100 rounded-xl">
                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            )}
          </div>

          <div className="w-full bg-background rounded-xl p-3 flex items-center justify-between border border-border">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="bg-secondary p-2 rounded-lg shrink-0">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <p className="font-mono text-sm truncate text-muted-foreground">
                {walletData?.address || "Loading..."}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleCopy} className="shrink-0 ml-2">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Status Tracker */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground ml-1">Transfer Status</h4>
        
        <div className="relative space-y-4 before:absolute before:inset-0 before:ml-[1.125rem] before:w-0.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:bg-border before:z-0">
          
          {/* Step 1: Waiting */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group z-10">
            <div className={`flex items-center justify-center w-9 h-9 rounded-full border-4 shadow-lg shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${isWaiting ? 'bg-background border-warning text-warning animate-pulse' : 'bg-primary border-primary text-primary-foreground'}`}>
              {isWaiting ? <Clock className="w-4 h-4" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl bg-card border shadow">
              <h5 className="font-bold text-foreground">Waiting for Deposit</h5>
              <p className="text-xs text-muted-foreground mt-1">Monitoring the blockchain for incoming USDT...</p>
            </div>
          </div>

          {/* Step 2: Processing */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group z-10">
            <div className={`flex items-center justify-center w-9 h-9 rounded-full border-4 shadow-lg shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${isProcessing ? 'bg-background border-accent text-accent animate-pulse' : (isCompleted ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-border text-muted-foreground')}`}>
              {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : (isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <RefreshCw className="w-4 h-4" />)}
            </div>
            <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl bg-card border shadow">
              <h5 className={`font-bold ${isProcessing || isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>Processing Payout</h5>
              <p className="text-xs text-muted-foreground mt-1">Converting crypto to UGX and contacting mobile network.</p>
              {order.amount && <div className="mt-2 text-sm font-medium text-accent">Detected: {order.amount} USDT</div>}
            </div>
          </div>

          {/* Step 3: Complete / Failed */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group z-10">
            <div className={`flex items-center justify-center w-9 h-9 rounded-full border-4 shadow-lg shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : (isFailed ? 'bg-destructive border-destructive text-destructive-foreground' : isExpired ? 'bg-secondary border-border text-muted-foreground' : 'bg-background border-border text-muted-foreground')}`}>
              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : (isFailed ? <AlertCircle className="w-5 h-5" /> : isExpired ? <TimerOff className="w-5 h-5" /> : <CheckCircle2 className="w-4 h-4" />)}
            </div>
            <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border shadow ${isCompleted ? 'bg-primary/10 border-primary glow-primary' : (isFailed ? 'bg-destructive/10 border-destructive' : isExpired ? 'bg-secondary/40 border-border' : 'bg-card border-border')}`}>
              <h5 className={`font-bold ${isCompleted ? 'text-primary' : (isFailed ? 'text-destructive' : isExpired ? 'text-foreground' : 'text-muted-foreground')}`}>
                {isCompleted ? "Payment Sent!" : (isFailed ? "Transfer Failed" : isExpired ? "Order Expired" : "Completed")}
              </h5>
              
              {isCompleted && (
                <div className="mt-3 space-y-1">
                  <p className="text-2xl font-display font-bold text-foreground">
                    {order.ugxAmount?.toLocaleString()} UGX
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sent to {formatPhone(order.phone)} ({order.network})
                  </p>
                </div>
              )}
              {isFailed && (
                <p className="text-xs mt-1 text-destructive">
                  Please contact support with Order #{orderId}.
                </p>
              )}
              {isExpired && (
                <p className="text-xs mt-1 text-muted-foreground">
                  No deposit was received before the timeout. Start a new transfer to continue.
                </p>
              )}
              {!isCompleted && !isFailed && !isExpired && (
                <p className="text-xs text-muted-foreground mt-1">Funds will arrive in mobile money shortly.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
