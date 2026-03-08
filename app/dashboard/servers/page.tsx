"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Server,
  Plus,
  RefreshCw,
  Loader2,
  MoreVertical,
  Edit,
  KeyRound,
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
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 280, damping: 24, delay },
});

// Type for selected item (Server or ApiCredential)
type SelectedItem =
  | { id: string; name: string; countryCode: string; countryIso: string; countryName: string; flagUrl: string; apiId: string; isActive: boolean }
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
  const { data: serversData, isLoading, refetch } = trpc.servers.list.useQuery();
  const { data: apiCredentialsData, isLoading: apiLoading, refetch: apiRefetch } = trpc.servers.listApiCredentials.useQuery();

  // tRPC mutations
  const createServerMutation = trpc.servers.create.useMutation();
  const updateServerMutation = trpc.servers.update.useMutation();
  const deleteServerMutation = trpc.servers.delete.useMutation();
  const createApiCredentialMutation = trpc.servers.createApiCredential.useMutation();
  const updateApiCredentialMutation = trpc.servers.updateApiCredential.useMutation();
  const deleteApiCredentialMutation = trpc.servers.deleteApiCredential.useMutation();

  // Handlers
  const handleCreateServer = async () => {
    try {
      await createServerMutation.mutateAsync(serverForm);
      toast.success("Server created successfully");
      setServerDialogOpen(false);
      setServerForm({ name: "", countryCode: "", countryIso: "", countryName: "", flagUrl: "", apiId: "", isActive: true });
      refetch();
      apiRefetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to create server");
    }
  };

  const handleUpdateServer = async () => {
    if (!selectedItem) return;
    try {
      await updateServerMutation.mutateAsync({
        id: selectedItem.id,
        name: serverForm.name,
        countryCode: serverForm.countryCode,
        countryIso: serverForm.countryIso,
        countryName: serverForm.countryName,
        flagUrl: serverForm.flagUrl || null,
        apiId: serverForm.apiId,
        isActive: serverForm.isActive,
      });
      toast.success("Server updated successfully");
      setServerDialogOpen(false);
      setServerForm({ name: "", countryCode: "", countryIso: "", countryName: "", flagUrl: "", apiId: "", isActive: true });
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update server");
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      if (deleteType === "server") {
        await deleteServerMutation.mutateAsync({ id: selectedItem.id });
      } else {
        await deleteApiCredentialMutation.mutateAsync({ id: selectedItem.id });
      }
      setDeleteDialogOpen(false);
      setSelectedItem(null);
      refetch();
      apiRefetch();
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
  });

  const handleCreateApi = async () => {
    try {
      await createApiCredentialMutation.mutateAsync(apiForm);
      toast.success("API credential created successfully");
      setApiDialogOpen(false);
      setApiForm({ name: "", apiUrl: "", apiKey: "" });
      refetch();
      apiRefetch();
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
      });
      setApiDialogOpen(true);
    }
  };

  const handleDeleteApi = async (api?: any) => {
    if (!api) return;
    try {
      await deleteApiCredentialMutation.mutateAsync({ id: api.id });
      toast.success("API credential deleted successfully");
      setApiDialogOpen(false);
      setSelectedItem(null);
      apiRefetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete API credential");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp()} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Servers</h1>
          <p className="text-sm text-muted-foreground">
            Manage OTP servers and API credentials
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refetch();
            apiRefetch();
          }}
          disabled={isLoading || apiLoading}
        >
          {isLoading || apiLoading ? (
            <Loader2 size={16} className="animate-spin mr-2" />
          ) : (
            <RefreshCw size={16} className="mr-2" />
          )}
          Refresh
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div {...fadeUp(0.05)} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <Server size={18} className="text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Total Servers</p>
              <p className="text-xl font-bold text-foreground">{serversData?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/10 p-2 rounded-lg">
              <KeyRound size={18} className="text-green-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Active Servers</p>
              <p className="text-xl font-bold text-foreground">
                {serversData?.filter?.((s: any) => s.isActive).length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/10 p-2 rounded-lg">
              <KeyRound size={18} className="text-purple-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">API Credentials</p>
              <p className="text-xl font-bold text-foreground">{apiCredentialsData?.length || 0}</p>
            </div>
          </div>
        </div>
      </motion.div>

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
              <Button size="sm" onClick={() => handleCreateServer()}>
                <Plus size={16} className="mr-2" />
                Add Server
              </Button>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Code</TableHead>
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
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      </TableRow>
                    ))
                  ) : serversData?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <Server size={48} className="text-muted-foreground/40" />
                          <p className="text-muted-foreground">No servers found</p>
                          <Button size="sm" onClick={() => handleCreateServer()}>
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
                            <span className="text-sm">{server.api?.id || "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={server.isActive}
                            disabled={true}
                            onCheckedChange={(checked) => handleUpdateServer({ ...server, isActive: checked })}
                          />
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{server.services?.length || 0}</span>
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
                              <DropdownMenuItem onClick={() => { setSelectedItem(server); setDeleteType("server"); setDeleteDialogOpen(true); }}>
                                <Edit size={14} className="mr-2 text-destructive" />
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
          </TabsContent>

          {/* API Credentials Tab */}
          <TabsContent value="api" className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setApiDialogOpen(true)}>
                <Plus size={16} className="mr-2" />
                Add API Credential
              </Button>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
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
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      </TableRow>
                    ))
                  ) : apiCredentialsData?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12">
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
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-white">
                              <span className="text-xs font-bold">{api.name?.[0]?.toUpperCase() || "API"}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm truncate max-w-[200px] block">
                            {api.apiUrl}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                            {api.apiKey?.slice(0, 8)}***
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(api.createdAt).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={api.isActive}
                            disabled={true}
                            onCheckedChange={(checked) => handleEditApi({ ...api, isActive: checked })}
                          />
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{api.servers?.length || 0}</span>
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
                              <DropdownMenuItem onClick={() => { setDeleteType("api"); handleDeleteApi(api); setDeleteDialogOpen(true); }}>
                                <Edit size={14} className="mr-2 text-destructive" />
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
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Server Dialog */}
      <Dialog open={serverDialogOpen} onOpenChange={setServerDialogOpen}>
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
                setServerForm({ name: "", countryCode: "", countryIso: "", countryName: "", flagUrl: "", apiId: "", isActive: true });
              }}
            >
              Cancel
            </Button>
            <Button
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
      <Dialog open={apiDialogOpen} onOpenChange={setApiDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add API Credential</DialogTitle>
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApiDialogOpen(false);
                setApiForm({ name: "", apiUrl: "", apiKey: "" });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateApi}
              disabled={createApiCredentialMutation.isPending}
            >
              {createApiCredentialMutation.isPending ? "Creating..." : "Create"} Credential
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
            Are you sure you want to delete <strong>{selectedItem?.name}</strong>?
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
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
