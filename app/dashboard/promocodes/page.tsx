"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { formatCurrency, formatDate, toNumber } from "@/lib/utils";
import {
  Tag,
  Plus,
  RefreshCw,
  Loader2,
  MoreVertical,
  Copy,
  Trash2,
  Power,
  PowerOff,
  CheckCircle,
  XCircle,
  Percent,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { StatsCard } from "@/components/admin/stats-card";
import { PageHeader } from "@/components/admin/page-header";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 280, damping: 24, delay },
});

export default function PromocodesPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    amount: "",
    count: "1",
    maxUses: "1",
  });

  // tRPC query for promocodes
  const { data: promocodes, isLoading, refetch, isFetching } = trpc.promocodes.list.useQuery();

  // tRPC mutations
  const generateMutation = trpc.promocodes.generate.useMutation();
  const updateMutation = trpc.promocodes.update.useMutation();
  const deleteMutation = trpc.promocodes.delete.useMutation();

  const handleGenerate = async () => {
    try {
      await generateMutation.mutateAsync({
        amount: parseFloat(formData.amount),
        count: parseInt(formData.count),
        maxUses: parseInt(formData.maxUses),
      });
      toast.success(
        `Generated ${formData.count} promocode${parseInt(formData.count) > 1 ? "s" : ""} successfully`,
      );
      setCreateDialogOpen(false);
      setFormData({ amount: "", count: "1", maxUses: "1" });
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to generate promocodes");
    }
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      await updateMutation.mutateAsync({
        id,
        action: isActive ? "deactivate" : "activate",
      });
      toast.success(`Promocode ${isActive ? "deactivated" : "activated"}`);
      refetch();
    } catch (err: any) {
      toast.error(
        err.message ||
          `Failed to ${isActive ? "deactivate" : "activate"} promocode`,
      );
    }
  };

  const handleDelete = async () => {
    if (!selectedPromo) return;
    try {
      await deleteMutation.mutateAsync({ id: selectedPromo.id });
      toast.success("Promocode deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedPromo(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete promocode");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };

  const activeCount = promocodes?.filter((p) => p.isActive).length || 0;
  const inactiveCount = promocodes?.filter((p) => !p.isActive).length || 0;
  const totalUses =
    promocodes?.reduce((sum, p) => sum + (p.usedCount || 0), 0) || 0;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <PageHeader
        title="Promocodes"
        description="Manage discount codes for users"
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
              Generate Codes
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
          title="Total Codes"
          value={promocodes?.length || 0}
          icon={Tag}
          color="text-blue-500"
          bgColor="bg-blue-500/5"
          loading={isLoading}
        />
        <StatsCard
          title="Active"
          value={activeCount}
          icon={CheckCircle}
          color="text-green-500"
          bgColor="bg-green-500/5"
          loading={isLoading}
        />
        <StatsCard
          title="Inactive"
          value={inactiveCount}
          icon={XCircle}
          color="text-red-500"
          bgColor="bg-red-500/5"
          loading={isLoading}
        />
        <StatsCard
          title="Total Uses"
          value={totalUses}
          icon={Percent}
          color="text-amber-500"
          bgColor="bg-amber-500/5"
          loading={isLoading}
        />
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
        ) : promocodes?.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <Tag size={48} className="mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No promocodes found</p>
              <Button
                size="sm"
                className="mt-3"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus size={16} className="mr-2" />
                Generate First Code
              </Button>
            </CardContent>
          </Card>
        ) : (
          promocodes?.map((promo, index) => (
            <motion.div
              key={promo.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-0.5 rounded font-mono">
                        {promo.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyCode(promo.code)}
                      >
                        <Copy size={12} />
                      </Button>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {promo.isActive ? (
                          <DropdownMenuItem
                            onClick={() =>
                              handleToggleStatus(promo.id, promo.isActive)
                            }
                            disabled={updateMutation.isPending}
                          >
                            <PowerOff size={14} className="mr-2" />
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() =>
                              handleToggleStatus(promo.id, promo.isActive)
                            }
                            disabled={updateMutation.isPending}
                          >
                            <Power size={14} className="mr-2" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setSelectedPromo(promo);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 size={14} className="mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(promo.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Usage</p>
                      <p className="font-medium">
                        {promo.usedCount} / {promo.maxUses}
                        {promo.usedCount >= promo.maxUses && (
                          <Badge variant="outline" className="ml-1 text-xs">
                            Exhausted
                          </Badge>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge variant={promo.isActive ? "default" : "secondary"} className="mt-0.5">
                        {promo.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="text-muted-foreground">{formatDate(promo.createdAt)}</p>
                    </div>
                  </div>
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
                  <TableHead>Code</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Max Uses</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[60px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
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
                      <TableCell>
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : promocodes?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Tag size={48} className="text-muted-foreground/40" />
                        <p className="text-muted-foreground">
                          No promocodes found
                        </p>
                        <Button
                          size="sm"
                          onClick={() => setCreateDialogOpen(true)}
                        >
                          <Plus size={16} className="mr-2" />
                          Generate First Code
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  promocodes?.map((promo, index) => (
                    <motion.tr
                      key={promo.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.02 }}
                      className="hover:bg-muted/50 transition-colors border-b"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-muted px-2 py-0.5 rounded font-mono">
                            {promo.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyCode(promo.code)}
                          >
                            <Copy size={12} />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(promo.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{promo.maxUses}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{promo.usedCount}</span>
                          {promo.usedCount >= promo.maxUses && (
                            <Badge variant="outline" className="text-xs">
                              Exhausted
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={promo.isActive ? "default" : "secondary"}
                        >
                          {promo.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(promo.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical size={14} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {promo.isActive ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleToggleStatus(promo.id, promo.isActive)
                                }
                                disabled={updateMutation.isPending}
                              >
                                <PowerOff size={14} className="mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleToggleStatus(promo.id, promo.isActive)
                                }
                                disabled={updateMutation.isPending}
                              >
                                <Power size={14} className="mr-2" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setSelectedPromo(promo);
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </motion.div>

      {/* Generate Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Promocodes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Discount Amount (₹)</Label>
              <Input
                type="number"
                placeholder="10.00"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Number of Codes</Label>
              <Input
                type="number"
                placeholder="1"
                min="1"
                max="100"
                value={formData.count}
                onChange={(e) =>
                  setFormData({ ...formData, count: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Max Uses per Code</Label>
              <Input
                type="number"
                placeholder="1"
                min="1"
                value={formData.maxUses}
                onChange={(e) =>
                  setFormData({ ...formData, maxUses: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setFormData({ amount: "", count: "1", maxUses: "1" });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
              {generateMutation.isPending ? "Generating..." : "Generate Codes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promocode</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete promocode{" "}
              <strong>{selectedPromo?.code}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Promocode"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
