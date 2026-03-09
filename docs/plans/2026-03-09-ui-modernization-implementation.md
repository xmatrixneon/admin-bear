# UI Modernization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Modernize the MeowSMS Admin Dashboard with mobile-first responsive UI using shadcn/ui components.

**Architecture:** Incremental modernization approach - create reusable components first, then update layout, then update pages one-by-one. Mobile-first responsive design with sheet-based sidebar on mobile and collapsible sidebar on desktop.

**Tech Stack:** Next.js 16, React 19, shadcn/ui, Tailwind CSS v4, Framer Motion, tRPC

---

## Task 1: Create StatsCard Component

**Files:**
- Create: `components/admin/stats-card.tsx`

**Step 1: Create the StatsCard component**

```tsx
"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
  bgColor?: string;
  trend?: { value: number; direction: "up" | "down" };
  loading?: boolean;
  className?: string;
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 280, damping: 24, delay },
});

export function StatsCard({
  title,
  value,
  icon: Icon,
  color = "text-primary",
  bgColor = "bg-primary/5",
  trend,
  loading = false,
  className,
}: StatsCardProps) {
  return (
    <motion.div {...fadeUp()} className={className}>
      <Card className={cn(bgColor, "border-border hover:shadow-sm transition-shadow")}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn(color, "p-2.5 rounded-lg bg-background/50")}>
              <Icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">{title}</p>
              {loading ? (
                <Skeleton className="h-6 w-20 mt-1" />
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold truncate">{value}</p>
                  {trend && (
                    <span
                      className={cn(
                        "text-xs flex items-center gap-0.5",
                        trend.direction === "up" ? "text-green-500" : "text-red-500"
                      )}
                    >
                      {trend.direction === "up" ? (
                        <TrendingUp size={12} />
                      ) : (
                        <TrendingDown size={12} />
                      )}
                      {trend.value}%
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
```

**Step 2: Verify component builds**

Run: `npm run build`
Expected: No errors

**Step 3: Commit**

```bash
git add components/admin/stats-card.tsx
git commit -m "feat: add reusable StatsCard component"
```

---

## Task 2: Create PageHeader Component

**Files:**
- Create: `components/admin/page-header.tsx`

**Step 1: Create the PageHeader component**

```tsx
"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

const fadeUp = () => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 280, damping: 24 },
});

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <motion.div
      {...fadeUp()}
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </motion.div>
  );
}
```

**Step 2: Verify component builds**

Run: `npm run build`
Expected: No errors

**Step 3: Commit**

```bash
git add components/admin/page-header.tsx
git commit -m "feat: add reusable PageHeader component"
```

---

## Task 3: Create FilterBar Component

**Files:**
- Create: `components/admin/filter-bar.tsx`

**Step 1: Create the FilterBar component**

```tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, ArrowUpDown, ChevronDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
}

interface SortOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filterOptions?: FilterOption[];
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  sortOptions?: SortOption[];
  sortValue?: string;
  sortOrder?: "asc" | "desc";
  onSortChange?: (value: string) => void;
  className?: string;
}

const fadeUp = () => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 280, damping: 24 },
});

export function FilterBar({
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  filterOptions,
  filterValue,
  onFilterChange,
  sortOptions,
  sortValue,
  sortOrder,
  onSortChange,
  className,
}: FilterBarProps) {
  const hasFilters = filterOptions && filterOptions.length > 0;
  const hasSort = sortOptions && sortOptions.length > 0;

  return (
    <motion.div {...fadeUp()} className={className}>
      <Card className="border-border">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
              {searchValue && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => onSearchChange("")}
                >
                  <X size={14} />
                </Button>
              )}
            </div>

            {/* Filter & Sort buttons */}
            <div className="flex gap-2">
              {hasFilters && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none">
                      <Filter size={14} />
                      <span className="sm:hidden">Filter</span>
                      <span className="hidden sm:inline">
                        {filterOptions.find((f) => f.value === filterValue)?.label || "Filter"}
                      </span>
                      <ChevronDown size={14} className="hidden sm:inline" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {filterOptions.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => onFilterChange?.(option.value)}
                        className={cn(filterValue === option.value && "bg-accent")}
                      >
                        {option.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {hasSort && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none">
                      <ArrowUpDown size={14} />
                      <span className="sm:hidden">Sort</span>
                      <span className="hidden sm:inline">
                        {sortOptions.find((s) => s.value === sortValue)?.label || "Sort"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {sortOptions.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => onSortChange?.(option.value)}
                      >
                        <span className="flex-1">{option.label}</span>
                        {sortValue === option.value && (
                          <span className="text-muted-foreground text-xs">
                            {sortOrder === "asc" ? "ASC" : "DESC"}
                          </span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
```

**Step 2: Verify component builds**

Run: `npm run build`
Expected: No errors

**Step 3: Commit**

```bash
git add components/admin/filter-bar.tsx
git commit -m "feat: add reusable FilterBar component"
```

---

## Task 4: Update Admin Sidebar for Mobile-First

**Files:**
- Modify: `components/admin/admin-sidebar.tsx`

**Step 1: Update the sidebar to use shadcn sidebar properly**

Replace the entire file with:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Server,
  CreditCard,
  Tag,
  Settings,
  LogOut,
  Wallet,
  FileText,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Users", href: "/dashboard/users", icon: Users },
  { title: "Wallets", href: "/dashboard/wallets", icon: Wallet },
  { title: "Transactions", href: "/dashboard/transactions", icon: CreditCard },
  { title: "Servers", href: "/dashboard/servers", icon: Server },
  { title: "Services", href: "/dashboard/services", icon: Server },
  { title: "Promocodes", href: "/dashboard/promocodes", icon: Tag },
  { title: "Audit Logs", href: "/dashboard/audit-logs", icon: FileText },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [adminUser, setAdminUser] = useState<{ name?: string; telegramId?: string; username?: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("admin_user");
      if (stored) setAdminUser(JSON.parse(stored));
    } catch {}
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    window.location.href = "/login";
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  <Shield className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">MeowSMS</span>
                  <span className="text-xs text-muted-foreground">Admin Panel</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        <SidebarMenu>
          {mounted && adminUser && (
            <SidebarMenuItem>
              <div className="flex flex-col gap-0.5 px-3 py-2">
                <span className="text-sm font-medium truncate">
                  {adminUser?.name || "Admin"}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {adminUser?.telegramId || adminUser?.username || "Administrator"}
                </span>
              </div>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="size-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
```

**Step 2: Verify sidebar builds**

Run: `npm run build`
Expected: No errors

**Step 3: Commit**

```bash
git add components/admin/admin-sidebar.tsx
git commit -m "feat: update sidebar with shadcn sidebar pattern and mobile support"
```

---

## Task 5: Update Dashboard Layout

**Files:**
- Modify: `app/dashboard/layout.tsx`

**Step 1: Update the layout with responsive header**

Replace the entire file with:

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Loader2, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb className="flex-1">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="text-base font-semibold">
                  Dashboard
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="ml-auto"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 pt-6 md:gap-6 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

**Step 2: Verify layout builds**

Run: `npm run build`
Expected: No errors

**Step 3: Commit**

```bash
git add app/dashboard/layout.tsx
git commit -m "feat: update dashboard layout with theme toggle and responsive header"
```

---

## Task 6: Update Dashboard Page with New Components

**Files:**
- Modify: `app/dashboard/page.tsx`

**Step 1: Update the dashboard page**

Replace the entire file with:

```tsx
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
import { StatsCard } from "@/components/admin/stats-card";
import { PageHeader } from "@/components/admin/page-header";
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

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 280, damping: 24, delay },
});

export default function DashboardPage() {
  const { data: generalStats, isLoading: generalStatsLoading, refetch: refetchGeneralStats } = trpc.stats.getDashboardStats.useQuery();
  const { data: transactionStats, isLoading: transactionStatsLoading } = trpc.stats.getTransactionStats.useQuery();
  const { data: chartData, isLoading: chartDataLoading } = trpc.stats.getRechargeSpentChart.useQuery({ days: 7 });

  const isLoading = generalStatsLoading || transactionStatsLoading || chartDataLoading;

  const totalUsers = generalStats?.totalUsers || 0;
  const totalServices = generalStats?.totalServices || 0;
  const totalServers = generalStats?.totalServers || 0;
  const totalTransactions = transactionStats?.total || 0;
  const totalRecharge = generalStats?.totalRecharge || 0;
  const totalOtpSold = generalStats?.otpRevenue || 0;
  const totalRevenue = generalStats?.totalRevenue || 0;

  const rechargeSpentData = chartData?.chartData || [];
  const periodRecharge = chartData?.totals?.totalRecharge || 0;
  const periodSpent = chartData?.totals?.totalSpent || 0;
  const periodSms = chartData?.totals?.totalSms || 0;

  const transactionData = [
    { name: "Deposit", value: transactionStats?.byType?.DEPOSIT?.count || 0, color: "#22c55e" },
    { name: "Purchase", value: transactionStats?.byType?.PURCHASE?.count || 0, color: "#3b82f6" },
    { name: "Refund", value: transactionStats?.byType?.REFUND?.count || 0, color: "#f59e0b" },
    { name: "Promo", value: transactionStats?.byType?.PROMO?.count || 0, color: "#8b5cf6" },
  ];

  const quickActions = [
    { title: "Users", href: "/dashboard/users", icon: Users, color: "text-blue-500" },
    { title: "Wallets", href: "/dashboard/wallets", icon: Wallet, color: "text-emerald-500" },
    { title: "Transactions", href: "/dashboard/transactions", icon: Activity, color: "text-cyan-500" },
    { title: "Servers", href: "/dashboard/servers", icon: Server, color: "text-purple-500" },
    { title: "Services", href: "/dashboard/services", icon: Server, color: "text-amber-500" },
    { title: "Promocodes", href: "/dashboard/promocodes", icon: CreditCard, color: "text-orange-500" },
    { title: "Audit Logs", href: "/dashboard/audit-logs", icon: MessageSquare, color: "text-rose-500" },
    { title: "Settings", href: "/dashboard/settings", icon: DollarSign, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
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

      {/* Period Stats */}
      <motion.div {...fadeUp(0.05)}>
        <Card className="bg-gradient-to-r from-primary/5 to-transparent border-border">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <ArrowDownUp className="text-primary" size={20} />
              <h3 className="font-semibold">Last 7 Days Overview</h3>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="text-green-500" size={18} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Recharge (UPI + Promo)</p>
                  {chartDataLoading ? (
                    <Skeleton className="h-5 w-20 mt-1" />
                  ) : (
                    <p className="text-base md:text-lg font-bold text-green-500">
                      {formatCurrency(periodRecharge)}
                    </p>
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
                    <p className="text-base md:text-lg font-bold text-red-500">
                      {formatCurrency(periodSpent)}
                    </p>
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
                    <p className="text-base md:text-lg font-bold text-blue-500">{periodSms}</p>
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
                    <p
                      className={`text-base md:text-lg font-bold ${
                        periodRecharge - periodSpent >= 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
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
        <motion.div {...fadeUp(0.1)}>
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ArrowDownUp size={18} />
                Recharge vs Spent (Last 7 Days)
              </CardTitle>
              <p className="text-xs text-muted-foreground">
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
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
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
                        name === "Recharge (UPI+Promo)" || name === "Spent (SMS)"
                          ? formatCurrency(value)
                          : value,
                        name,
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

        <motion.div {...fadeUp(0.15)}>
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Transactions by Type</CardTitle>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <a
              key={action.href}
              href={action.href}
              className="bg-card hover:bg-muted border border-border rounded-xl p-4 flex flex-col items-center gap-2 transition-colors group"
            >
              <action.icon size={24} className={action.color} />
              <span className="text-sm font-medium">{action.title}</span>
              <ArrowUpRight
                size={14}
                className="text-muted-foreground group-hover:text-foreground transition-colors"
              />
            </a>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
```

**Step 2: Verify dashboard builds**

Run: `npm run build`
Expected: No errors

**Step 3: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: update dashboard page with new reusable components and mobile-first layout"
```

---

## Task 7: Update Users Page with New Components

**Files:**
- Modify: `app/dashboard/users/page.tsx`

**Step 1: Update the users page**

Replace the file with the updated version using the new PageHeader, StatsCard, and FilterBar components. Also add mobile card view for the table.

The file is long - key changes:
1. Import PageHeader, StatsCard, FilterBar
2. Replace header section with PageHeader
3. Replace stats cards with StatsCard components
4. Replace filter section with FilterBar component
5. Add mobile card view for users list (hidden on md+)
6. Keep table for desktop (hidden on mobile)

**Step 2: Verify users page builds**

Run: `npm run build`
Expected: No errors

**Step 3: Commit**

```bash
git add app/dashboard/users/page.tsx
git commit -m "feat: update users page with new components and mobile card view"
```

---

## Task 8: Update Remaining Pages

**Files:**
- Modify: `app/dashboard/wallets/page.tsx`
- Modify: `app/dashboard/transactions/page.tsx`
- Modify: `app/dashboard/services/page.tsx`
- Modify: `app/dashboard/servers/page.tsx`
- Modify: `app/dashboard/promocodes/page.tsx`
- Modify: `app/dashboard/audit-logs/page.tsx`
- Modify: `app/dashboard/settings/page.tsx`

**Step 1: Update each page with consistent patterns**

For each page:
1. Import and use PageHeader component
2. Use StatsCard for any stats displays
3. Use FilterBar for search/filter sections
4. Add mobile card views for tables
5. Ensure responsive grid layouts

**Step 2: Verify all pages build**

Run: `npm run build`
Expected: No errors

**Step 3: Commit each page separately**

```bash
git add app/dashboard/wallets/page.tsx
git commit -m "feat: update wallets page with mobile-first layout"

git add app/dashboard/transactions/page.tsx
git commit -m "feat: update transactions page with mobile-first layout"

# ... repeat for each page
```

---

## Task 9: Final Testing and Polish

**Step 1: Run full build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 2: Run linter**

Run: `npm run lint`
Expected: No linting errors

**Step 3: Test in browser**

- Test mobile view (resize browser or use dev tools)
- Test tablet view
- Test desktop view
- Test sidebar collapse/expand
- Test theme toggle
- Test all pages for responsive behavior

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final polish for UI modernization"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Create StatsCard component | components/admin/stats-card.tsx |
| 2 | Create PageHeader component | components/admin/page-header.tsx |
| 3 | Create FilterBar component | components/admin/filter-bar.tsx |
| 4 | Update Admin Sidebar | components/admin/admin-sidebar.tsx |
| 5 | Update Dashboard Layout | app/dashboard/layout.tsx |
| 6 | Update Dashboard Page | app/dashboard/page.tsx |
| 7 | Update Users Page | app/dashboard/users/page.tsx |
| 8 | Update Remaining Pages | All other dashboard pages |
| 9 | Final Testing | N/A |
