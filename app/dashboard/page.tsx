"use client";

import { motion } from "framer-motion";
import {
  Users,
  Wallet,
  Activity,
  Server,
  ArrowUpRight,
  CreditCard,
  MessageSquare,
  DollarSign,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 280, damping: 24, delay },
});

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  loading = false,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  loading?: boolean;
}) {
  return (
    <motion.div {...fadeUp()} className={`${bgColor} rounded-xl p-4 border border-border`}>
      <div className="flex items-center gap-3">
        <div className={`${color} p-2 rounded-lg`}>
          <Icon size={18} />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{title}</p>
          {loading ? (
            <Skeleton className="h-6 w-16 mt-1" />
          ) : (
            <p className="text-xl font-bold">{value}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  // Stats queries using tRPC
  const { data: generalStats, isLoading: generalStatsLoading, refetch: refetchGeneralStats } = trpc.stats.getDashboardStats.useQuery();

  const { data: transactionStats, isLoading: transactionStatsLoading } = trpc.stats.getTransactionStats.useQuery();

  const isLoading = generalStatsLoading || transactionStatsLoading;

  // Calculate values
  const totalUsers = generalStats?.totalUsers || 0;
  const totalServices = generalStats?.totalServices || 0;
  const totalServers = generalStats?.totalServers || 0;
  const totalTransactions = transactionStats?.total || 0;
  const totalRecharge = generalStats?.totalRecharge || 0;
  const totalOtpSold = generalStats?.otpRevenue || 0;
  const totalRevenue = generalStats?.totalRevenue || 0;

  // Generate mock data for charts
  const revenueData = Array.from({ length: 7 }, (_, i) => ({
    day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
    revenue: Math.floor(Math.random() * 5000) + 2000,
    deposits: Math.floor(Math.random() * 3000) + 1000,
  }));

  const transactionData = [
    { name: "Deposit", value: transactionStats?.byType?.DEPOSIT?.count || 0, color: "#22c55e" },
    { name: "Purchase", value: transactionStats?.byType?.PURCHASE?.count || 0, color: "#3b82f6" },
    { name: "Refund", value: transactionStats?.byType?.REFUND?.count || 0, color: "#f59e0b" },
    { name: "Promo", value: transactionStats?.byType?.PROMO?.count || 0, color: "#8b5cf6" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div {...fadeUp()} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your virtual number service
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchGeneralStats()}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 size={16} className="mr-2 animate-spin" />
          ) : (
            <RefreshCw size={16} className="mr-2" />
          )}
          Refresh
        </Button>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={totalUsers}
          icon={Users}
          color="text-blue-500"
          bgColor="bg-blue-500/5"
          loading={generalStatsLoading}
        />
        <StatCard
          title="Total Services"
          value={totalServices}
          icon={Server}
          color="text-amber-500"
          bgColor="bg-amber-500/5"
          loading={generalStatsLoading}
        />
        <StatCard
          title="Total Servers"
          value={totalServers}
          icon={Server}
          color="text-purple-500"
          bgColor="bg-purple-500/5"
          loading={generalStatsLoading}
        />
        <StatCard
          title="Total Transactions"
          value={totalTransactions}
          icon={Activity}
          color="text-cyan-500"
          bgColor="bg-cyan-500/5"
          loading={transactionStatsLoading}
        />
        <StatCard
          title="Total Recharge"
          value={formatCurrency(totalRecharge)}
          icon={CreditCard}
          color="text-green-500"
          bgColor="bg-green-500/5"
          loading={generalStatsLoading}
        />
        <StatCard
          title="OTP Sold"
          value={totalOtpSold}
          icon={MessageSquare}
          color="text-rose-500"
          bgColor="bg-rose-500/5"
          loading={generalStatsLoading}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          color="text-primary"
          bgColor="bg-primary/5"
          loading={generalStatsLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <motion.div {...fadeUp(0.1)}>
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      name="Revenue"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Transaction Chart */}
        <motion.div {...fadeUp(0.15)}>
          <Card>
            <CardHeader>
              <CardTitle>Transactions by Type</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={transactionData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div {...fadeUp(0.2)}>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <a
            href="/dashboard/users"
            className="bg-card hover:bg-muted border border-border rounded-xl p-4 flex flex-col items-center gap-2 transition-colors"
          >
            <Users size={24} className="text-blue-500" />
            <span className="text-sm font-medium">Users</span>
            <ArrowUpRight size={14} className="text-muted-foreground" />
          </a>
          <a
            href="/dashboard/services"
            className="bg-card hover:bg-muted border border-border rounded-xl p-4 flex flex-col items-center gap-2 transition-colors"
          >
            <Server size={24} className="text-amber-500" />
            <span className="text-sm font-medium">Services</span>
            <ArrowUpRight size={14} className="text-muted-foreground" />
          </a>
          <a
            href="/dashboard/promocodes"
            className="bg-card hover:bg-muted border border-border rounded-xl p-4 flex flex-col items-center gap-2 transition-colors"
          >
            <Activity size={24} className="text-green-500" />
            <span className="text-sm font-medium">Promocodes</span>
            <ArrowUpRight size={14} className="text-muted-foreground" />
          </a>
          <a
            href="/dashboard/settings"
            className="bg-card hover:bg-muted border border-border rounded-xl p-4 flex flex-col items-center gap-2 transition-colors"
          >
            <Wallet size={24} className="text-primary" />
            <span className="text-sm font-medium">Settings</span>
            <ArrowUpRight size={14} className="text-muted-foreground" />
          </a>
        </div>
      </motion.div>
    </div>
  );
}
