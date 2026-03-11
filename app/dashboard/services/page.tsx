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
  CheckCircle,
  XCircle,
  Package,
  Search,
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
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/admin/page-header";
import { StatsCard } from "@/components/admin/stats-card";

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
  const [searchQuery, setSearchQuery] = useState("");

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

  // Stats calculations
  const activeCount = services?.filter((s: any) => s.isActive).length || 0;
  const inactiveCount = services?.filter((s: any) => !s.isActive).length || 0;
  const totalPurchases = services?.reduce((sum: number, s: any) => sum + (s._count?.purchases || 0), 0) || 0;

  // Filter services based on search query
  const filteredServices = services?.filter((service: any) => {
    const query = searchQuery.toLowerCase();
    return (
      service.name.toLowerCase().includes(query) ||
      service.code.toLowerCase().includes(query) ||
      service.server?.name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <PageHeader
        title="Services"
        description="Manage services offered on each server"
        actions={
          <>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48 md:w-64"
              />
            </div>
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
          </>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatsCard
          title="Total Services"
          value={services?.length || 0}
          icon={Package}
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
          title="Total Purchases"
          value={totalPurchases}
          icon={DollarSign}
          color="text-purple-500"
          bgColor="bg-purple-500/5"
          loading={isLoading}
        />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-12 w-12 rounded-lg" />
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
        ) : filteredServices?.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <Search size={48} className="mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">
                {searchQuery ? `No services matching "${searchQuery}"` : "No services found"}
              </p>
              {!searchQuery && (
                <Button size="sm" className="mt-3" onClick={() => setCreateDialogOpen(true)}>
                  <Plus size={16} className="mr-2" />
                  Add First Service
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredServices?.map((service: any, index: number) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
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
                      <div>
                        <p className="font-medium text-sm">{service.name}</p>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {service.code}
                        </code>
                      </div>
                    </div>
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
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Server</p>
                      <p className="truncate">{service.server?.name || "Unknown"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="text-green-600 dark:text-green-400 font-medium">
                        {formatCurrency(service.basePrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge variant={service.isActive ? "default" : "secondary"} className="mt-0.5">
                        {service.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Purchases</p>
                      <p className="font-medium">{service._count?.purchases || 0}</p>
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
                ) : filteredServices?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Search size={48} className="text-muted-foreground/40" />
                        <p className="text-muted-foreground">
                          {searchQuery ? `No services matching "${searchQuery}"` : "No services found"}
                        </p>
                        {!searchQuery && (
                          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                            <Plus size={16} className="mr-2" />
                            Add First Service
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServices?.map((service, index) => (
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
