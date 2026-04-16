"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Server,
  Plus,
  RefreshCw,
  Loader2,
  MoreVertical,
  Edit,
  KeyRound,
  CheckCircle,
  XCircle,
  Globe,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/page-header";
import { StatsCard } from "@/components/admin/stats-card";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 280, damping: 24, delay },
});

// Type for selected item (Server or ApiCredential)
type SelectedItem =
  | { id: string; name: string; countryCode: string; countryIso: string; countryName: string; flagUrl: string | null; apiId: string; isActive: boolean }
  | { id: string; name: string; apiUrl: string; apiKey: string; isActive: boolean };

export default function ServersPage() {
  const [activeTab, setActiveTab] = useState("servers");

  // Server form state
  const [serverDialogOpen, setServerDialogOpen] = useState(false);
  const [serverForm, setServerForm] = useState({
    name: "",
    countryCode: "",
    countryIso: "IN",
    countryName: "",
    flagUrl: "",
    apiId: "",
    isActive: true,
  });

  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [deleteType, setDeleteType] = useState<"server" | "api">("server");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // tRPC queries
  const { data: serversData, isLoading, refetch, isFetching } = trpc.servers.list.useQuery();
  const { data: apiCredentialsData, isLoading: apiLoading, refetch: apiRefetch, isFetching: apiFetching } = trpc.servers.listApiCredentials.useQuery();

  // tRPC mutations
  const createServerMutation = trpc.servers.create.useMutation({
    onSuccess: () => {
      refetch();
      apiRefetch();
    },
  });
  const updateServerMutation = trpc.servers.update.useMutation({
    onSuccess: () => {
      refetch();
      apiRefetch();
    },
  });
  const deleteServerMutation = trpc.servers.delete.useMutation({
    onSuccess: () => {
      refetch();
      apiRefetch();
    },
  });
  const createApiCredentialMutation = trpc.servers.createApiCredential.useMutation({
    onSuccess: () => {
      refetch();
      apiRefetch();
    },
  });
  const updateApiCredentialMutation = trpc.servers.updateApiCredential.useMutation({
    onSuccess: () => {
      refetch();
      apiRefetch();
    },
  });
  const deleteApiCredentialMutation = trpc.servers.deleteApiCredential.useMutation({
    onSuccess: () => {
      refetch();
      apiRefetch();
    },
  });

  // Handlers
  const handleCreateServer = async () => {
    if (createServerMutation.isPending) return;

    // Validation
    if (!serverForm.name?.trim() || !serverForm.countryCode?.trim() || !serverForm.apiId?.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createServerMutation.mutateAsync(serverForm);
      toast.success("Server created successfully");
      setServerDialogOpen(false);
      setServerForm({ name: "", countryCode: "", countryIso: "IN", countryName: "", flagUrl: "", apiId: "", isActive: true });
    } catch (err: any) {
      toast.error(err.message || "Failed to create server");
    }
  };

  // Handle Switch toggle - only updates isActive field
  const handleToggleServerActive = useCallback(async (server: any, isActive: boolean) => {
    if (updateServerMutation.isPending) return;
    try {
      await updateServerMutation.mutateAsync({
        id: server.id,
        data: { isActive },
      });
      toast.success("Server status updated");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update server status");
    }
  }, [updateServerMutation, refetch]);

  // Handle dialog form submission - updates all fields from form
  const handleUpdateServer = async () => {
    if (!selectedItem || updateServerMutation.isPending) return;

    // Validation
    if (!serverForm.name?.trim() || !serverForm.countryCode?.trim() || !serverForm.apiId?.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const updateData = {
        id: selectedItem.id,
        data: {
          name: serverForm.name,
          countryCode: serverForm.countryCode,
          countryIso: serverForm.countryIso,
          countryName: serverForm.countryName,
          flagUrl: serverForm.flagUrl || undefined,
          apiId: serverForm.apiId,
          isActive: serverForm.isActive,
        },
      };
      await updateServerMutation.mutateAsync(updateData);
      toast.success("Server updated successfully");
      setServerDialogOpen(false);
      setSelectedItem(null);
      setServerForm({ name: "", countryCode: "", countryIso: "IN", countryName: "", flagUrl: "", apiId: "", isActive: true });
    } catch (err: any) {
      toast.error(err.message || "Failed to update server");
    }
  };

  const handleDelete = async () => {
    if (!selectedItem || deleteServerMutation.isPending || deleteApiCredentialMutation.isPending) return;
    try {
      if (deleteType === "server") {
        await deleteServerMutation.mutateAsync({ id: selectedItem.id });
      } else {
        await deleteApiCredentialMutation.mutateAsync({ id: selectedItem.id });
      }
      toast.success(`${deleteType === "server" ? "Server" : "API credential"} deleted successfully`);
      setDeleteDialogOpen(false);
      setSelectedItem(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleEditServer = async (server?: any) => {
    if (server) {
      setSelectedItem(server);
      setServerForm({
        name: server.name,
        countryCode: server.countryCode,
        countryIso: server.countryIso,
        countryName: server.countryName,
        flagUrl: server.flagUrl || "",
        apiId: server.api?.id || "",
        isActive: server.isActive,
      });
      setServerDialogOpen(true);
    }
  };

  // API credential form state
  const [apiDialogOpen, setApiDialogOpen] = useState(false);
  const [apiForm, setApiForm] = useState({
    name: "",
    apiUrl: "",
    apiKey: "",
    isActive: true,
  });

  const handleCreateApi = async () => {
    if (createApiCredentialMutation.isPending) return;

    // Validation
    if (!apiForm.name?.trim() || !apiForm.apiUrl?.trim() || !apiForm.apiKey?.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createApiCredentialMutation.mutateAsync(apiForm);
      toast.success("API credential created successfully");
      setApiDialogOpen(false);
      setApiForm({ name: "", apiUrl: "", apiKey: "", isActive: true });
    } catch (err: any) {
      toast.error(err.message || "Failed to create API credential");
    }
  };

  const handleEditApi = async (api?: any) => {
    if (api) {
      setSelectedItem(api);
      setApiForm({
        name: api.name,
        apiUrl: api.apiUrl,
        apiKey: api.apiKey,
        isActive: api.isActive,
      });
      setApiDialogOpen(true);
    }
  };

  // Handle Switch toggle - only updates isActive field
  const handleToggleApiActive = useCallback(async (api: any, isActive: boolean) => {
    if (updateApiCredentialMutation.isPending) return;
    try {
      await updateApiCredentialMutation.mutateAsync({
        id: api.id,
        isActive,
      });
      toast.success("API credential status updated");
      apiRefetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update API credential status");
    }
  }, [updateApiCredentialMutation, apiRefetch]);

  // Handle dialog form submission - updates all fields from form
  const handleUpdateApi = async () => {
    if (!selectedItem || updateApiCredentialMutation.isPending) return;

    // Validation - all fields required for form submission
    if (!apiForm.name?.trim() || !apiForm.apiUrl?.trim() || !apiForm.apiKey?.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const updateData = {
        id: selectedItem.id,
        name: apiForm.name,
        apiUrl: apiForm.apiUrl,
        apiKey: apiForm.apiKey,
        isActive: apiForm.isActive,
      };
      await updateApiCredentialMutation.mutateAsync(updateData);
      toast.success("API credential updated successfully");
      setApiDialogOpen(false);
      setApiForm({ name: "", apiUrl: "", apiKey: "", isActive: true });
      setSelectedItem(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update API credential");
    }
  };

  const handleDeleteApi = async (api?: any) => {
    if (!api || deleteApiCredentialMutation.isPending) return;
    try {
      await deleteApiCredentialMutation.mutateAsync({ id: api.id });
      toast.success("API credential deleted successfully");
      setApiDialogOpen(false);
      setSelectedItem(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete API credential");
    }
  };

  // Stats
  const activeServers = serversData?.filter((s: any) => s.isActive).length || 0;
  const inactiveServers = serversData?.filter((s: any) => !s.isActive).length || 0;
  const activeApis = apiCredentialsData?.filter((a: any) => a.isActive).length || 0;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <PageHeader
        title="Servers"
        description="Manage OTP servers and API credentials"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetch();
              apiRefetch();
            }}
            disabled={isFetching || apiFetching}
          >
            {isFetching || apiFetching ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
              <RefreshCw size={16} className="mr-2" />
            )}
            Refresh
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard
          title="Total Servers"
          value={serversData?.length || 0}
          icon={Server}
          color="text-blue-500"
          bgColor="bg-blue-500/5"
          loading={isLoading}
        />
        <StatsCard
          title="Active Servers"
          value={activeServers}
          icon={CheckCircle}
          color="text-green-500"
          bgColor="bg-green-500/5"
          loading={isLoading}
        />
        <StatsCard
          title="API Credentials"
          value={apiCredentialsData?.length || 0}
          icon={KeyRound}
          color="text-purple-500"
          bgColor="bg-purple-500/5"
          loading={apiLoading}
        />
        <StatsCard
          title="Active APIs"
          value={activeApis}
          icon={Globe}
          color="text-cyan-500"
          bgColor="bg-cyan-500/5"
          loading={apiLoading}
        />
      </div>

      {/* Tabs */}
      <motion.div {...fadeUp(0.1)} className="bg-card border border-border rounded-xl p-4 space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="servers">Servers</TabsTrigger>
            <TabsTrigger value="api">API Credentials</TabsTrigger>
          </TabsList>

          {/* Servers Tab */}
          <TabsContent value="servers" className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setServerDialogOpen(true)}>
                <Plus size={16} className="mr-2" />
                Add Server
              </Button>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : serversData?.length === 0 ? (
                <Card className="border-border">
                  <CardContent className="py-12 text-center">
                    <Server size={48} className="mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-muted-foreground">No servers found</p>
                    <Button size="sm" className="mt-3" onClick={() => setServerDialogOpen(true)}>
                      <Plus size={16} className="mr-2" />
                      Add First Server
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                serversData?.map((server: any, index: number) => (
                  <motion.div
                    key={server.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <Card className="border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {server.flagUrl ? (
                              <img src={server.flagUrl} alt={server.countryIso} className="w-8 h-6 object-cover rounded" />
                            ) : (
                              <div className="w-8 h-6 bg-muted rounded flex items-center justify-center">
                                <Globe size={14} className="text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm">{server.name}</p>
                              <Badge variant="outline" className="text-xs">
                                {server.countryCode} ({server.countryIso})
                              </Badge>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical size={14} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditServer(server)}>
                                <Edit size={14} className="mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setSelectedItem(server);
                                  setDeleteType("server");
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
                            <p className="text-xs text-muted-foreground">Status</p>
                            <Badge variant={server.isActive ? "default" : "secondary"} className="mt-0.5">
                              {server.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Services</p>
                            <p className="font-medium">{server._count?.services || 0}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>API Credential</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Services</TableHead>
                      <TableHead className="w-[60px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : serversData?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <Server size={48} className="text-muted-foreground/40" />
                            <p className="text-muted-foreground">No servers found</p>
                            <Button size="sm" onClick={() => setServerDialogOpen(true)}>
                              <Plus size={16} className="mr-2" />
                              Add First Server
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      serversData?.map((server, index) => (
                        <motion.tr
                          key={server.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + index * 0.02 }}
                          className="hover:bg-muted/50 transition-colors border-b"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {server.flagUrl && (
                                <img src={server.flagUrl} alt={server.countryIso} className="w-5 h-4 object-cover rounded" />
                              )}
                              <span className="font-medium">{server.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{server.countryCode} ({server.countryIso})</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <KeyRound size={14} className="text-muted-foreground" />
                              <span className="text-sm">{server.api?.name || "-"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={server.isActive}
                              onCheckedChange={(checked) => handleToggleServerActive(server, checked)}
                              disabled={updateServerMutation.isPending}
                            />
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{server._count?.services || 0}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical size={14} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditServer(server)}>
                                  <Edit size={14} className="mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                    setSelectedItem(server);
                                    setDeleteType("server");
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
          </TabsContent>

          {/* API Credentials Tab */}
          <TabsContent value="api" className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setApiDialogOpen(true)}>
                <Plus size={16} className="mr-2" />
                Add API Credential
              </Button>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {apiLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : apiCredentialsData?.length === 0 ? (
                <Card className="border-border">
                  <CardContent className="py-12 text-center">
                    <KeyRound size={48} className="mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-muted-foreground">No API credentials found</p>
                    <Button size="sm" className="mt-3" onClick={() => setApiDialogOpen(true)}>
                      <Plus size={16} className="mr-2" />
                      Add First API Credential
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                apiCredentialsData?.map((api: any, index: number) => (
                  <motion.div
                    key={api.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <Card className="border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                              <span className="text-sm font-bold text-blue-500">{api.name?.[0]?.toUpperCase() || "A"}</span>
                            </div>
                            <div>
                              <p className="font-medium text-sm">{api.name}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{api.apiUrl}</p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical size={14} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditApi(api)}>
                                <Edit size={14} className="mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setSelectedItem(api);
                                  setDeleteType("api");
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
                            <p className="text-xs text-muted-foreground">API Key</p>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                              {api.apiKey?.slice(0, 8)}***
                            </code>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <Badge variant={api.isActive ? "default" : "secondary"} className="mt-0.5">
                              {api.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Used By</p>
                            <p className="font-medium">{api._count?.servers || 0} servers</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Created</p>
                            <p className="text-muted-foreground text-xs">
                              {new Date(api.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>API URL</TableHead>
                      <TableHead>API Key</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Used By</TableHead>
                      <TableHead className="w-[60px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : apiCredentialsData?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <KeyRound size={48} className="text-muted-foreground/40" />
                            <p className="text-muted-foreground">No API credentials found</p>
                            <Button size="sm" onClick={() => setApiDialogOpen(true)}>
                              <Plus size={16} className="mr-2" />
                              Add First API Credential
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      apiCredentialsData?.map((api, index) => (
                        <motion.tr
                          key={api.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + index * 0.02 }}
                          className="hover:bg-muted/50 transition-colors border-b"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <span className="text-xs font-bold text-blue-500">{api.name?.[0]?.toUpperCase() || "A"}</span>
                              </div>
                              <span className="font-medium">{api.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm truncate max-w-[200px] block">
                              {api.apiUrl}
                            </span>
                          </TableCell>
                          <TableCell>
                            <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                              {api.apiKey?.slice(0, 8)}***
                            </code>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {new Date(api.createdAt).toLocaleDateString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={api.isActive}
                              onCheckedChange={(checked) => handleToggleApiActive(api, checked)}
                              disabled={updateApiCredentialMutation.isPending}
                            />
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{api._count?.servers || 0}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical size={14} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditApi(api)}>
                                  <Edit size={14} className="mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                    setSelectedItem(api);
                                    setDeleteType("api");
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
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Server Dialog */}
      <Dialog open={serverDialogOpen} onOpenChange={(open) => {
        setServerDialogOpen(open);
        if (!open) {
          setSelectedItem(null);
          setServerForm({ name: "", countryCode: "", countryIso: "IN", countryName: "", flagUrl: "", apiId: "", isActive: true });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedItem ? "Edit Server" : "Add New Server"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="e.g., India Server 1"
                value={serverForm.name}
                onChange={(e) => setServerForm({ ...serverForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Country Code</Label>
              <Input
                placeholder="e.g., IN or 22"
                value={serverForm.countryCode}
                onChange={(e) => setServerForm({ ...serverForm, countryCode: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Country ISO</Label>
              <Input
                placeholder="e.g., IN"
                value={serverForm.countryIso}
                onChange={(e) => setServerForm({ ...serverForm, countryIso: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Country Name</Label>
              <Input
                placeholder="India"
                value={serverForm.countryName}
                onChange={(e) => setServerForm({ ...serverForm, countryName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>API Credential</Label>
              <select
                className="w-full h-10 px-3 py-2 rounded-md border bg-background text-sm"
                value={serverForm.apiId}
                onChange={(e) => setServerForm({ ...serverForm, apiId: e.target.value })}
              >
                <option value="">Select API credential</option>
                {apiCredentialsData?.map((api) => (
                  <option key={api.id} value={api.id}>
                    {api.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Flag URL (optional)</Label>
              <Input
                placeholder="https://example.com/flag.png"
                value={serverForm.flagUrl}
                onChange={(e) => setServerForm({ ...serverForm, flagUrl: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={serverForm.isActive}
                onCheckedChange={(checked) => setServerForm({ ...serverForm, isActive: checked })}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setServerDialogOpen(false);
                setSelectedItem(null);
                setServerForm({ name: "", countryCode: "", countryIso: "IN", countryName: "", flagUrl: "", apiId: "", isActive: true });
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={selectedItem ? handleUpdateServer : handleCreateServer}
              disabled={createServerMutation.isPending || updateServerMutation.isPending}
            >
              {createServerMutation.isPending || updateServerMutation.isPending
                ? "Saving..."
                : selectedItem
                ? "Update"
                : "Create"} Server
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API Credential Dialog */}
      <Dialog open={apiDialogOpen} onOpenChange={(open) => {
        setApiDialogOpen(open);
        if (!open) {
          setSelectedItem(null);
          setApiForm({ name: "", apiUrl: "", apiKey: "", isActive: true });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedItem ? "Edit API Credential" : "Add API Credential"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="e.g., 5SIM Account"
                value={apiForm.name}
                onChange={(e) => setApiForm({ ...apiForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>API URL</Label>
              <Input
                placeholder="https://api.example.com"
                value={apiForm.apiUrl}
                onChange={(e) => setApiForm({ ...apiForm, apiUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                placeholder="your-api-key"
                value={apiForm.apiKey}
                onChange={(e) => setApiForm({ ...apiForm, apiKey: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="apiIsActive"
                checked={apiForm.isActive}
                onCheckedChange={(checked) => setApiForm({ ...apiForm, isActive: checked })}
              />
              <Label htmlFor="apiIsActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApiDialogOpen(false);
                setSelectedItem(null);
                setApiForm({ name: "", apiUrl: "", apiKey: "", isActive: true });
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={selectedItem ? handleUpdateApi : handleCreateApi}
              disabled={createApiCredentialMutation.isPending || updateApiCredentialMutation.isPending}
            >
              {(createApiCredentialMutation.isPending || updateApiCredentialMutation.isPending)
                ? "Saving..."
                : selectedItem
                ? "Update"
                : "Create"} Credential
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteType === "server" ? "Server" : "API Credential"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{(selectedItem as any)?.name}</strong>?
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedItem(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              variant="destructive"
              disabled={deleteServerMutation.isPending || deleteApiCredentialMutation.isPending}
            >
              {deleteServerMutation.isPending || deleteApiCredentialMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
