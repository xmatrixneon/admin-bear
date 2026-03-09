"use client";

import { motion } from "framer-motion";
import { Wallet, RefreshCw, Loader2, IndianRupee, CreditCard, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { StatsCard } from "@/components/admin/stats-card";
import { PageHeader } from "@/components/admin/page-header";

export default function WalletsPage() {
  // tRPC query for fetching wallets
  const { data: walletsData, isLoading, refetch, isFetching } = trpc.wallets.list.useQuery();
  const { data: stats } = trpc.wallets.getStats.useQuery();

  const wallets = walletsData?.wallets || [];
  const totalBalance = stats?.totalBalance || 0;
  const totalSpent = stats?.totalSpent || 0;
  const totalRecharge = stats?.totalRecharge || 0;
  const totalOtp = stats?.totalOtp || 0;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Wallets"
        description="View all user wallets and balances"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
              <RefreshCw size={16} className="mr-2" />
            )}
            Refresh
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatsCard
          title="Total Balance"
          value={formatCurrency(totalBalance)}
          icon={Wallet}
          color="text-blue-500"
          bgColor="bg-blue-500/5"
          loading={isLoading}
        />
        <StatsCard
          title="Total Recharge"
          value={formatCurrency(totalRecharge)}
          icon={IndianRupee}
          color="text-green-500"
          bgColor="bg-green-500/5"
          loading={isLoading}
        />
        <StatsCard
          title="Total Spent"
          value={formatCurrency(totalSpent)}
          icon={CreditCard}
          color="text-red-500"
          bgColor="bg-red-500/5"
          loading={isLoading}
        />
        <StatsCard
          title="Total OTPs"
          value={totalOtp}
          icon={Hash}
          color="text-purple-500"
          bgColor="bg-purple-500/5"
          loading={isLoading}
        />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : wallets.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <Wallet size={48} className="mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No wallets found</p>
            </CardContent>
          </Card>
        ) : (
          wallets.map((wallet: any, index: number) => (
            <motion.div
              key={wallet.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="text-xs">
                        {wallet.user?.firstName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {wallet.user?.telegramUsername
                          ? `@${wallet.user.telegramUsername}`
                          : wallet.user?.email || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {wallet.user?.telegramId || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Balance</p>
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(wallet.balance)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Recharge</p>
                      <p className="text-green-600 dark:text-green-400">
                        {formatCurrency(wallet.totalRecharge)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Spent</p>
                      <p className="text-red-600 dark:text-red-400">
                        {formatCurrency(wallet.totalSpent)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">OTP</p>
                      <p className="font-medium">{wallet.totalOtp || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 24, delay: 0.1 }}
        className="hidden md:block"
      >
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">User</TableHead>
                  <TableHead>Telegram ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Total Recharge</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Total OTP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : wallets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Wallet size={48} className="text-muted-foreground/40" />
                        <p className="text-muted-foreground">No wallets found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  wallets.map((wallet: any, index: number) => (
                    <motion.tr
                      key={wallet.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.01 }}
                      className="hover:bg-muted/50 transition-colors border-b"
                    >
                      <TableCell>
                        <Avatar size="sm">
                          <AvatarFallback className="text-xs">
                            {wallet.user?.firstName?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground">
                          {wallet.user?.telegramId || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {wallet.user?.telegramUsername ? `@${wallet.user.telegramUsername}` : wallet.user?.email || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(wallet.balance)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-green-600 dark:text-green-400">
                          {formatCurrency(wallet.totalRecharge)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-red-600 dark:text-red-400">
                          {formatCurrency(wallet.totalSpent)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {wallet.totalOtp || 0}
                        </span>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
