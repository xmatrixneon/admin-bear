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
  IndianRupee,
  Phone,
  Star,
  Ban,
  Unlock,
  CreditCard,
  Percent,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { StatsCard } from "@/components/admin/stats-card";
import { PageHeader } from "@/components/admin/page-header";
import { FilterBar } from "@/components/admin/filter-bar";

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
type SortBy = "createdAt" | "telegramId" | "balance" | "totalOtp";

const sortOptions: { value: SortBy; label: string }[] = [
  { value: "createdAt", label: "Joined Date" },
  { value: "telegramId", label: "Telegram ID" },
  { value: "balance", label: "Balance" },
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

  // Default discount dialog
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [discountUser, setDiscountUser] = useState<any>(null);
  const [discountValue, setDiscountValue] = useState("");
  const [discountType, setDiscountType] = useState<"FLAT" | "PERCENT">("PERCENT");

  // tRPC query for users
  const { data, isLoading, refetch } = trpc.users.list.useQuery({
    search: search || undefined,
    filter,
    sortBy,
    sortOrder,
    page,
    pageSize: 20,
  });

  // tRPC mutations
  const deleteUserMutation = trpc.users.delete.useMutation();
  const setAdminMutation = trpc.users.setAdmin.useMutation();
  const adjustBalanceMutation = trpc.users.adjustBalance.useMutation();
  const setStatusMutation = trpc.users.setStatus.useMutation();
  const setDefaultDiscountMutation = trpc.users.setDefaultDiscount.useMutation();
  const removeDefaultDiscountMutation = trpc.users.removeDefaultDiscount.useMutation();

  // Handlers
  const handleSearch = (value: string) => {
    setSearchInputValue(value);
    if (value.length >= 2 || value.length === 0) {
      setSearch(value);
      setPage(1);
    }
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter as FilterTab);
    setPage(1);
  };

  const handleSortChange = (newSortBy: string) => {
    const newSort = newSortBy as SortBy;
    if (sortBy === newSort) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSort);
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

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      await deleteUserMutation.mutateAsync({
        id: userToDelete.id,
        permanent: false,
        reason: deleteReason || "Deleted by admin",
      });
      toast.success("User deleted successfully");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      setDeleteReason("");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    }
  };

  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      await setAdminMutation.mutateAsync({
        id: userId,
        isAdmin: !isAdmin,
      });
      toast.success("User admin status updated");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update admin status");
    }
  };

  const handleBalanceAdjust = async () => {
    if (!selectedUser || !balanceAmount || !balanceReason) return;
    try {
      await adjustBalanceMutation.mutateAsync({
        userId: selectedUser.id,
        amount: parseFloat(balanceAmount),
        reason: balanceReason,
        type: balanceType,
      });
      toast.success("Balance adjusted successfully");
      setBalanceDialogOpen(false);
      setSelectedUser(null);
      setBalanceAmount("");
      setBalanceReason("");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to adjust balance");
    }
  };

  const handleStatusAction = async () => {
    if (!selectedUser || !statusReason) return;
    try {
      await setStatusMutation.mutateAsync({
        id: selectedUser.id,
        status: statusAction === "block" ? "BLOCKED" : "ACTIVE",
      });
      toast.success(`User ${statusAction === "block" ? "blocked" : "unlocked"} successfully`);
      setStatusDialogOpen(false);
      setStatusReason("");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update user status");
    }
  };

  const openDiscountDialog = (user: any) => {
    setDiscountUser(user);
    setDiscountValue(user.defaultDiscount?.toString() || "");
    setDiscountType(user.defaultDiscountType || "PERCENT");
    setDiscountDialogOpen(true);
  };

  const handleSetDefaultDiscount = async () => {
    if (!discountUser || !discountValue) {
      toast.error("Please enter a discount value");
      return;
    }

    try {
      await setDefaultDiscountMutation.mutateAsync({
        userId: discountUser.id,
        discount: parseFloat(discountValue),
        type: discountType,
      });
      toast.success(`Default ${discountType === "FLAT" ? "flat" : "percentage"} discount set successfully`);
      setDiscountDialogOpen(false);
      setDiscountUser(null);
      setDiscountValue("");
      setDiscountType("PERCENT");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to set default discount");
    }
  };

  const handleRemoveDefaultDiscount = async () => {
    if (!discountUser) return;

    try {
      await removeDefaultDiscountMutation.mutateAsync({
        userId: discountUser.id,
      });
      toast.success("Default discount removed successfully");
      setDiscountDialogOpen(false);
      setDiscountUser(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove default discount");
    }
  };

  const totalPages = data?.pagination.totalPages || 1;

  // Calculate stats
  const totalUsers = data?.pagination.total || 0;
  const adminCount = data?.users.filter((u: any) => u.isAdmin).length || 0;
  const avgBalance = data?.users.length
    ? formatCurrency(
        data.users.reduce((sum: number, u: any) => sum + (u.wallet?.balance?.toNumber?.() || 0), 0) /
          data.users.length
      )
    : formatCurrency(0);
  const totalOtps = data?.users.reduce((sum: number, u: any) => sum + (u.wallet?.totalOtp || 0), 0) || 0;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Users"
        description="Manage user accounts and permissions"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            {isLoading ? (
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
          title="Total Users"
          value={totalUsers}
          icon={Users}
          color="text-blue-500"
          bgColor="bg-blue-500/5"
          loading={isLoading}
        />
        <StatsCard
          title="Admins"
          value={adminCount}
          icon={ShieldCheck}
          color="text-purple-500"
          bgColor="bg-purple-500/5"
          loading={isLoading}
        />
        <StatsCard
          title="Avg Balance"
          value={avgBalance}
          icon={IndianRupee}
          color="text-green-500"
          bgColor="bg-green-500/5"
          loading={isLoading}
        />
        <StatsCard
          title="Total OTPs"
          value={totalOtps}
          icon={Phone}
          color="text-amber-500"
          bgColor="bg-amber-500/5"
          loading={isLoading}
        />
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchPlaceholder="Search by ID, username, email..."
        searchValue={searchInputValue}
        onSearchChange={handleSearch}
        filterOptions={filterTabs}
        filterValue={filter}
        onFilterChange={handleFilterChange}
        sortOptions={sortOptions}
        sortValue={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
      />

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
        ) : data?.users.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <Users size={48} className="mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No users found</p>
            </CardContent>
          </Card>
        ) : (
          data?.users.map((user: any, index: number) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar size="lg">
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
                        <AvatarFallback className="text-sm">
                          {getUserInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {getUserDisplayName(user)}
                        </p>
                        {user.telegramUsername && (
                          <a
                            href={`https://t.me/${user.telegramUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline"
                          >
                            @{user.telegramUsername}
                          </a>
                        )}
                      </div>
                    </div>
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
                        <DropdownMenuItem
                          onClick={() => openDiscountDialog(user)}
                          disabled={!!user.deletedAt}
                        >
                          <Percent size={14} className="mr-2" />
                          {user.defaultDiscount ? "Edit Default Discount" : "Set Default Discount"}
                        </DropdownMenuItem>
                        {!user.deletedAt && user.userData?.status !== "BLOCKED" && (
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
                        {user.userData?.status === "BLOCKED" && (
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
                          disabled={!!user.deletedAt || setAdminMutation.isPending}
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
                  </div>

                  <div className="mt-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                      <IndianRupee size={12} />
                      <span className="font-semibold">
                        {formatCurrency(user.wallet?.balance)}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      OTP: {user.wallet?.totalOtp || 0}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {user.isAdmin && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Shield size={10} />
                        Admin
                      </Badge>
                    )}
                    {user.isPremium && (
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Star size={10} />
                        Pro
                      </Badge>
                    )}
                    {user.userData?.status === "BLOCKED" && (
                      <Badge variant="destructive" className="text-xs">Blocked</Badge>
                    )}
                    {user.userData?.status === "SUSPENDED" && (
                      <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs">
                        Suspended
                      </Badge>
                    )}
                    {user.defaultDiscount && (
                      <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600">
                        {user.defaultDiscountType === 'FLAT' ? `₹${user.defaultDiscount} off` : `${user.defaultDiscount}% off`}
                      </Badge>
                    )}
                    {user.deletedAt && (
                      <Badge variant="destructive" className="text-xs">Deleted</Badge>
                    )}
                    {!user.isAdmin && !user.isPremium && !user.deletedAt && !user.userData?.status && !user.defaultDiscount && (
                      <Badge variant="ghost" className="text-xs">Regular</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="pt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(3, totalPages) }).map((_, i) => {
                  let pageNum;
                  if (totalPages <= 3) {
                    pageNum = i + 1;
                  } else if (page <= 2) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 1) {
                    pageNum = totalPages - 2 + i;
                  } else {
                    pageNum = page - 1 + i;
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

      {/* Desktop Table View */}
      <motion.div {...fadeUp(0.15)} className="hidden md:block">
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
                  data?.users.map((user: any, index: number) => (
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
                          {user.userData?.status === "BLOCKED" && (
                            <Badge variant="destructive">Blocked</Badge>
                          )}
                          {user.userData?.status === "SUSPENDED" && (
                            <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                              Suspended
                            </Badge>
                          )}
                          {user.defaultDiscount && (
                            <Badge variant="default" className="bg-green-500 hover:bg-green-600 gap-1">
                              <Percent size={10} />
                              {user.defaultDiscountType === 'FLAT' ? `₹${user.defaultDiscount}` : `${user.defaultDiscount}%`}
                            </Badge>
                          )}
                          {user.deletedAt && (
                            <Badge variant="destructive">Deleted</Badge>
                          )}
                          {!user.isAdmin && !user.isPremium && !user.deletedAt && !user.userData?.status && !user.defaultDiscount && (
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
                            <DropdownMenuItem
                              onClick={() => openDiscountDialog(user)}
                              disabled={!!user.deletedAt}
                            >
                              <Percent size={14} className="mr-2" />
                              {user.defaultDiscount ? "Edit Default Discount" : "Set Default Discount"}
                            </DropdownMenuItem>
                            {!user.deletedAt && user.userData?.status !== "BLOCKED" && (
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
                            {user.userData?.status === "BLOCKED" && (
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
                              disabled={!!user.deletedAt || setAdminMutation.isPending}
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

          {/* Desktop Pagination */}
          {totalPages > 1 && (
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
              disabled={!balanceAmount || !balanceReason || adjustBalanceMutation.isPending}
            >
              {adjustBalanceMutation.isPending ? "Adjusting..." : "Adjust Balance"}
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

      {/* Default Discount Dialog */}
      <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {discountUser?.defaultDiscount ? "Edit Default Discount" : "Set Default Discount"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              This discount will apply to ALL services automatically, including new services added in the future.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {discountUser && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <span className="text-muted-foreground">User: </span>
                <span className="font-medium">{discountUser.telegramUsername || discountUser.firstName || discountUser.email || discountUser.id}</span>
              </div>
            )}

            {/* Discount Type */}
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={discountType === "PERCENT" ? "default" : "outline"}
                  onClick={() => setDiscountType("PERCENT")}
                  className="flex-1"
                >
                  Percent (%)
                </Button>
                <Button
                  type="button"
                  variant={discountType === "FLAT" ? "default" : "outline"}
                  onClick={() => setDiscountType("FLAT")}
                  className="flex-1"
                >
                  Flat (₹)
                </Button>
              </div>
            </div>

            {/* Discount Value */}
            <div className="space-y-2">
              <Label>
                Discount Value ({discountType === "PERCENT" ? "%" : "₹"})
              </Label>
              <Input
                type="number"
                placeholder={discountType === "PERCENT" ? "10" : "5"}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                min="0"
                max={discountType === "PERCENT" ? 100 : undefined}
                step="0.01"
              />
            </div>

            {/* Info Box */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-600 dark:text-blue-400">
              <p><strong>Note:</strong> Service-specific custom prices will override this default discount.</p>
            </div>
          </div>
          <DialogFooter>
            <div className="flex gap-2 w-full">
              {discountUser?.defaultDiscount && (
                <Button
                  variant="outline"
                  onClick={handleRemoveDefaultDiscount}
                  disabled={removeDefaultDiscountMutation.isPending}
                  className="flex-1"
                >
                  {removeDefaultDiscountMutation.isPending ? "Removing..." : "Remove"}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setDiscountDialogOpen(false);
                  setDiscountUser(null);
                  setDiscountValue("");
                }}
                className={!discountUser?.defaultDiscount ? "flex-1" : ""}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSetDefaultDiscount}
                disabled={!discountValue || setDefaultDiscountMutation.isPending}
                className="flex-1"
              >
                {setDefaultDiscountMutation.isPending ? "Setting..." : "Set Discount"}
              </Button>
            </div>
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
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
