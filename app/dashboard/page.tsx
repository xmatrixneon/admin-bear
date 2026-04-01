"use client";

import { motion } from "framer-motion";
import {
  Users,
  Wallet,
  Activity,
  Server,
  RefreshCw,
  Loader2,
  MessageSquare,
  Crown,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PageHeader } from "@/components/admin/page-header";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 280, damping: 24, delay },
});

export default function DashboardPage() {
  // Stats queries
  const { data: generalStats, isLoading: generalStatsLoading, refetch } = trpc.stats.getDashboardStats.useQuery();
  const { data: chartData, isLoading: chartDataLoading } = trpc.stats.getRechargeSpentChart.useQuery({ days: 7 });
  const { data: topServices, isLoading: topServicesLoading } = trpc.stats.getTopSellingServices.useQuery({ limit: 8 });

  const isLoading = generalStatsLoading || chartDataLoading || topServicesLoading;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl">
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        description="Overview of your virtual number service"
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            <span className="ml-2 hidden sm:inline">Refresh</span>
          </Button>
        }
      />

      {/* Minimal Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
        <MiniStatCard
          icon={Users}
          value={generalStats?.totalUsers || 0}
          label="Users"
          color="text-blue-500"
          bg="bg-blue-500/10"
          loading={generalStatsLoading}
        />
        <MiniStatCard
          icon={Server}
          value={generalStats?.totalServers || 0}
          label="Servers"
          color="text-purple-500"
          bg="bg-purple-500/10"
          loading={generalStatsLoading}
        />
        <MiniStatCard
          icon={MessageSquare}
          value={generalStats?.otpSold || 0}
          label="OTP Sold"
          color="text-rose-500"
          bg="bg-rose-500/10"
          loading={generalStatsLoading}
        />
        <MiniStatCard
          icon={Wallet}
          value={formatCurrency(generalStats?.totalWalletBalance || 0)}
          label="Balance"
          color="text-emerald-500"
          bg="bg-emerald-500/10"
          loading={generalStatsLoading}
        />
      </div>

      {/* Money In Detail Row */}
      <motion.div {...fadeUp(0.02)} className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <MiniStatCard
          icon={Zap}
          value={formatCurrency(generalStats?.totalDeposits || 0)}
          label="UPI Total"
          color="text-blue-500"
          bg="bg-blue-500/10"
          loading={generalStatsLoading}
        />
        <MiniStatCard
          icon={Crown}
          value={formatCurrency(generalStats?.totalPromo || 0)}
          label="Promo Given"
          color="text-purple-500"
          bg="bg-purple-500/10"
          loading={generalStatsLoading}
        />
        <MiniStatCard
          icon={CheckCircle}
          value={formatCurrency(generalStats?.totalReferral || 0)}
          label="Referral Given"
          color="text-cyan-500"
          bg="bg-cyan-500/10"
          loading={generalStatsLoading}
        />
        <MiniStatCard
          icon={DollarSign}
          value={generalStats?.depositCount || 0}
          label="UPI Txns"
          color="text-orange-500"
          bg="bg-orange-500/10"
          loading={generalStatsLoading}
        />
      </motion.div>

      {/* Active Numbers Detail Row */}
      <motion.div {...fadeUp(0.025)} className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <MiniStatCard
          icon={Clock}
          value={generalStats?.activeNumbersPending || 0}
          label="Pending"
          color="text-amber-500"
          bg="bg-amber-500/10"
          loading={generalStatsLoading}
        />
        <MiniStatCard
          icon={CheckCircle}
          value={generalStats?.activeNumbersCompleted || 0}
          label="Completed"
          color="text-green-500"
          bg="bg-green-500/10"
          loading={generalStatsLoading}
        />
        <MiniStatCard
          icon={XCircle}
          value={generalStats?.activeNumbersCancelled || 0}
          label="Cancelled"
          color="text-red-500"
          bg="bg-red-500/10"
          loading={generalStatsLoading}
        />
        <MiniStatCard
          icon={Wallet}
          value={formatCurrency(generalStats?.pendingRevenueHeld || 0)}
          label="Held ₹"
          color="text-orange-500"
          bg="bg-orange-500/10"
          loading={generalStatsLoading}
        />
      </motion.div>

      {/* Chart - Recharge vs Spent (Full Width) */}
      <motion.div {...fadeUp(0.05)}>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold">Recharge vs Spent</h3>
                <p className="text-xs text-muted-foreground">Last 7 days (IST)</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">Recharge</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-muted-foreground">Spent</span>
                </div>
              </div>
            </div>
            {chartDataLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData?.chartData || []}>
                  <defs>
                    <linearGradient id="colorRecharge" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} className="text-muted-foreground" width={40} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} formatter={(value: number) => [formatCurrency(value)]} />
                  <Area type="monotone" dataKey="recharge" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorRecharge)" />
                  <Area type="monotone" dataKey="spent" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorSpent)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Selling Services */}
      <motion.div {...fadeUp(0.1)}>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="text-amber-500 size-4" />
              <div>
                <h3 className="text-sm font-semibold">Top Selling Services</h3>
                <p className="text-xs text-muted-foreground">All time ranking by purchases</p>
              </div>
            </div>
            {topServicesLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {topServices?.map((service, index) => (
                  <div
                    key={service.id}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors",
                      index < 3 && "border-amber-500/30 bg-amber-500/5"
                    )}
                  >
                    <span className={cn(
                      "text-[10px] font-bold mb-1",
                      index === 0 ? "text-amber-500" :
                      index === 1 ? "text-slate-400" :
                      index === 2 ? "text-orange-600" :
                      "text-muted-foreground"
                    )}>
                      #{index + 1}
                    </span>
                    <span className="text-xs font-medium truncate w-full text-center">{service.name}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">{service.soldCount} sold</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Minimal stat card component
function MiniStatCard({
  icon: Icon,
  value,
  label,
  color,
  bg,
  loading,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  color: string;
  bg: string;
  loading: boolean;
}) {
  return (
    <motion.div {...fadeUp()} className="flex flex-col items-center justify-center p-3 rounded-lg border bg-card">
      <div className={cn("p-1.5 rounded-lg mb-2", bg)}>
        <Icon className={cn("size-4", color)} />
      </div>
      {loading ? (
        <Skeleton className="h-5 w-12 mb-1" />
      ) : (
        <span className="text-sm font-bold tabular-nums">{value}</span>
      )}
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </motion.div>
  );
}
