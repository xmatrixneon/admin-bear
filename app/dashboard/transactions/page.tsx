"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, RefreshCw, Loader2, ArrowDownCircle, Hash, IndianRupee, Gift, User, Smartphone, Receipt } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { StatsCard } from "@/components/admin/stats-card";
import { PageHeader } from "@/components/admin/page-header";

const transactionTypes = [
  { value: "DEPOSIT", label: "Deposit" },
  { value: "PROMO", label: "Promo" },
] as const;

function getStatusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Completed</Badge>;
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

function getTypeBadge(type: string) {
  switch (type) {
    case "DEPOSIT":
      return (
        <Badge variant="outline" className="border-green-500 text-green-600 gap-1">
          <ArrowDownCircle size={12} />
          Deposit
        </Badge>
      );
    case "PROMO":
      return (
        <Badge variant="outline" className="border-purple-500 text-purple-600 gap-1">
          <Gift size={12} />
          Promo
        </Badge>
      );
    default:
      return <Badge variant="secondary">{type}</Badge>;
  }
}

// Extract metadata info
function getMetadataInfo(metadata: any) {
  if (!metadata) return { payerName: null, payerVpa: null, utr: null };
  return {
    payerName: metadata.payerName || null,
    payerVpa: metadata.payerVpa || null,
    utr: metadata.utr || null,
  };
}

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("");
  const [page, setPage] = useState(1);

  // tRPC queries - by default shows only DEPOSIT and PROMO
  const { data: transactionsData, isLoading, refetch, isFetching } = trpc.transactions.list.useQuery({
    search: search || undefined,
    type: type as any || undefined,
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
        description="View all recharge transactions (Deposits & Promo)"
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
          title="Promo"
          value={stats?.byType?.PROMO?.count || 0}
          icon={Gift}
          color="text-purple-500"
          bgColor="bg-purple-500/5"
          loading={isLoading}
        />
        <StatsCard
          title="Total Amount"
          value={formatCurrency(totalAmount)}
          icon={IndianRupee}
          color="text-amber-500"
          bgColor="bg-amber-500/5"
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
            placeholder="Search by Telegram ID or UTR..."
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
        </div>
      </motion.div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-32" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                  </div>
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
          transactionsData?.transactions?.map((txn: any, index: number) => {
            const { payerName, payerVpa, utr } = getMetadataInfo(txn.metadata);
            const telegramId = txn.wallet?.user?.telegramId || "-";

            return (
              <motion.div
                key={txn.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      {getTypeBadge(txn.type)}
                      {getStatusBadge(txn.status)}
                    </div>

                    <div className="space-y-2">
                      {/* Amount */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Amount</span>
                        <span className="text-lg font-bold text-green-600">
                          +{formatCurrency(txn.amount)}
                        </span>
                      </div>

                      {/* Payer Name (for deposits) */}
                      {payerName && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <User size={12} /> Payer
                          </span>
                          <span className="text-sm font-medium">{payerName}</span>
                        </div>
                      )}

                      {/* Payment Method */}
                      {payerVpa && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Smartphone size={12} /> Method
                          </span>
                          <Badge variant="secondary" className="text-xs">{payerVpa}</Badge>
                        </div>
                      )}

                      {/* UTR */}
                      {utr && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Receipt size={12} /> UTR
                          </span>
                          <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{utr}</span>
                        </div>
                      )}

                      {/* Telegram ID */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm text-muted-foreground">Telegram ID</span>
                        <code className="text-sm font-mono bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded">
                          {telegramId}
                        </code>
                      </div>

                      {/* Date */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Date</span>
                        <span className="text-xs text-muted-foreground">{formatDateTime(txn.createdAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
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
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payer Name</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>UTR</TableHead>
                  <TableHead>Telegram ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : transactionsData?.transactions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <CreditCard size={48} className="text-muted-foreground/40" />
                        <p className="text-muted-foreground">No transactions found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactionsData?.transactions?.map((txn: any) => {
                    const { payerName, payerVpa, utr } = getMetadataInfo(txn.metadata);
                    const telegramId = txn.wallet?.user?.telegramId || "-";

                    return (
                      <TableRow key={txn.id}>
                        <TableCell>
                          {getTypeBadge(txn.type)}
                        </TableCell>

                        <TableCell>
                          <span className="font-semibold text-green-600">
                            +{formatCurrency(txn.amount)}
                          </span>
                        </TableCell>

                        <TableCell>
                          {payerName ? (
                            <span className="font-medium">{payerName}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        <TableCell>
                          {payerVpa ? (
                            <Badge variant="secondary" className="text-xs">{payerVpa}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        <TableCell>
                          {utr ? (
                            <code className="text-xs bg-muted px-2 py-0.5 rounded">{utr}</code>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <code className="text-sm font-mono bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded">
                            {telegramId}
                          </code>
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
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
