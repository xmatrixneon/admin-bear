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
  TrendingUp,
  TrendingDown,
  ArrowDownUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import {
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
  Cell,
} from "recharts";
import { StatsCard } from "@/components/admin/stats-card";
import { PageHeader } from "@/components/admin/page-header";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 280, damping: 24, delay },
});

export default function DashboardPage() {
  // Stats queries using tRPC
  const { data: generalStats, isLoading: generalStatsLoading, refetch: refetchGeneralStats } = trpc.stats.getDashboardStats.useQuery();

  const { data: transactionStats, isLoading: transactionStatsLoading } = trpc.stats.getTransactionStats.useQuery();

  const { data: chartData, isLoading: chartDataLoading } = trpc.stats.getRechargeSpentChart.useQuery({ days: 7 });

  const isLoading = generalStatsLoading || transactionStatsLoading || chartDataLoading;

  // Calculate values
  const totalUsers = generalStats?.totalUsers || 0;
  const totalServices = generalStats?.totalServices || 0;
  const totalServers = generalStats?.totalServers || 0;
  const totalTransactions = generalStats?.totalRechargeTransactions || 0;
  const totalRecharge = generalStats?.totalRecharge || 0;
  const totalOtpSold = generalStats?.otpSold || 0;
  const totalRevenue = generalStats?.totalRevenue || 0;

  // Chart data from API
  const rechargeSpentData = chartData?.chartData || [];
  const periodRecharge = chartData?.totals?.totalRecharge || 0;
  const periodSpent = chartData?.totals?.totalSpent || 0;
  const periodSms = chartData?.totals?.totalSms || 0;

  // Transaction chart - only Deposit and Promo
  const transactionData = [
    { name: "Deposit", value: transactionStats?.byType?.DEPOSIT?.count || 0, color: "#22c55e" },
    { name: "Promo", value: transactionStats?.byType?.PROMO?.count || 0, color: "#8b5cf6" },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        description="Overview of your virtual number service"
        actions={
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
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatsCard
          title="Total Users"
          value={totalUsers}
          icon={Users}
          color="text-blue-500"
          bgColor="bg-blue-500/5"
          loading={generalStatsLoading}
        />
        <StatsCard
          title="User Balance"
          value={formatCurrency(generalStats?.totalWalletBalance || 0)}
          icon={Wallet}
          color="text-emerald-500"
          bgColor="bg-emerald-500/5"
          loading={generalStatsLoading}
        />
        <StatsCard
          title="Total Services"
          value={totalServices}
          icon={Server}
          color="text-amber-500"
          bgColor="bg-amber-500/5"
          loading={generalStatsLoading}
        />
        <StatsCard
          title="Total Servers"
          value={totalServers}
          icon={Server}
          color="text-purple-500"
          bgColor="bg-purple-500/5"
          loading={generalStatsLoading}
        />
        <StatsCard
          title="Total Transactions"
          value={totalTransactions}
          icon={Activity}
          color="text-cyan-500"
          bgColor="bg-cyan-500/5"
          loading={transactionStatsLoading}
        />
        <StatsCard
          title="Total Recharge"
          value={formatCurrency(totalRecharge)}
          icon={CreditCard}
          color="text-green-500"
          bgColor="bg-green-500/5"
          loading={generalStatsLoading}
        />
        <StatsCard
          title="OTP Sold"
          value={totalOtpSold}
          icon={MessageSquare}
          color="text-rose-500"
          bgColor="bg-rose-500/5"
          loading={generalStatsLoading}
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          color="text-primary"
          bgColor="bg-primary/5"
          loading={generalStatsLoading}
        />
      </div>

      {/* Period Stats - Recharge & Spent */}
      <motion.div {...fadeUp(0.05)}>
        <Card className="bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <ArrowDownUp className="text-primary" size={20} />
              <h3 className="font-semibold">Last 7 Days Overview</h3>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="text-green-500" size={18} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Recharge (UPI + Promo)</p>
                  {chartDataLoading ? (
                    <Skeleton className="h-5 w-20 mt-1" />
                  ) : (
                    <p className="text-lg font-bold text-green-500">{formatCurrency(periodRecharge)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <TrendingDown className="text-red-500" size={18} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Spent (SMS Received)</p>
                  {chartDataLoading ? (
                    <Skeleton className="h-5 w-20 mt-1" />
                  ) : (
                    <p className="text-lg font-bold text-red-500">{formatCurrency(periodSpent)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <MessageSquare className="text-blue-500" size={18} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">SMS Received</p>
                  {chartDataLoading ? (
                    <Skeleton className="h-5 w-20 mt-1" />
                  ) : (
                    <p className="text-lg font-bold text-blue-500">{periodSms}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <DollarSign className="text-purple-500" size={18} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Net Flow</p>
                  {chartDataLoading ? (
                    <Skeleton className="h-5 w-20 mt-1" />
                  ) : (
                    <p className={`text-lg font-bold ${periodRecharge - periodSpent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatCurrency(periodRecharge - periodSpent)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        {/* Recharge vs Spent Chart */}
        <motion.div {...fadeUp(0.1)}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownUp size={18} />
                Recharge vs Spent (Last 7 Days)
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Recharge = UPI + Promo | Spent = SMS Received
              </p>
            </CardHeader>
            <CardContent>
              {chartDataLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={rechargeSpentData}>
                    <defs>
                      <linearGradient id="colorRecharge" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05}/>
                      </linearGradient>
                      <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="fullDate" className="text-xs" tick={{ fontSize: 11 }} />
                    <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number, name: string) => [
                        name === 'Recharge (UPI+Promo)' || name === 'Spent (SMS)' ? formatCurrency(value) : value,
                        name
                      ]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="recharge"
                      stroke="#22c55e"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRecharge)"
                      name="Recharge (UPI+Promo)"
                    />
                    <Area
                      type="monotone"
                      dataKey="spent"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorSpent)"
                      name="Spent (SMS)"
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
              {transactionStatsLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={transactionData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 11 }} />
                    <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Count">
                      {transactionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
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
            href="/dashboard/wallets"
            className="bg-card hover:bg-muted border border-border rounded-xl p-4 flex flex-col items-center gap-2 transition-colors"
          >
            <Wallet size={24} className="text-emerald-500" />
            <span className="text-sm font-medium">Wallets</span>
            <ArrowUpRight size={14} className="text-muted-foreground" />
          </a>
          <a
            href="/dashboard/transactions"
            className="bg-card hover:bg-muted border border-border rounded-xl p-4 flex flex-col items-center gap-2 transition-colors"
          >
            <Activity size={24} className="text-cyan-500" />
            <span className="text-sm font-medium">Transactions</span>
            <ArrowUpRight size={14} className="text-muted-foreground" />
          </a>
          <a
            href="/dashboard/servers"
            className="bg-card hover:bg-muted border border-border rounded-xl p-4 flex flex-col items-center gap-2 transition-colors"
          >
            <Server size={24} className="text-purple-500" />
            <span className="text-sm font-medium">Servers</span>
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
            <CreditCard size={24} className="text-orange-500" />
            <span className="text-sm font-medium">Promocodes</span>
            <ArrowUpRight size={14} className="text-muted-foreground" />
          </a>
          <a
            href="/dashboard/audit-logs"
            className="bg-card hover:bg-muted border border-border rounded-xl p-4 flex flex-col items-center gap-2 transition-colors"
          >
            <MessageSquare size={24} className="text-rose-500" />
            <span className="text-sm font-medium">Audit Logs</span>
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
