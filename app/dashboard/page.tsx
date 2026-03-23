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
  Zap,
  Settings,
  FileText,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
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
import Link from "next/link";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 280, damping: 24, delay },
});

const quickActions = [
  {
    title: "Users",
    href: "/dashboard/users",
    icon: Users,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "hover:border-blue-500/30",
    description: "Manage accounts",
  },
  {
    title: "Wallets",
    href: "/dashboard/wallets",
    icon: Wallet,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "hover:border-emerald-500/30",
    description: "View balances",
  },
  {
    title: "Transactions",
    href: "/dashboard/transactions",
    icon: Activity,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    borderColor: "hover:border-cyan-500/30",
    description: "Payment history",
  },
  {
    title: "Servers",
    href: "/dashboard/servers",
    icon: Server,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "hover:border-purple-500/30",
    description: "OTP servers",
  },
  {
    title: "Services",
    href: "/dashboard/services",
    icon: Zap,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "hover:border-amber-500/30",
    description: "Manage services",
  },
  {
    title: "Promocodes",
    href: "/dashboard/promocodes",
    icon: Tag,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "hover:border-orange-500/30",
    description: "Discount codes",
  },
  {
    title: "Audit Logs",
    href: "/dashboard/audit-logs",
    icon: FileText,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    borderColor: "hover:border-rose-500/30",
    description: "Activity trail",
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "hover:border-primary/30",
    description: "App config",
  },
];

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
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
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
              <Loader2 size={14} className="mr-2 animate-spin" />
            ) : (
              <RefreshCw size={14} className="mr-2" />
            )}
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
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
        <Card className="overflow-hidden border-border/50">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent" />
          <CardContent className="p-3 sm:p-4 md:p-5 lg:p-6 relative">
            <div className="flex items-center gap-2 mb-3 sm:mb-4 md:mb-5">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
                <ArrowDownUp className="text-primary size-3.5 sm:size-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold">Last 7 Days Overview</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Recharge vs Spent metrics</p>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 p-2 sm:p-2.5 md:p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                <div className="p-1.5 sm:p-2 md:p-2.5 rounded-lg bg-green-500/10 shrink-0">
                  <TrendingUp className="text-green-500 size-3.5 sm:size-4 md:size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Recharge (UPI + Promo)</p>
                  {chartDataLoading ? (
                    <Skeleton className="h-4 sm:h-5 md:h-6 w-12 sm:w-16 md:w-20 mt-0.5 sm:mt-1" />
                  ) : (
                    <p className="text-sm sm:text-base md:text-lg font-bold text-green-500 truncate">{formatCurrency(periodRecharge)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 p-2 sm:p-2.5 md:p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                <div className="p-1.5 sm:p-2 md:p-2.5 rounded-lg bg-red-500/10 shrink-0">
                  <TrendingDown className="text-red-500 size-3.5 sm:size-4 md:size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Spent (SMS Received)</p>
                  {chartDataLoading ? (
                    <Skeleton className="h-4 sm:h-5 md:h-6 w-12 sm:w-16 md:w-20 mt-0.5 sm:mt-1" />
                  ) : (
                    <p className="text-sm sm:text-base md:text-lg font-bold text-red-500 truncate">{formatCurrency(periodSpent)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 p-2 sm:p-2.5 md:p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <div className="p-1.5 sm:p-2 md:p-2.5 rounded-lg bg-blue-500/10 shrink-0">
                  <MessageSquare className="text-blue-500 size-3.5 sm:size-4 md:size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">SMS Received</p>
                  {chartDataLoading ? (
                    <Skeleton className="h-4 sm:h-5 md:h-6 w-12 sm:w-16 md:w-20 mt-0.5 sm:mt-1" />
                  ) : (
                    <p className="text-sm sm:text-base md:text-lg font-bold text-blue-500 truncate">{periodSms}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 p-2 sm:p-2.5 md:p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                <div className="p-1.5 sm:p-2 md:p-2.5 rounded-lg bg-purple-500/10 shrink-0">
                  <DollarSign className="text-purple-500 size-3.5 sm:size-4 md:size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Net Flow</p>
                  {chartDataLoading ? (
                    <Skeleton className="h-4 sm:h-5 md:h-6 w-12 sm:w-16 md:w-20 mt-0.5 sm:mt-1" />
                  ) : (
                    <p className={cn(
                      "text-sm sm:text-base md:text-lg font-bold truncate",
                      periodRecharge - periodSpent >= 0 ? "text-green-500" : "text-red-500"
                    )}>
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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {/* Recharge vs Spent Chart */}
        <motion.div {...fadeUp(0.1)}>
          <Card className="border-border/50">
            <CardHeader className="pb-2 p-3 sm:p-4 md:p-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
                  <ArrowDownUp className="text-primary size-3 sm:size-4" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-sm sm:text-base">Recharge vs Spent</CardTitle>
                  <CardDescription className="text-[10px] sm:text-xs">Last 7 days trend</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-4 md:p-6">
              {chartDataLoading ? (
                <Skeleton className="h-[180px] sm:h-[220px] md:h-[280px] w-full" />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180} className="sm:hidden">
                    <AreaChart data={rechargeSpentData}>
                      <defs>
                        <linearGradient id="colorRechargeMobile" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorSpentMobile" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} className="text-muted-foreground" interval={0} />
                      <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} className="text-muted-foreground" width={35} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} formatter={(value: number, name: string) => [formatCurrency(value), name]} />
                      <Area type="monotone" dataKey="recharge" stroke="#22c55e" strokeWidth={1.5} fillOpacity={1} fill="url(#colorRechargeMobile)" name="Recharge (UPI+Promo)" />
                      <Area type="monotone" dataKey="spent" stroke="#ef4444" strokeWidth={1.5} fillOpacity={1} fill="url(#colorSpentMobile)" name="Spent (SMS)" />
                    </AreaChart>
                  </ResponsiveContainer>
                  <ResponsiveContainer width="100%" height={220} className="hidden sm:block md:hidden">
                    <AreaChart data={rechargeSpentData}>
                      <defs>
                        <linearGradient id="colorRechargeMd" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorSpentMd" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} className="text-muted-foreground" interval={0} />
                      <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} className="text-muted-foreground" width={40} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px", fontSize: "12px" }} formatter={(value: number, name: string) => [formatCurrency(value), name]} />
                      <Legend wrapperStyle={{ paddingTop: "12px" }} iconType="circle" />
                      <Area type="monotone" dataKey="recharge" stroke="#22c55e" strokeWidth={1.5} fillOpacity={1} fill="url(#colorRechargeMd)" name="Recharge (UPI+Promo)" />
                      <Area type="monotone" dataKey="spent" stroke="#ef4444" strokeWidth={1.5} fillOpacity={1} fill="url(#colorSpentMd)" name="Spent (SMS)" />
                    </AreaChart>
                  </ResponsiveContainer>
                  <ResponsiveContainer width="100%" height={280} className="hidden md:block">
                    <AreaChart data={rechargeSpentData}>
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
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="fullDate" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} className="text-muted-foreground" />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} className="text-muted-foreground" />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} formatter={(value: number, name: string) => [formatCurrency(value), name]} />
                      <Legend wrapperStyle={{ paddingTop: "16px" }} iconType="circle" />
                      <Area type="monotone" dataKey="recharge" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorRecharge)" name="Recharge (UPI+Promo)" />
                      <Area type="monotone" dataKey="spent" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorSpent)" name="Spent (SMS)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Transaction Chart */}
        <motion.div {...fadeUp(0.15)}>
          <Card className="border-border/50">
            <CardHeader className="pb-2 p-3 sm:p-4 md:p-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
                  <Activity className="text-primary size-3 sm:size-4" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-sm sm:text-base">Transactions by Type</CardTitle>
                  <CardDescription className="text-[10px] sm:text-xs">Distribution overview</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-4 md:p-6">
              {transactionStatsLoading ? (
                <Skeleton className="h-[180px] sm:h-[220px] md:h-[280px] w-full" />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180} className="sm:hidden">
                    <BarChart data={transactionData} barSize={40}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={30} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} formatter={(value: number) => [value, "Count"]} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Count">
                        {transactionData.map((entry, index) => (
                          <Cell key={`cell-mobile-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <ResponsiveContainer width="100%" height={220} className="hidden sm:block md:hidden">
                    <BarChart data={transactionData} barSize={50}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={35} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px", fontSize: "12px" }} formatter={(value: number) => [value, "Count"]} />
                      <Legend wrapperStyle={{ paddingTop: "12px" }} iconType="circle" />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Count">
                        {transactionData.map((entry, index) => (
                          <Cell key={`cell-sm-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <ResponsiveContainer width="100%" height={280} className="hidden md:block">
                    <BarChart data={transactionData} barSize={60}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} formatter={(value: number) => [value, "Count"]} />
                      <Legend wrapperStyle={{ paddingTop: "16px" }} iconType="circle" />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Count">
                        {transactionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div {...fadeUp(0.2)}>
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Zap className="text-primary size-3.5 sm:size-4" />
          <h2 className="text-base sm:text-lg font-semibold">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                "group relative overflow-hidden bg-card hover:bg-muted/50 border border-border rounded-xl p-3 sm:p-4 md:p-5 transition-all duration-300",
                "hover:shadow-lg hover:shadow-primary/5",
                action.borderColor
              )}
            >
              <div className={cn(
                "absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity -translate-y-1/2 translate-x-1/2",
                action.bgColor
              )} />
              <div className="relative">
                <div className={cn(
                  "inline-flex p-1.5 sm:p-2 md:p-2.5 rounded-xl mb-2 sm:mb-3 transition-transform group-hover:scale-110",
                  action.bgColor
                )}>
                  <action.icon size={16} className="sm:size-5" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm font-medium block truncate">{action.title}</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground hidden xs:block truncate">{action.description}</span>
                  </div>
                  <ArrowUpRight className="text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-0.5 group-hover:-translate-y-0.5 duration-200 shrink-0 ml-1 size-3 sm:size-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
