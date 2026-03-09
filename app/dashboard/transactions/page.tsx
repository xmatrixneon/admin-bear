"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, RefreshCw, Loader2, ArrowDownCircle, ArrowUpCircle, Hash, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { StatsCard } from "@/components/admin/stats-card";
import { PageHeader } from "@/components/admin/page-header";

const transactionTypes = [
  { value: "DEPOSIT", label: "Deposit" },
  { value: "PURCHASE", label: "Purchase" },
  { value: "REFUND", label: "Refund" },
  { value: "PROMO", label: "Promo" },
  { value: "REFERRAL", label: "Referral" },
  { value: "ADJUSTMENT", label: "Adjustment" },
] as const;

const transactionStatuses = [
  { value: "COMPLETED", label: "Completed" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
] as const;

function getStatusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return <Badge variant="default">Completed</Badge>;
    case "PENDING":
      return (
        <Badge variant="outline" className="border-amber-500 text-amber-600">
          Pending
        </Badge>
      );
    case "FAILED":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case "DEPOSIT":
      return <ArrowDownCircle size={14} className="text-green-500" />;
    case "PURCHASE":
      return <ArrowUpCircle size={14} className="text-red-500" />;
    case "REFUND":
      return <ArrowDownCircle size={14} className="text-blue-500" />;
    case "PROMO":
      return <ArrowDownCircle size={14} className="text-purple-500" />;
    case "REFERRAL":
      return <ArrowDownCircle size={14} className="text-amber-500" />;
    case "ADJUSTMENT":
      return <ArrowUpCircle size={14} className="text-gray-500" />;
    default:
      return <CreditCard size={14} />;
  }
}

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);

  // tRPC queries
  const { data: transactionsData, isLoading, refetch, isFetching } = trpc.transactions.list.useQuery({
    search: search || undefined,
    type: type as any || undefined,
    status: status as any || undefined,
    page,
    pageSize: 25,
  });

  const { data: stats } = trpc.transactions.getStats.useQuery();

  // Calculate total amount from byType
  const totalAmount = stats?.byType ? Object.values(stats.byType).reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0) : 0;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Transactions"
        description="View all transactions"
        actions={
          <Button variant="outline" onClick={() => refetch()}>
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
          title="Total"
          value={stats?.total || 0}
          icon={Hash}
          color="text-blue-500"
          bgColor="bg-blue-500/5"
          loading={isLoading}
        />
        <StatsCard
          title="Deposits"
          value={stats?.byType?.DEPOSIT?.count || 0}
          icon={ArrowDownCircle}
          color="text-green-500"
          bgColor="bg-green-500/5"
          loading={isLoading}
        />
        <StatsCard
          title="Purchases"
          value={stats?.byType?.PURCHASE?.count || 0}
          icon={ArrowUpCircle}
          color="text-red-500"
          bgColor="bg-red-500/5"
          loading={isLoading}
        />
        <StatsCard
          title="Total Amount"
          value={formatCurrency(totalAmount)}
          icon={IndianRupee}
          color="text-purple-500"
          bgColor="bg-purple-500/5"
          loading={isLoading}
        />
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 24, delay: 0.1 }}
        className="bg-card border rounded-xl p-4"
      >
        <div className="flex gap-3 flex-wrap">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px]"
          />

          {/* TYPE FILTER */}
          <Select
            value={type || "ALL"}
            onValueChange={(v) => setType(v === "ALL" ? "" : v)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>

              {transactionTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* STATUS FILTER */}
          <Select
            value={status || "ALL"}
            onValueChange={(v) => setStatus(v === "ALL" ? "" : v)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All status</SelectItem>

              {transactionStatuses.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

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
                <div className="mt-3 flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : transactionsData?.transactions?.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <CreditCard size={48} className="mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No transactions found</p>
            </CardContent>
          </Card>
        ) : (
          transactionsData?.transactions?.map((txn: any, index: number) => (
            <motion.div
              key={txn.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="text-xs">
                          {txn.wallet?.user?.firstName?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(txn.type)}
                          <span className="font-medium text-sm">{txn.type}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {txn.wallet?.user?.telegramUsername
                            ? `@${txn.wallet.user.telegramUsername}`
                            : txn.wallet?.user?.email || "Unknown"}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(txn.status)}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="font-semibold">
                        {formatCurrency(txn.amount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="text-sm">{formatDateTime(txn.createdAt)}</p>
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
        transition={{ type: "spring", stiffness: 280, damping: 24, delay: 0.15 }}
        className="hidden md:block"
      >
        <div className="bg-card border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : transactionsData?.transactions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <CreditCard size={48} className="text-muted-foreground/40" />
                        <p className="text-muted-foreground">No transactions found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactionsData?.transactions?.map((txn: any) => (
                    <TableRow key={txn.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar>
                            <AvatarFallback>
                              {txn.wallet?.user?.firstName?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            {txn.wallet?.user?.telegramUsername
                              ? `@${txn.wallet.user.telegramUsername}`
                              : txn.wallet?.user?.email || "Unknown"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(txn.type)}
                          <span>{txn.type}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="font-semibold">
                          {formatCurrency(txn.amount)}
                        </span>
                      </TableCell>

                      <TableCell>
                        {getStatusBadge(txn.status)}
                      </TableCell>

                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDateTime(txn.createdAt)}
                        </span>
                      </TableCell>
                    </TableRow>
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
