"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/utils";

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

  const { data: promocodes, isLoading, refetch } = trpc.admin.promo.list.useQuery();

  // Mutations
  const generateMutation = trpc.admin.promo.generate.useMutation({
    onSuccess: (data) => {
      toast.success(`Generated ${data.length} promocode${data.length > 1 ? "s" : ""} successfully`);
      setCreateDialogOpen(false);
      setFormData({ amount: "", count: "1", maxUses: "1" });
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate promocodes");
    },
  });

  const activateMutation = trpc.admin.promo.activate.useMutation({
    onSuccess: () => {
      toast.success("Promocode activated");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to activate promocode");
    },
  });

  const deactivateMutation = trpc.admin.promo.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Promocode deactivated");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to deactivate promocode");
    },
  });

  const deleteMutation = trpc.admin.promo.delete.useMutation({
    onSuccess: () => {
      toast.success("Promocode deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedPromo(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete promocode");
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate({
      amount: parseFloat(formData.amount),
      count: parseInt(formData.count),
      maxUses: parseInt(formData.maxUses),
    });
  };

  const handleDelete = () => {
    if (!selectedPromo) return;
    deleteMutation.mutate({ id: selectedPromo.id });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };

  const activeCount = promocodes?.filter((p) => p.isActive).length || 0;
  const totalUses = promocodes?.reduce((sum, p) => sum + p.usedCount, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp()} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Promocodes</h1>
          <p className="text-sm text-muted-foreground">
            Manage discount codes for users
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus size={16} className="mr-2" />
            Generate Codes
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div {...fadeUp(0.05)} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <Tag size={18} className="text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Total Codes</p>
              <p className="text-xl font-bold">{promocodes?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/10 p-2 rounded-lg">
              <Power size={18} className="text-green-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Active</p>
              <p className="text-xl font-bold">{activeCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 p-2 rounded-lg">
              <Tag size={18} className="text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Total Uses</p>
              <p className="text-xl font-bold">{totalUses}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/10 p-2 rounded-lg">
              <Tag size={18} className="text-purple-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Avg Discount</p>
              <p className="text-xl font-bold">
                {formatCurrency(
                  promocodes && promocodes.length > 0
                    ? promocodes.reduce((sum, p) => sum + p.amount.toNumber(), 0) / promocodes.length
                    : 0
                )}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Promocodes Table */}
      <motion.div {...fadeUp(0.1)}>
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
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : promocodes?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Tag size={48} className="text-muted-foreground/40" />
                        <p className="text-muted-foreground">No promocodes found</p>
                        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
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
                            <Badge variant="outline" className="text-xs">Exhausted</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={promo.isActive ? "default" : "secondary"}>
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
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical size={14} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {promo.isActive ? (
                              <DropdownMenuItem
                                onClick={() => activateMutation.mutate({ id: promo.id })}
                              >
                                <PowerOff size={14} className="mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => deactivateMutation.mutate({ id: promo.id })}
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
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, count: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Uses per Code</Label>
              <Input
                type="number"
                placeholder="1"
                min="1"
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
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
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
            >
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
              Are you sure you want to delete promocode <strong>{selectedPromo?.code}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Promocode"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
