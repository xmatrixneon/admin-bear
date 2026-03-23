"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Percent,
  Plus,
  Loader2,
  MoreVertical,
  Trash2,
  Edit,
  Search,
  RefreshCw,
  User,
  Sparkles,
  IndianRupee,
  Tag,
  Globe,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { StatsCard } from "@/components/admin/stats-card";
import { PageHeader } from "@/components/admin/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 280, damping: 24, delay },
});

// User display helpers
function getUserDisplayName(user: { firstName?: string | null; lastName?: string | null; telegramUsername?: string | null }): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) {
    return user.firstName;
  }
  return user.telegramUsername || "Unknown";
}

export default function CustomPricesPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    userId: "",
    serviceId: "",
    discount: "",
    type: "PERCENT" as "FLAT" | "PERCENT",
  });

  // User search state
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // tRPC queries
  const { data: customPrices, isLoading, refetch, isFetching } = trpc.customPrices.list.useQuery();
  const { data: services } = trpc.customPrices.listServices.useQuery();
  const { data: userSearchResults } = trpc.customPrices.searchUsers.useQuery(
    { query: userSearchQuery },
    { enabled: userSearchQuery.length >= 2 }
  );

  // Query users with global default discounts
  const { data: usersWithGlobalDiscounts } = trpc.users.list.useQuery(
    {},
    {
      select: {
        data: {
          id: true,
          telegramUsername: true,
          firstName: true,
          lastName: true,
          defaultDiscount: true,
          defaultDiscountType: true,
        },
      },
    }
  );

  // tRPC mutations
  const createMutation = trpc.customPrices.create.useMutation();
  const createBulkMutation = trpc.customPrices.createBulk.useMutation();
  const updateMutation = trpc.customPrices.update.useMutation();
  const deleteMutation = trpc.customPrices.delete.useMutation();

  // Filter custom prices by search
  const filteredPrices = useMemo(() => {
    if (!customPrices || !searchQuery) return customPrices;
    const query = searchQuery.toLowerCase();
    return customPrices.filter((cp: any) =>
      cp.user?.firstName?.toLowerCase().includes(query) ||
      cp.user?.lastName?.toLowerCase().includes(query) ||
      cp.user?.telegramUsername?.toLowerCase().includes(query) ||
      cp.service?.name?.toLowerCase().includes(query)
    );
  }, [customPrices, searchQuery]);

  const handleCreate = async () => {
    if (!formData.userId || !formData.discount) {
      toast.error("Please select a user and enter discount value");
      return;
    }

    if (formData.serviceId !== "all" && !formData.serviceId) {
      toast.error("Please select a service");
      return;
    }

    try {
      if (formData.serviceId === "all") {
        // Bulk create using new global discount method
        const result = await createBulkMutation.mutateAsync({
          userId: formData.userId,
          discount: parseFloat(formData.discount),
          type: formData.type,
        });

        // Show result for new global method
        const parts = [`Global discount set: ${result.type === "PERCENT" ? `${result.discount}%` : `₹${result.discount}`}`];
        if (result.oldCustomPricesRemoved > 0) {
          parts.push(`Removed ${result.oldCustomPricesRemoved} old entries`);
        }
        parts.push(`Applies to all ${result.totalServices} services`);

        toast.success(parts.join(" | "));
      } else {
        // Single service create
        await createMutation.mutateAsync({
          userId: formData.userId,
          serviceId: formData.serviceId,
          discount: parseFloat(formData.discount),
          type: formData.type,
        });
        toast.success("Custom price created successfully");
      }
      setCreateDialogOpen(false);
      resetForm();
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to create custom price");
    }
  };

  const handleUpdate = async () => {
    if (!selectedPrice || !formData.discount) {
      toast.error("Please provide a discount value");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: selectedPrice.id,
        discount: parseFloat(formData.discount),
        type: formData.type,
      });
      toast.success("Custom price updated successfully");
      setEditDialogOpen(false);
      setSelectedPrice(null);
      resetForm();
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update custom price");
    }
  };

  const handleDelete = async () => {
    if (!selectedPrice) return;
    try {
      await deleteMutation.mutateAsync({ id: selectedPrice.id });
      toast.success("Custom price deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedPrice(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete custom price");
    }
  };

  const resetForm = () => {
    setFormData({ userId: "", serviceId: "", discount: "", type: "PERCENT" });
    setSelectedUser(null);
    setUserSearchQuery("");
  };

  const openEditDialog = (price: any) => {
    setSelectedPrice(price);
    setFormData({
      userId: price.userId,
      serviceId: price.serviceId,
      discount: price.discount.toString(),
      type: price.type,
    });
    setSelectedUser(price.user);
    setEditDialogOpen(true);
  };

  // Calculate stats
  const totalDiscounts = customPrices?.length || 0;
  const flatDiscounts = customPrices?.filter((cp: any) => cp.type === "FLAT").length || 0;
  const percentDiscounts = customPrices?.filter((cp: any) => cp.type === "PERCENT").length || 0;

  // Calculate final price helper
  const getFinalPrice = (basePrice: number, discount: number, type: string) => {
    if (type === "FLAT") {
      return Math.max(0, basePrice - discount);
    }
    return Math.max(0, basePrice - (basePrice * discount / 100));
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <PageHeader
        title="Custom Prices"
        description="Manage per-user service discounts"
        actions={
          <>
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
            <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
              <Plus size={16} className="mr-2" />
              Add Discount
            </Button>
          </>
        }
      />

      {/* Stats */}
      <motion.div
        {...fadeUp(0.05)}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <StatsCard
          title="Total Discounts"
          value={totalDiscounts}
          icon={Percent}
          color="text-blue-500"
          bgColor="bg-blue-500/5"
          loading={isLoading}
        />
        <StatsCard
          title="Flat Discounts"
          value={flatDiscounts}
          icon={IndianRupee}
          color="text-green-500"
          bgColor="bg-green-500/5"
          loading={isLoading}
        />
        <StatsCard
          title="Percent Discounts"
          value={percentDiscounts}
          icon={Percent}
          color="text-purple-500"
          bgColor="bg-purple-500/5"
          loading={isLoading}
        />
        <StatsCard
          title="Services"
          value={services?.length || 0}
          icon={Sparkles}
          color="text-amber-500"
          bgColor="bg-amber-500/5"
          loading={isLoading}
        />
      </motion.div>

      {/* Search Bar */}
      <motion.div {...fadeUp(0.1)} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by user or service name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </motion.div>

      {/* Global Default Discounts Section */}
      {usersWithGlobalDiscounts && usersWithGlobalDiscounts.data.filter((u: any) => u.defaultDiscount).length > 0 && (
        <motion.div {...fadeUp(0.12)} className="space-y-3">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-primary" />
            <h3 className="font-semibold">Global Default Discounts</h3>
            <Badge variant="secondary" className="text-xs">
              {usersWithGlobalDiscounts.data.filter((u: any) => u.defaultDiscount).length} users
            </Badge>
          </div>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {usersWithGlobalDiscounts.data
              .filter((u: any) => u.defaultDiscount)
              .slice(0, 6)
              .map((user: any) => (
                <Card key={user.id} className="border-primary/20 bg-primary/5">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{getUserDisplayName(user)}</p>
                          {user.telegramUsername && (
                            <p className="text-xs text-muted-foreground">@{user.telegramUsername}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="default" className="text-xs">
                        {user.defaultDiscountType === 'FLAT' ? `₹${user.defaultDiscount}` : `${user.defaultDiscount}%`}
                      </Badge>
                    </div>
                    <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                      Applies to all services • Manage on Users page
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
          {usersWithGlobalDiscounts.data.filter((u: any) => u.defaultDiscount).length > 6 && (
            <p className="text-xs text-muted-foreground text-center">
              And {usersWithGlobalDiscounts.data.filter((u: any) => u.defaultDiscount).length - 6} more...
            </p>
          )}
        </motion.div>
      )}

      {/* Desktop Table View */}
      <motion.div {...fadeUp(0.15)} className="hidden md:block">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Final Price</TableHead>
                  <TableHead className="w-[60px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredPrices?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Percent size={48} className="text-muted-foreground/40" />
                        <p className="text-muted-foreground">
                          {searchQuery ? "No matching discounts found" : "No custom prices yet"}
                        </p>
                        {!searchQuery && (
                          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                            <Plus size={16} className="mr-2" />
                            Add First Discount
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPrices?.map((cp: any, index: number) => {
                    const finalPrice = getFinalPrice(
                      cp.service.basePrice,
                      parseFloat(cp.discount),
                      cp.type
                    );
                    return (
                      <motion.tr
                        key={cp.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + index * 0.02 }}
                        className="hover:bg-muted/50 transition-colors border-b"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{getUserDisplayName(cp.user)}</p>
                              {cp.user.telegramUsername && (
                                <p className="text-xs text-muted-foreground">@{cp.user.telegramUsername}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Sparkles size={12} className="text-muted-foreground" />
                            <span className="text-sm">{cp.service.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(cp.service.basePrice)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Badge variant={cp.type === "FLAT" ? "secondary" : "default"} className="text-xs">
                              {cp.type === "FLAT" ? "FLAT" : "PERCENT"}
                            </Badge>
                            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                              {cp.type === "FLAT" ? formatCurrency(cp.discount) : `${cp.discount}%`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-semibold">
                            {formatCurrency(finalPrice)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical size={14} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(cp)}>
                                <Edit size={14} className="mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setSelectedPrice(cp);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 size={14} className="mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </motion.div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-4">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24 mb-3" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredPrices?.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <Percent size={48} className="mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No custom prices found</p>
            </CardContent>
          </Card>
        ) : (
          filteredPrices?.map((cp: any, index: number) => {
            const finalPrice = getFinalPrice(
              cp.service.basePrice,
              parseFloat(cp.discount),
              cp.type
            );
            return (
              <motion.div
                key={cp.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{getUserDisplayName(cp.user)}</p>
                          {cp.user.telegramUsername && (
                            <p className="text-xs text-muted-foreground">@{cp.user.telegramUsername}</p>
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
                          <DropdownMenuItem onClick={() => openEditDialog(cp)}>
                            <Edit size={14} className="mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setSelectedPrice(cp);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 size={14} className="mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Service</span>
                        <span className="font-medium">{cp.service.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Base Price</span>
                        <span>{formatCurrency(cp.service.basePrice)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Discount</span>
                        <div className="flex items-center gap-1.5">
                          <Badge variant={cp.type === "FLAT" ? "secondary" : "default"} className="text-xs">
                            {cp.type}
                          </Badge>
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            {cp.type === "FLAT" ? formatCurrency(cp.discount) : `${cp.discount}%`}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-muted-foreground">Final Price</span>
                        <span className="font-bold">{formatCurrency(finalPrice)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        setCreateDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Custom Price</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* User Search */}
            <div className="space-y-2">
              <Label>Search User</Label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, username, or ID..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {userSearchResults && userSearchResults.length > 0 && !selectedUser && (
                <div className="border rounded-lg max-h-32 overflow-y-auto">
                  {userSearchResults.map((user: any) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        setSelectedUser(user);
                        setFormData({ ...formData, userId: user.id });
                        setUserSearchQuery(user.telegramUsername || user.firstName || "");
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm"
                    >
                      <div className="font-medium">{getUserDisplayName(user)}</div>
                      {user.telegramUsername && (
                        <div className="text-xs text-muted-foreground">@{user.telegramUsername}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {selectedUser && (
                <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <User size={14} />
                    <span className="text-sm font-medium">{getUserDisplayName(selectedUser)}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(null);
                      setFormData({ ...formData, userId: "" });
                      setUserSearchQuery("");
                    }}
                  >
                    Change
                  </Button>
                </div>
              )}
            </div>

            {/* Service Selection */}
            <div className="space-y-2">
              <Label>Service</Label>
              <Select
                value={formData.serviceId}
                onValueChange={(value) => setFormData({ ...formData, serviceId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Globe size={14} className="text-primary" />
                      <span className="font-medium">All Services</span>
                      <Badge variant="secondary" className="text-xs">{services?.length || 0}</Badge>
                    </div>
                  </SelectItem>
                  {services?.map((service: any) => (
                    <SelectItem key={service.id} value={service.id}>
                      <div className="flex items-center gap-2">
                        <span>{service.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({formatCurrency(service.basePrice)})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Note about global discount when "All Services" is selected */}
              {formData.serviceId === "all" && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Sparkles size={14} className="text-blue-500 mt-0.5" />
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      <p className="font-medium">Global Discount</p>
                      <p className="text-xs mt-1">This will set a default discount on the user account that applies to ALL services automatically. Old service-specific entries will be removed.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Discount Type */}
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.type === "PERCENT" ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, type: "PERCENT" })}
                  className="flex-1"
                >
                  Percent (%)
                </Button>
                <Button
                  type="button"
                  variant={formData.type === "FLAT" ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, type: "FLAT" })}
                  className="flex-1"
                >
                  Flat (₹)
                </Button>
              </div>
            </div>

            {/* Discount Value */}
            <div className="space-y-2">
              <Label>
                Discount Value ({formData.type === "PERCENT" ? "%" : "₹"})
              </Label>
              <Input
                type="number"
                placeholder={formData.type === "PERCENT" ? "10" : "5"}
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                min="0"
                max={formData.type === "PERCENT" ? 100 : undefined}
                step="0.01"
              />
            </div>

            {/* Preview */}
            {formData.discount && services && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                {formData.serviceId === "all" ? (
                  // Global discount preview
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <Sparkles size={16} />
                      <span>Global Discount Summary</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Method:</span>
                      <span className="text-blue-600 dark:text-blue-400">User Default Discount</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount Type:</span>
                      <span>{formData.type === "PERCENT" ? "Percentage" : "Flat (₹)"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount:</span>
                      <span className="text-green-600 dark:text-green-400">
                        {formData.type === "PERCENT" ? `${formData.discount}% off all services` : `₹${formData.discount} off all services`}
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between font-semibold">
                        <span>Applies to:</span>
                        <span>All {services.length} active services</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Single service preview
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base Price:</span>
                      <span>{formatCurrency(services.find((s: any) => s.id === formData.serviceId)?.basePrice || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount:</span>
                      <span className="text-green-600 dark:text-green-400">
                        {formData.type === "PERCENT" ? `${formData.discount}%` : formatCurrency(parseFloat(formData.discount) || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-semibold">
                      <span>Final Price:</span>
                      <span>
                        {formatCurrency(
                          getFinalPrice(
                            Number(services.find((s: any) => s.id === formData.serviceId)?.basePrice || 0),
                            parseFloat(formData.discount) || 0,
                            formData.type
                          )
                        )}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending || createBulkMutation.isPending || !selectedUser || !formData.serviceId || !formData.discount}
            >
              {(createMutation.isPending || createBulkMutation.isPending)
                ? "Creating..."
                : formData.serviceId === "all"
                ? "Create Bulk Discount"
                : "Create Discount"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) {
          setSelectedPrice(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Custom Price</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg text-sm">
              <div className="flex items-center gap-2 mb-2">
                <User size={14} />
                <span className="font-medium">{selectedPrice ? getUserDisplayName(selectedPrice.user) : ""}</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles size={14} />
                <span>{selectedPrice?.service.name}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Discount Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.type === "PERCENT" ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, type: "PERCENT" })}
                  className="flex-1"
                >
                  Percent (%)
                </Button>
                <Button
                  type="button"
                  variant={formData.type === "FLAT" ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, type: "FLAT" })}
                  className="flex-1"
                >
                  Flat (₹)
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Discount Value ({formData.type === "PERCENT" ? "%" : "₹"})
              </Label>
              <Input
                type="number"
                placeholder={formData.type === "PERCENT" ? "10" : "5"}
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                min="0"
                max={formData.type === "PERCENT" ? 100 : undefined}
                step="0.01"
              />
            </div>

            {selectedPrice && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Price:</span>
                  <span>{formatCurrency(selectedPrice.service.basePrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount:</span>
                  <span className="text-green-600 dark:text-green-400">
                    {formData.type === "PERCENT" ? `${formData.discount}%` : formatCurrency(parseFloat(formData.discount) || 0)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t font-semibold">
                  <span>Final Price:</span>
                  <span>
                    {formatCurrency(
                      getFinalPrice(
                        selectedPrice.service.basePrice,
                        parseFloat(formData.discount) || 0,
                        formData.type
                      )
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setSelectedPrice(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending || !formData.discount}
            >
              {updateMutation.isPending ? "Updating..." : "Update Discount"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Custom Price</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the custom discount for <strong>{selectedPrice?.user?.telegramUsername || selectedPrice?.user?.firstName}</strong> on <strong>{selectedPrice?.service?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Discount
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
