"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Server,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Loader2,
  MoreVertical,
  DollarSign,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 280, damping: 24, delay },
});

export default function ServicesPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    serverId: "",
    basePrice: "",
    iconUrl: "",
  });

  // tRPC queries
  const { data: services, isLoading, refetch, isFetching } = trpc.services.list.useQuery();
  const { data: servers } = trpc.servers.list.useQuery();

  // tRPC mutations
  const createMutation = trpc.services.create.useMutation();
  const updateMutation = trpc.services.update.useMutation();
  const deleteMutation = trpc.services.delete.useMutation();

  const resetForm = () => {
    setFormData({ code: "", name: "", serverId: "", basePrice: "", iconUrl: "" });
  };

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        code: formData.code,
        name: formData.name,
        serverId: formData.serverId,
        basePrice: parseFloat(formData.basePrice),
        iconUrl: formData.iconUrl || undefined,
      });
      toast.success("Service created successfully");
      setCreateDialogOpen(false);
      resetForm();
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to create service");
    }
  };

  const handleEdit = async () => {
    if (!selectedService) return;
    try {
      await updateMutation.mutateAsync({
        id: selectedService.id,
        data: {
          code: formData.code,
          name: formData.name,
          serverId: formData.serverId,
          basePrice: parseFloat(formData.basePrice),
          iconUrl: formData.iconUrl || undefined,
        },
      });
      toast.success("Service updated successfully");
      setEditDialogOpen(false);
      resetForm();
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update service");
    }
  };

  const handleDelete = async () => {
    if (!selectedService) return;
    try {
      await deleteMutation.mutateAsync({ id: selectedService.id });
      toast.success("Service deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedService(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete service");
    }
  };

  const openEditDialog = (service: any) => {
    setSelectedService(service);
    setFormData({
      code: service.code,
      name: service.name,
      serverId: service.serverId,
      basePrice: service.basePrice.toString(),
      iconUrl: service.iconUrl || "",
    });
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp()} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Services</h1>
          <p className="text-sm text-muted-foreground">
            Manage services offered on each server
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
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus size={16} className="mr-2" />
            Add Service
          </Button>
        </div>
      </motion.div>

      {/* Services Table */}
      <motion.div {...fadeUp(0.1)}>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Icon</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Server</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead className="w-[60px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-10 rounded" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : services?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Server size={48} className="text-muted-foreground/40" />
                        <p className="text-muted-foreground">No services found</p>
                        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                          <Plus size={16} className="mr-2" />
                          Add First Service
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  services?.map((service, index) => (
                    <motion.tr
                      key={service.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.02 }}
                      className="hover:bg-muted/50 transition-colors border-b"
                    >
                      <TableCell>
                        {service.iconUrl ? (
                          <img
                            src={service.iconUrl}
                            alt={service.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <Server size={20} className="text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-0.5 rounded">
                          {service.code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{service.name}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{service.server?.name || "Unknown"}</span>
                          {service.server?.countryIso && (
                            <Badge variant="outline" className="text-xs">
                              {service.server.countryIso}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <DollarSign size={14} />
                          <span className="font-semibold">{formatCurrency(service.basePrice)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={service.isActive ? "default" : "secondary"}>
                          {service.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {service._count?.purchases || 0} purchases
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
                            <DropdownMenuItem onClick={() => openEditDialog(service)}>
                              <Edit size={14} className="mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setSelectedService(service);
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

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Service Code</Label>
              <Input
                placeholder="e.g., whatsapp, telegram"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Service Name</Label>
              <Input
                placeholder="e.g., WhatsApp"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Server</Label>
              <Select
                value={formData.serverId}
                onValueChange={(value) => setFormData({ ...formData, serverId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a server" />
                </SelectTrigger>
                <SelectContent>
                  {servers?.map((server) => (
                    <SelectItem key={server.id} value={server.id}>
                      {server.name} ({server.countryIso})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Base Price</Label>
              <Input
                type="number"
                placeholder="0.00"
                step="0.01"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Icon URL (optional)</Label>
              <Input
                placeholder="https://example.com/icon.png"
                value={formData.iconUrl}
                onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
              />
            </div>
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
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Service Code</Label>
              <Input
                placeholder="e.g., whatsapp, telegram"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Service Name</Label>
              <Input
                placeholder="e.g., WhatsApp"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Server</Label>
              <Select
                value={formData.serverId}
                onValueChange={(value) => setFormData({ ...formData, serverId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a server" />
                </SelectTrigger>
                <SelectContent>
                  {servers?.map((server) => (
                    <SelectItem key={server.id} value={server.id}>
                      {server.name} ({server.countryIso})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Base Price</Label>
              <Input
                type="number"
                placeholder="0.00"
                step="0.01"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Icon URL (optional)</Label>
              <Input
                placeholder="https://example.com/icon.png"
                value={formData.iconUrl}
                onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Updating..." : "Update Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedService?.name}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Service
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
