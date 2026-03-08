"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDateTime } from "@/lib/utils";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 280, damping: 24, delay },
});

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
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp()} className="flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            View all transactions
          </p>
        </div>

        <Button variant="outline" onClick={() => refetch()}>
          {isFetching ? (
            <Loader2 size={16} className="animate-spin mr-2" />
          ) : (
            <RefreshCw size={16} className="mr-2" />
          )}
          Refresh
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div {...fadeUp(0.05)} className="grid grid-cols-4 gap-3">
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-xl font-bold">{stats?.total || 0}</p>
        </div>

        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Deposits</p>
          <p className="text-xl font-bold">{stats?.byType?.DEPOSIT?.count || 0}</p>
        </div>

        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Purchases</p>
          <p className="text-xl font-bold">{stats?.byType?.PURCHASE?.count || 0}</p>
        </div>

        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Total Amount</p>
          <p className="text-xl font-bold">
            {formatCurrency(totalAmount)}
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div {...fadeUp(0.1)} className="bg-card border rounded-xl p-4">
        <div className="flex gap-3 flex-wrap">

          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

      {/* Table */}
      <motion.div {...fadeUp(0.15)} className="bg-card border rounded-xl">
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
            ) : (
              transactionsData?.transactions?.map((txn: any) => (
                <TableRow key={txn.id}>
                  <TableCell>
                    <Avatar>
                      <AvatarFallback>
                        {txn.wallet?.user?.firstName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>

                  <TableCell>{txn.type}</TableCell>

                  <TableCell>
                    {formatCurrency(txn.amount)}
                  </TableCell>

                  <TableCell>
                    {getStatusBadge(txn.status)}
                  </TableCell>

                  <TableCell>
                    {formatDateTime(txn.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
}
