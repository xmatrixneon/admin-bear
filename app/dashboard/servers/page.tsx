"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Server, Plus, RefreshCw, Loader2, MoreVertical, Trash2, Edit, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { api } from "@/lib/api";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 280, damping: 24, delay },
});

export default function ServersPage() {
  const [activeTab, setActiveTab] = useState("servers");
  const [serverDialogOpen, setServerDialogOpen] = useState(false);
  const [apiDialogOpen, setApiDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [deleteType, setDeleteType] = useState<"server" | "api">("server");

  // Server form state
  const [serverForm, setServerForm] = useState({
    name: "",
    countryCode: "",
    apiCredentialId: "",
    flagUrl: "",
  });

  // API form state
  const [apiForm, setApiForm] = useState({
    name: "",
    apiUrl: "",
    apiKey: "",
  });

  const [servers, setServers] = useState<any[]>([]);
  const [apiCredentials, setApiCredentials] = useState<any[]>([]);
  const [serversLoading, setServersLoading] = useState(true);
  const [apiLoading, setApiLoading] = useState(true);

  const fetchServers = async () => {
    setServersLoading(true);
    try {
      const result = await api.getServers();
      setServers((result || []) as any);
    } catch (err: any) {
      console.error("Failed to fetch servers:", err);
      toast.error(err.message || "Failed to fetch servers");
    } finally {
      setServersLoading(false);
    }
  };

  const fetchApiCredentials = async () => {
    setApiLoading(true);
    try {
      // For now, we'll need to get this from the servers response
      // This is a placeholder - the API should have a separate endpoint
      setApiCredentials([] as any);
    } catch (err: any) {
      console.error("Failed to fetch API credentials:", err);
    } finally {
      setApiLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
    fetchApiCredentials();
  }, []);

  const handleCreateServer = async () => {
    try {
      await api.createServer(serverForm);
      toast.success("Server created successfully");
      setServerDialogOpen(false);
      setServerForm({ name: "", countryCode: "", apiCredentialId: "", flagUrl: "" });
      fetchServers();
    } catch (err: any) {
      toast.error(err.message || "Failed to create server");
    }
  };

  const handleUpdateServer = async () => {
    try {
      await api.updateServer(selectedItem.id, serverForm);
      toast.success("Server updated successfully");
      setServerDialogOpen(false);
      setSelectedItem(null);
      fetchServers();
    } catch (err: any) {
      toast.error(err.message || "Failed to update server");
    }
  };

  const handleDelete = async () => {
    try {
      if (deleteType === "server") {
        await api.deleteServer(selectedItem.id);
      } else {
        // API credential deletion - placeholder
      }
      toast.success(`${deleteType === "server" ? "Server" : "API credential"} deleted successfully`);
      setDeleteDialogOpen(false);
      setSelectedItem(null);
      fetchServers();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const openServerDialog = (server?: any) => {
    if (server) {
      setSelectedItem(server);
      setServerForm({
        name: server.name,
        countryCode: server.countryCode,
        apiCredentialId: server.apiId,
        flagUrl: server.flagUrl || "",
      });
    } else {
      setSelectedItem(null);
      setServerForm({ name: "", countryCode: "", apiCredentialId: "", flagUrl: "" });
    }
    setServerDialogOpen(true);
  };

  const openApiDialog = (api?: any) => {
    if (api) {
      setSelectedItem(api);
      setApiForm({
        name: api.name,
        apiUrl: api.apiUrl,
        apiKey: api.apiKey,
      });
    } else {
      setSelectedItem(null);
      setApiForm({ name: "", apiUrl: "", apiKey: "" });
    }
    setApiDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp()} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Servers & API Credentials</h1>
          <p className="text-sm text-muted-foreground">
            Manage OTP servers and API credentials
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { fetchServers(); fetchApiCredentials(); }} disabled={serversLoading || apiLoading}>
            {serversLoading || apiLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <RefreshCw size={16} className="mr-2" />}
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div {...fadeUp(0.05)}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="servers">Servers</TabsTrigger>
            <TabsTrigger value="api">API Credentials</TabsTrigger>
          </TabsList>

          {/* Servers Tab */}
          <TabsContent value="servers" className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => openServerDialog()}>
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
                    <TableHead>API</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead className="w-[60px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serversLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : servers?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <Server size={48} className="text-muted-foreground/40" />
                          <p className="text-muted-foreground">No servers found</p>
                          <Button size="sm" onClick={() => openServerDialog()}>
                            <Plus size={16} className="mr-2" />
                            Add First Server
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    servers?.map((server, index) => (
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
                          <Badge variant="outline">{server.countryIso} ({server.countryCode})</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{server.apiId || "-"}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={server.isActive ? "default" : "secondary"}>
                            {server.isActive ? "Active" : "Inactive"}
                          </Badge>
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
                              <DropdownMenuItem onClick={() => openServerDialog(server)}>
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
          </TabsContent>

          {/* API Credentials Tab */}
          <TabsContent value="api" className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => openApiDialog()}>
                <KeyRound size={16} className="mr-2" />
                Add API
              </Button>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>API URL</TableHead>
                    <TableHead>API Key</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
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
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : apiCredentials?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <KeyRound size={48} className="text-muted-foreground/40" />
                          <p className="text-muted-foreground">No API credentials found</p>
                          <Button size="sm" onClick={() => openApiDialog()}>
                            <KeyRound size={16} className="mr-2" />
                            Add First API
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    apiCredentials?.map((api, index) => (
                      <motion.tr
                        key={api.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + index * 0.02 }}
                        className="hover:bg-muted/50 transition-colors border-b"
                      >
                        <TableCell>
                          <span className="font-medium">{api.name}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                            {api.apiUrl}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                            {api.apiKey.slice(0, 8)}***
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={api.isActive ? "default" : "secondary"}>
                            {api.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(api.createdAt).toLocaleDateString()}
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
                              <DropdownMenuItem onClick={() => openApiDialog(api)}>
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
              <Label>Server Name</Label>
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
              <Label>API Credential</Label>
              <select
                className="w-full h-10 px-3 py-2 rounded-md border bg-background text-sm"
                value={serverForm.apiCredentialId}
                onChange={(e) => setServerForm({ ...serverForm, apiCredentialId: e.target.value })}
              >
                <option value="">Select API credential</option>
                {apiCredentials?.map((api) => (
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setServerDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={selectedItem ? handleUpdateServer : handleCreateServer}
              disabled={serversLoading}
            >
              {selectedItem ? "Update" : "Create"} Server
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API Dialog */}
      <Dialog open={apiDialogOpen} onOpenChange={setApiDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedItem ? "Edit API Credential" : "Add New API"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>API Name</Label>
              <Input
                placeholder="e.g., 5SIM, SMS-Activate"
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
                type="password"
                placeholder="••••••••"
                value={apiForm.apiKey}
                onChange={(e) => setApiForm({ ...apiForm, apiKey: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApiDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => { /* API credential actions - placeholder */ }}
            >
              {selectedItem ? "Update" : "Add"} API
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteType === "server" ? "Server" : "API Credential"}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedItem?.name}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
