"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  RefreshCw,
  Loader2,
  Shield,
  Activity,
  UserCheck,
  Clock,
} from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/admin/page-header";
import { StatsCard } from "@/components/admin/stats-card";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 280, damping: 24, delay },
});

const actionColors: Record<string, string> = {
  DELETE: "text-red-500",
  UPDATE: "text-blue-500",
  BALANCE_ADJUST: "text-green-500",
  SET_ADMIN: "text-purple-500",
  BLOCK: "text-red-500",
  UNBLOCK: "text-green-500",
};

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  // tRPC query for audit logs
  const { data, isLoading, refetch, isFetching } = trpc.auditLogs.list.useQuery({
    action: actionFilter === "ALL" ? undefined : (actionFilter as any) || undefined,
    page,
    pageSize: 25,
  });

  const totalPages = data?.pagination?.totalPages || 1;
  const totalLogs = data?.pagination?.total || 0;

  // Calculate action counts from logs
  const actionCounts = data?.logs?.reduce((acc: Record<string, number>, log: any) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <PageHeader
        title="Audit Logs"
        description="Track all admin actions on platform"
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
          title="Total Logs"
          value={totalLogs}
          icon={FileText}
          color="text-blue-500"
          bgColor="bg-blue-500/5"
          loading={isLoading}
        />
        <StatsCard
          title="Updates"
          value={actionCounts.UPDATE || 0}
          icon={Activity}
          color="text-cyan-500"
          bgColor="bg-cyan-500/5"
          loading={isLoading}
        />
        <StatsCard
          title="Balance Adjust"
          value={actionCounts.BALANCE_ADJUST || 0}
          icon={UserCheck}
          color="text-green-500"
          bgColor="bg-green-500/5"
          loading={isLoading}
        />
        <StatsCard
          title="Deletes"
          value={actionCounts.DELETE || 0}
          icon={Shield}
          color="text-red-500"
          bgColor="bg-red-500/5"
          loading={isLoading}
        />
      </div>

      {/* Filters */}
      <motion.div {...fadeUp(0.05)} className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <Label>Search</Label>
            <Input
              placeholder="Search by admin name, action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="min-w-[180px]">
            <Label>Action Type</Label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All actions</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="BALANCE_ADJUST">Balance Adjust</SelectItem>
                <SelectItem value="SET_ADMIN">Set Admin</SelectItem>
                <SelectItem value="BLOCK">Block</SelectItem>
                <SelectItem value="UNBLOCK">Unblock</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
        ) : data?.logs?.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <FileText size={48} className="mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No audit logs found</p>
            </CardContent>
          </Card>
        ) : (
          data?.logs?.map((log: any, index: number) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="text-xs bg-blue-500/10 text-blue-500">
                          {log.admin?.firstName?.[0] || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {log.admin?.firstName || "Admin"} {log.admin?.lastName || ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.admin?.telegramUsername ? `@${log.admin.telegramUsername}` : "Administrator"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {log.action}
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Target User</p>
                      <p className="text-sm">
                        {log.user?.firstName || "User"} {log.user?.lastName || ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className="text-sm">{formatDateTime(log.createdAt)}</p>
                    </div>
                  </div>

                  {log.reason && (
                    <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                      {log.reason}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <motion.div {...fadeUp(0.1)} className="hidden md:block">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Admin</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    </TableRow>
                  ))
                ) : data?.logs?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <FileText size={48} className="text-muted-foreground/40" />
                        <p className="text-muted-foreground">No audit logs found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.logs?.map((log: any, index: number) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.01 }}
                      className="hover:bg-muted/50 transition-colors border-b"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar>
                            <AvatarFallback className="text-xs bg-blue-500/10 text-blue-500">
                              {log.admin?.firstName?.[0] || "A"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {log.admin?.firstName || "Admin"} {log.admin?.lastName || ""}
                            </span>
                            {log.admin?.telegramUsername && (
                              <span className="text-xs text-muted-foreground">@{log.admin.telegramUsername}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar>
                            <AvatarFallback className="text-xs">
                              {log.user?.firstName?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {log.user?.firstName || "User"} {log.user?.lastName || ""}
                            </span>
                            {log.user?.telegramUsername && (
                              <span className="text-xs text-muted-foreground">@{log.user.telegramUsername}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Shield size={14} className={actionColors[log.action] || "text-muted-foreground"} />
                          <Badge variant="outline" className="font-mono text-xs">
                            {log.action}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                          {log.reason || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDateTime(log.createdAt)}
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
