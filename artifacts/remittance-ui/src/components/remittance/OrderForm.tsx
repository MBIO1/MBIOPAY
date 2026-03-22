import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateOrder } from "@workspace/api-client-react";
import { toast } from "@/hooks/use-toast";

interface OrderFormProps {
  onOrderCreated: (orderId: number) => void;
}

type Network = "MTN" | "Airtel";

export function OrderForm({ onOrderCreated }: OrderFormProps) {
  const [phone, setPhone] = useState("");
  const [network, setNetwork] = useState<Network | null>(null);

  const createOrder = useCreateOrder({
    mutation: {
      onSuccess: (data) => {
        toast({
          title: "Order Created",
          description: "Ready for deposit.",
        });
        onOrderCreated(data.orderId);
      },
      onError: (err: any) => {
        toast({
          title: "Failed to create order",
          description: err.message || "Please check your details and try again.",
          variant: "destructive",
        });
      },
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 9) {
      toast({ title: "Invalid Phone", description: "Please enter a valid phone number", variant: "destructive" });
      return;
    }
    if (!network) {
      toast({ title: "Network Required", description: "Please select MTN or Airtel", variant: "destructive" });
      return;
    }

    createOrder.mutate({
      data: { phone, network },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground ml-1">Recipient Mobile Number</label>
          <Input
            placeholder="e.g. 256700000000"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ''))}
            icon={<Phone className="h-5 w-5" />}
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground ml-1">Mobile Network</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setNetwork("MTN")}
              className={`relative h-16 rounded-xl flex items-center justify-center gap-3 border-2 transition-all duration-200 ${
                network === "MTN"
                  ? "border-primary bg-primary/10 text-primary glow-primary"
                  : "border-border bg-background hover:border-primary/50 text-muted-foreground"
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${network === "MTN" ? "bg-primary" : "bg-muted"}`} />
              <span className="font-bold text-lg">MTN</span>
            </button>
            <button
              type="button"
              onClick={() => setNetwork("Airtel")}
              className={`relative h-16 rounded-xl flex items-center justify-center gap-3 border-2 transition-all duration-200 ${
                network === "Airtel"
                  ? "border-destructive bg-destructive/10 text-destructive shadow-[0_0_30px_hsl(var(--destructive)/0.2)]"
                  : "border-border bg-background hover:border-destructive/50 text-muted-foreground"
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${network === "Airtel" ? "bg-destructive" : "bg-muted"}`} />
              <span className="font-bold text-lg">Airtel</span>
            </button>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full mt-4"
          isLoading={createOrder.isPending}
          disabled={!phone || !network}
        >
          <span>Continue to Payment</span>
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
        
        <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-2">
          <Building2 className="w-4 h-4" /> Secure automated payouts
        </p>
      </form>
    </motion.div>
  );
}
