import { Link } from "wouter";
import { format } from "date-fns";
import { ArrowUpRight, TrendingUp, Wallet, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useWalletBalance, useStats } from "@/hooks/use-wallet";
import { useRecentOrders, type Order } from "@/hooks/use-orders";
import { formatCurrency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: balance, isLoading: loadingBalance } = useWalletBalance();
  const { data: stats, isLoading: loadingStats } = useStats();
  const { data: recentOrders, isLoading: loadingOrders } = useRecentOrders();

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'failed': return <XCircle className="w-4 h-4 text-destructive" />;
      case 'processing': return <TrendingUp className="w-4 h-4 text-warning" />;
      default: return <Clock className="w-4 h-4 text-blue-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return "bg-success/10 text-success border-success/20";
      case 'failed': return "bg-destructive/10 text-destructive border-destructive/20";
      case 'processing': return "bg-warning/10 text-warning border-warning/20";
      default: return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Overview</h1>
          <p className="text-muted-foreground mt-1">Welcome back. Here's your account activity.</p>
        </div>
        <Link href="/send">
          <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-primary/20">
            Send Money <ArrowUpRight className="ml-2 w-5 h-5" />
          </Button>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Wallet className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              USDT Balance
            </p>
            <h2 className="text-4xl font-display font-bold text-white mt-2 tracking-tight">
              {loadingBalance ? <div className="h-10 w-32 bg-white/10 animate-pulse rounded mt-1" /> : 
                formatCurrency(balance?.usdtBalance || 0)
              }
            </h2>
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Est. UGX Value</span>
              <span className="text-white font-medium">
                {loadingBalance ? "..." : formatCurrency(balance?.ugxEquivalent || 0, 'UGX')}
              </span>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <TrendingUp className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-muted-foreground">Total Sent (Lifetime)</p>
            <h2 className="text-4xl font-display font-bold text-white mt-2 tracking-tight">
              {loadingStats ? <div className="h-10 w-32 bg-white/10 animate-pulse rounded mt-1" /> : 
                formatCurrency(stats?.totalUgxPaidOut || 0, 'UGX')
              }
            </h2>
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total Orders</span>
              <span className="text-white font-medium">{stats?.totalOrders || 0}</span>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <AlertCircle className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-muted-foreground">Current Rate</p>
            <h2 className="text-4xl font-display font-bold text-primary mt-2 tracking-tight">
              {loadingBalance ? <div className="h-10 w-32 bg-white/10 animate-pulse rounded mt-1" /> : 
                `1 USDT = ${balance?.usdtRate || '0'}`
              }
            </h2>
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Market Status</span>
              <span className="text-success font-medium flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" /> Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transfers Table */}
      <div className="glass-card rounded-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-card/50">
          <h3 className="font-display font-semibold text-lg text-white">Recent Transfers</h3>
          <Link href="/send" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        
        <div className="overflow-x-auto">
          {loadingOrders ? (
            <div className="p-8 flex justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : recentOrders?.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
              <h4 className="text-white font-medium mb-1">No transfers yet</h4>
              <p className="text-sm text-muted-foreground mb-4">Your recent transaction history will appear here.</p>
              <Link href="/send">
                <Button variant="outline">Make your first transfer</Button>
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-black/20">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Recipient</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentOrders?.slice(0, 5).map((order: Order) => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      {format(new Date(order.createdAt), "MMM d, yyyy HH:mm")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs",
                          order.network === 'MTN' ? "bg-yellow-500/20 text-yellow-500" : "bg-red-500/20 text-red-500"
                        )}>
                          {order.network.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-white">{order.phone}</p>
                          <p className="text-xs text-muted-foreground">{order.network}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{formatCurrency(order.amount || 0)}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(order.ugxAmount || 0, 'UGX')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                        getStatusColor(order.status)
                      )}>
                        {getStatusIcon(order.status)}
                        <span className="capitalize">{order.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
