"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  User,
  Search,
  Shield,
  ShieldCheck,
  MoreVertical,
  Trash2,
  UserPlus,
  UserMinus,
  Loader2,
  RefreshCw,
  Filter,
  ArrowUpDown,
  IndianRupee,
  Calendar,
  Phone,
  Mail,
  Star,
  Ban,
  Unlock,
  CreditCard,
  Eye,
} from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarBadge,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/utils";

// Animation helper
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 280, damping: 24, delay },
});

// Filter tabs
type FilterTab = "all" | "admin" | "regular" | "deleted";

const filterTabs: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "admin", label: "Admins" },
  { value: "regular", label: "Regular" },
  { value: "deleted", label: "Deleted" },
];

// Sort options
type SortBy = "createdAt" | "balance" | "totalSpent" | "totalOtp";

const sortOptions: { value: SortBy; label: string }[] = [
  { value: "createdAt", label: "Joined Date" },
  { value: "balance", label: "Balance" },
  { value: "totalSpent", label: "Total Spent" },
  { value: "totalOtp", label: "OTP Sold" },
];

// Get user initials
function getUserInitials(user: { firstName?: string | null; lastName?: string | null; telegramUsername?: string | null }): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  if (user.firstName) {
    return user.firstName[0].toUpperCase();
  }
  if (user.telegramUsername) {
    return user.telegramUsername.slice(0, 2).toUpperCase();
  }
  return "U";
}

function getUserDisplayName(user: { firstName?: string | null; lastName?: string | null; telegramUsername?: string | null }): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) {
    return user.firstName;
  }
  return user.telegramUsername || "Unknown";
}

export default function UsersListPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");

  // Balance adjustment dialog
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceType, setBalanceType] = useState<"credit" | "debit">("credit");
  const [balanceReason, setBalanceReason] = useState("");

  // Status dialog
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<"block" | "unlock">("block");
  const [statusReason, setStatusReason] = useState("");

  // Queries
  const { data, isLoading, refetch, isFetching } = trpc.admin.user.list.useQuery(
    {
      search: search || undefined,
      filter,
      sortBy,
      sortOrder,
      page,
      pageSize: 20,
    }
  );

  // Mutations
  const deleteMutation = trpc.admin.user.delete.useMutation({
    onSuccess: () => {
      toast.success("User deleted successfully");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      setDeleteReason("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete user");
    },
  });

  const setAdminMutation = trpc.admin.user.setAdmin.useMutation({
    onSuccess: () => {
      toast.success("User admin status updated");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update admin status");
    },
  });

  const balanceAdjustMutation = trpc.admin.user.balanceAdjust.useMutation({
    onSuccess: () => {
      toast.success("Balance adjusted successfully");
      setBalanceDialogOpen(false);
      setSelectedUser(null);
      setBalanceAmount("");
      setBalanceReason("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to adjust balance");
    },
  });

  const setStatusMutation = trpc.admin.user.setUserStatus.useMutation({
    onSuccess: () => {
      toast.success(`User ${statusAction === "block" ? "blocked" : "unlocked"} successfully`);
      setStatusDialogOpen(false);
      setStatusReason("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update user status");
    },
  });

  // Handlers
  const handleSearch = (value: string) => {
    setSearchInputValue(value);
    if (value.length >= 2 || value.length === 0) {
      setSearch(value);
      setPage(1);
    }
  };

  const handleFilterChange = (newFilter: FilterTab) => {
    setFilter(newFilter);
    setPage(1);
  };

  const handleSortChange = (newSortBy: SortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const handleDeleteClick = (user: { id: string; firstName?: string | null; lastName?: string | null; telegramUsername?: string | null }) => {
    setUserToDelete({
      id: user.id,
      name: getUserDisplayName(user),
    });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!userToDelete) return;
    deleteMutation.mutate({
      id: userToDelete.id,
      permanent: false,
      reason: deleteReason || "Deleted by admin",
    });
  };

  const handleToggleAdmin = (userId: string, currentIsAdmin: boolean) => {
    setAdminMutation.mutate({
      userId,
      isAdmin: !currentIsAdmin,
    });
  };

  const handleBalanceAdjust = () => {
    if (!selectedUser || !balanceAmount || !balanceReason) return;
    balanceAdjustMutation.mutate({
      userId: selectedUser.id,
      amount: parseFloat(balanceAmount),
      reason: balanceReason,
      type: balanceType,
    });
  };

  const handleStatusAction = () => {
    if (!selectedUser || !statusReason) return;
    setStatusMutation.mutate({
      userId: selectedUser.id,
      status: statusAction === "block" ? "BANNED" : "ACTIVE",
    });
  };

  const totalPages = data?.pagination.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp()} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div {...fadeUp(0.05)} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <Users size={18} className="text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Total Users</p>
              <p className="text-xl font-bold text-foreground">{data?.pagination.total || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/10 p-2 rounded-lg">
              <ShieldCheck size={18} className="text-purple-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Admins</p>
              <p className="text-xl font-bold text-foreground">
                {data?.users.filter((u) => u.isAdmin).length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/10 p-2 rounded-lg">
              <IndianRupee size={18} className="text-green-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Avg Balance</p>
              <p className="text-xl font-bold text-foreground">
                {data?.users.length
                  ? formatCurrency(
                      data.users.reduce((sum, u) => sum + (u.wallet?.balance?.toNumber() || 0), 0) /
                        data.users.length
                    )
                  : formatCurrency(0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 p-2 rounded-lg">
              <Phone size={18} className="text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Total OTPs</p>
              <p className="text-xl font-bold text-foreground">
                {data?.users.reduce((sum, u) => sum + (u.wallet?.totalOtp || 0), 0) || 0}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div {...fadeUp(0.1)} className="bg-card border border-border rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by ID, username, email..."
              value={searchInputValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 rounded-lg"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter size={14} />
                <span className="hidden sm:inline">{filterTabs.find((t) => t.value === filter)?.label}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {filterTabs.map((tab) => (
                <DropdownMenuItem
                  key={tab.value}
                  onClick={() => handleFilterChange(tab.value)}
                  className={filter === tab.value ? "bg-accent" : ""}
                >
                  {tab.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowUpDown size={14} />
                <span className="hidden sm:inline">{sortOptions.find((s) => s.value === sortBy)?.label}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                >
                  <span className="flex-1">{option.label}</span>
                  {sortBy === option.value && (
                    <span className="text-muted-foreground text-xs">
                      {sortOrder === "asc" ? "ASC" : "DESC"}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div {...fadeUp(0.15)}>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">User</TableHead>
                  <TableHead className="w-[140px]">Telegram ID</TableHead>
                  <TableHead className="w-[120px]">Username</TableHead>
                  <TableHead className="w-[120px]">Email</TableHead>
                  <TableHead className="w-[100px]">Balance</TableHead>
                  <TableHead className="w-[80px]">OTP Sold</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[60px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : data?.users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Users size={48} className="text-muted-foreground/40" />
                        <p className="text-muted-foreground">No users found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.users.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + index * 0.02 }}
                      className="hover:bg-muted/50 transition-colors border-b"
                    >
                      <TableCell>
                        <Avatar size="sm">
                          {user.isPremium && (
                            <AvatarBadge>
                              <Star size={8} fill="currentColor" />
                            </AvatarBadge>
                          )}
                          {user.telegramUsername && (
                            <AvatarImage
                              src={`https://t.me/i/userpic/320/${user.telegramUsername}.jpg`}
                              alt={getUserDisplayName(user)}
                            />
                          )}
                          <AvatarFallback className="text-xs">
                            {getUserInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Phone size={12} className="text-muted-foreground" />
                          <span className="font-mono text-xs">{user.telegramId || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {user.telegramUsername && (
                            <a
                              href={`https://t.me/${user.telegramUsername}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline text-sm"
                            >
                              @{user.telegramUsername}
                            </a>
                          )}
                          {!user.telegramUsername && <span className="text-muted-foreground text-sm">-</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm truncate max-w-[120px] block">
                          {user.email || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                          <IndianRupee size={12} />
                          <span className="font-semibold text-sm">
                            {formatCurrency(user.wallet?.balance)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {user.wallet?.totalOtp || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1.5">
                          {user.isAdmin && (
                            <Badge variant="secondary" className="gap-1">
                              <Shield size={10} />
                              Admin
                            </Badge>
                          )}
                          {user.isPremium && (
                            <Badge variant="outline" className="gap-1">
                              <Star size={10} />
                              Pro
                            </Badge>
                          )}
                          {user.userData?.status === "BANNED" && (
                            <Badge variant="destructive">Blocked</Badge>
                          )}
                          {user.userData?.status === "SUSPENDED" && (
                            <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                              Suspended
                            </Badge>
                          )}
                          {user.deletedAt && (
                            <Badge variant="destructive">Deleted</Badge>
                          )}
                          {!user.isAdmin && !user.isPremium && !user.deletedAt && !user.userData?.status && (
                            <Badge variant="ghost">Regular</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical size={14} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>
                              {getUserDisplayName(user)}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser({ id: user.id, name: getUserDisplayName(user) });
                                setBalanceDialogOpen(true);
                              }}
                              disabled={!!user.deletedAt}
                            >
                              <CreditCard size={14} className="mr-2" />
                              Adjust Balance
                            </DropdownMenuItem>
                            {!user.deletedAt && user.userData?.status !== "BANNED" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser({ id: user.id, name: getUserDisplayName(user) });
                                  setStatusAction("block");
                                  setStatusDialogOpen(true);
                                }}
                              >
                                <Ban size={14} className="mr-2 text-destructive" />
                                Block User
                              </DropdownMenuItem>
                            )}
                            {user.userData?.status === "BANNED" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser({ id: user.id, name: getUserDisplayName(user) });
                                  setStatusAction("unlock");
                                  setStatusDialogOpen(true);
                                }}
                              >
                                <Unlock size={14} className="mr-2 text-green-500" />
                                Unlock User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                              disabled={!!user.deletedAt}
                            >
                              {user.isAdmin ? (
                                <>
                                  <UserMinus size={14} className="mr-2" />
                                  Remove Admin
                                </>
                              ) : (
                                <>
                                  <UserPlus size={14} className="mr-2" />
                                  Make Admin
                                </>
                              )}
                            </DropdownMenuItem>
                            {!user.deletedAt && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleDeleteClick(user)}
                                  disabled={user.isAdmin}
                                >
                                  <Trash2 size={14} className="mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="border-t border-border p-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setPage(pageNum)}
                          isActive={page === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </motion.div>

      {/* Balance Adjustment Dialog */}
      <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Balance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Adjusting balance for <strong>{selectedUser?.name}</strong>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={balanceType === "credit" ? "default" : "outline"}
                  onClick={() => setBalanceType("credit")}
                  className="flex-1"
                >
                  Credit (+)
                </Button>
                <Button
                  type="button"
                  variant={balanceType === "debit" ? "default" : "outline"}
                  onClick={() => setBalanceType("debit")}
                  className="flex-1"
                >
                  Debit (-)
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                placeholder="Reason for balance adjustment..."
                value={balanceReason}
                onChange={(e) => setBalanceReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBalanceDialogOpen(false);
                setBalanceAmount("");
                setBalanceReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBalanceAdjust}
              disabled={!balanceAmount || !balanceReason || balanceAdjustMutation.isPending}
            >
              {balanceAdjustMutation.isPending ? "Processing..." : "Adjust Balance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Action Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {statusAction === "block" ? "Block User" : "Unlock User"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {statusAction === "block" ? (
                <>
                  Are you sure you want to block <strong>{selectedUser?.name}</strong>?
                </>
              ) : (
                <>
                  Are you sure you want to unlock <strong>{selectedUser?.name}</strong>?
                </>
              )}
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                placeholder="Reason for this action..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setStatusDialogOpen(false);
                setStatusReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant={statusAction === "block" ? "destructive" : "default"}
              onClick={handleStatusAction}
              disabled={!statusReason || setStatusMutation.isPending}
            >
              {setStatusMutation.isPending ? "Processing..." : statusAction === "block" ? "Block User" : "Unlock User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{userToDelete?.name}</strong>?
              This action can be undone by restoring the user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <label className="text-sm font-medium">Reason (optional)</label>
            <Input
              placeholder="Reason for deletion..."
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
