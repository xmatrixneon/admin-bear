"use client";

import { motion } from "framer-motion";
import { Wallet, RefreshCw, Loader2 } from "lucide-react";
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
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 280, damping: 24, delay },
});

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
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp()} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Wallets</h1>
          <p className="text-sm text-muted-foreground">
            View all user wallets and balances
          </p>
        </div>
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
      </motion.div>

      {/* Stats */}
      <motion.div {...fadeUp(0.05)} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <Wallet size={18} className="text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Total Balance</p>
              <p className="text-xl font-bold">{formatCurrency(totalBalance)}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/10 p-2 rounded-lg">
              <Wallet size={18} className="text-green-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Total Recharge</p>
              <p className="text-xl font-bold">{formatCurrency(totalRecharge)}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-500/10 p-2 rounded-lg">
              <Wallet size={18} className="text-red-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Total Spent</p>
              <p className="text-xl font-bold">{formatCurrency(totalSpent)}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/10 p-2 rounded-lg">
              <Wallet size={18} className="text-purple-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Total OTPs</p>
              <p className="text-xl font-bold">{totalOtp}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Wallets Table */}
      <motion.div {...fadeUp(0.1)}>
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
