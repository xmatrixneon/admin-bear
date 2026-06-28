"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { formatDateTime } from "@/lib/utils";
import {
  Send,
  RefreshCw,
  Loader2,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Eye,
  Megaphone,
  Info,
  PartyPopper,
  TriangleAlert,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const typeConfig = {
  INFO: { icon: Info, color: "text-blue-600", bgColor: "bg-blue-500/10", label: "Info" },
  PROMO: { icon: PartyPopper, color: "text-green-600", bgColor: "bg-green-500/10", label: "Promo" },
  WARNING: { icon: TriangleAlert, color: "text-yellow-600", bgColor: "bg-yellow-500/10", label: "Warning" },
  URGENT: { icon: Ban, color: "text-red-600", bgColor: "bg-red-500/10", label: "Urgent" },
};

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return <Badge variant="outline" className="border-amber-500 text-amber-600">Pending</Badge>;
    case "SENDING":
      return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">Sending</Badge>;
    case "COMPLETED":
      return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Completed</Badge>;
    case "FAILED":
      return <Badge variant="destructive">Failed</Badge>;
    case "CANCELLED":
      return <Badge variant="secondary">Cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function BroadcastsPage() {
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState<any>(null);

  // Form state
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"INFO" | "PROMO" | "WARNING" | "URGENT">("INFO");
  const [targetAudience, setTargetAudience] = useState<"ALL" | "ACTIVE" | "BLOCKED" | "SUSPENDED">("ALL");
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");

  // Queries
  const { data: stats, refetch: refetchStats } = trpc.broadcasts.getStats.useQuery();
  const { data: audienceStats } = trpc.broadcasts.getAudienceStats.useQuery();
  const { data: broadcasts, refetch: refetchList } = trpc.broadcasts.list.useQuery({
    limit: 20,
  });

  const { data: broadcastDetails } = trpc.broadcasts.getById.useQuery(
    { id: selectedBroadcast?.id || "" },
    { enabled: !!selectedBroadcast && showDetailsDialog }
  );

  // Mutations
  const sendMutation = trpc.broadcasts.send.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setShowSendDialog(false);
      resetForm();
      refetchList();
      refetchStats();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const cancelMutation = trpc.broadcasts.cancel.useMutation({
    onSuccess: () => {
      toast.success("Broadcast cancelled successfully");
      refetchList();
      refetchStats();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.broadcasts.delete.useMutation({
    onSuccess: () => {
      toast.success("Broadcast deleted successfully");
      setShowDeleteDialog(false);
      setSelectedBroadcast(null);
      refetchList();
      refetchStats();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSend = () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    sendMutation.mutate({
      message: message.trim(),
      type,
      targetAudience,
      scheduledAt: scheduleMode ? scheduledAt : undefined,
    });
  };

  const handleCancel = (broadcastId: string) => {
    cancelMutation.mutate({ id: broadcastId });
  };

  const handleDelete = () => {
    if (selectedBroadcast) {
      deleteMutation.mutate({ id: selectedBroadcast.id });
    }
  };

  const resetForm = () => {
    setMessage("");
    setType("INFO");
    setTargetAudience("ALL");
    setScheduleMode(false);
    setScheduledAt("");
  };

  const getAudienceLabel = (audience: string) => {
    const labels = {
      ALL: "All Users",
      ACTIVE: "Active Users",
      BLOCKED: "Blocked Users",
      SUSPENDED: "Suspended Users",
    };
    return labels[audience as keyof typeof labels] || audience;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Broadcasts"
        description="Send notifications to users via Telegram"
        actions={
          <Button onClick={() => setShowSendDialog(true)} className="gap-2">
            <Send className="h-4 w-4" />
            New Broadcast
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Total Broadcasts"
          value={stats?.totalBroadcasts || 0}
          icon={Megaphone}
          color="text-blue-600"
          bgColor="bg-blue-500/10"
        />
        <StatsCard
          title="Pending"
          value={stats?.pendingBroadcasts || 0}
          icon={Clock}
          color="text-yellow-600"
          bgColor="bg-yellow-500/10"
        />
        <StatsCard
          title="Sending"
          value={stats?.sendingBroadcasts || 0}
          icon={RefreshCw}
          color="text-blue-600"
          bgColor="bg-blue-500/10"
        />
        <StatsCard
          title="Completed"
          value={stats?.completedBroadcasts || 0}
          icon={CheckCircle}
          color="text-green-600"
          bgColor="bg-green-500/10"
        />
        <StatsCard
          title="Failed"
          value={stats?.failedBroadcasts || 0}
          icon={XCircle}
          color="text-red-600"
          bgColor="bg-red-500/10"
        />
      </div>

      {/* Audience Stats */}
      <motion.div {...fadeUp(0.1)}>
        <Card className="border-border/50">
          <CardContent className="p-4 md:p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Audience Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">All Users</p>
                <p className="text-lg font-bold">{audienceStats?.all || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-lg font-bold">{audienceStats?.active || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Blocked</p>
                <p className="text-lg font-bold">{audienceStats?.blocked || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Suspended</p>
                <p className="text-lg font-bold">{audienceStats?.suspended || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Broadcasts List */}
      <motion.div {...fadeUp(0.2)}>
        <Card className="border-border/50">
          <div className="p-4 border-b border-border/50 flex items-center justify-between">
            <h3 className="font-semibold">Recent Broadcasts</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchList()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent/Failed</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {broadcasts?.broadcasts.map((broadcast: any) => {
                const config = typeConfig[broadcast.type as keyof typeof typeConfig];
                const TypeIcon = config.icon;
                return (
                  <TableRow key={broadcast.id}>
                    <TableCell>
                      <div className={`inline-flex p-2 rounded-lg ${config.bgColor} ${config.color}`}>
                        <TypeIcon className="h-4 w-4" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md truncate">
                        {broadcast.message}
                      </div>
                    </TableCell>
                    <TableCell>{getAudienceLabel(broadcast.targetAudience)}</TableCell>
                    <TableCell>{getStatusBadge(broadcast.status)}</TableCell>
                    <TableCell>
                      {broadcast.sentCount} / {broadcast.failedCount}
                    </TableCell>
                    <TableCell>
                      {formatDateTime(new Date(broadcast.createdAt))}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedBroadcast(broadcast);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {broadcast.status === "PENDING" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancel(broadcast.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {["COMPLETED", "FAILED", "CANCELLED"].includes(
                          broadcast.status
                        ) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedBroadcast(broadcast);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </motion.div>

      {/* Send Broadcast Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Broadcast</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Type */}
            <div className="space-y-2">
              <Label>Broadcast Type</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INFO">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-600" />
                      Info - General announcements
                    </div>
                  </SelectItem>
                  <SelectItem value="PROMO">
                    <div className="flex items-center gap-2">
                      <PartyPopper className="h-4 w-4 text-green-600" />
                      Promo - Special offers
                    </div>
                  </SelectItem>
                  <SelectItem value="WARNING">
                    <div className="flex items-center gap-2">
                      <TriangleAlert className="h-4 w-4 text-yellow-600" />
                      Warning - Important notices
                    </div>
                  </SelectItem>
                  <SelectItem value="URGENT">
                    <div className="flex items-center gap-2">
                      <Ban className="h-4 w-4 text-red-600" />
                      Urgent - Critical alerts
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select
                value={targetAudience}
                onValueChange={(v: any) => setTargetAudience(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">
                    All Users ({audienceStats?.all || 0})
                  </SelectItem>
                  <SelectItem value="ACTIVE">
                    Active Users ({audienceStats?.active || 0})
                  </SelectItem>
                  <SelectItem value="BLOCKED">
                    Blocked Users ({audienceStats?.blocked || 0})
                  </SelectItem>
                  <SelectItem value="SUSPENDED">
                    Suspended Users ({audienceStats?.suspended || 0})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Enter your broadcast message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                maxLength={4096}
              />
              <p className="text-xs text-muted-foreground">
                {message.length} / 4096 characters
              </p>
            </div>

            {/* Schedule */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="schedule"
                  checked={scheduleMode}
                  onChange={(e) => setScheduleMode(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="schedule" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Schedule for later
                </Label>
              </div>

              {scheduleMode && (
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full rounded border px-3 py-2"
                  min={new Date().toISOString().slice(0, 16)}
                />
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSendDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sendMutation.isPending || !message.trim()}
            >
              {sendMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {scheduleMode ? "Schedule" : "Send"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Broadcast Details</DialogTitle>
          </DialogHeader>

          {broadcastDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="font-medium">{broadcastDetails.type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p className="font-medium">{broadcastDetails.status}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Target Audience</Label>
                  <p className="font-medium">
                    {getAudienceLabel(broadcastDetails.targetAudience)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created By</Label>
                  <p className="font-medium">
                    {broadcastDetails.sentBy?.name ||
                      broadcastDetails.sentBy?.firstName ||
                      broadcastDetails.sentBy?.telegramUsername ||
                      "Unknown"}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Message</Label>
                <p className="p-3 bg-muted rounded-lg whitespace-pre-wrap">
                  {broadcastDetails.message}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-green-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {broadcastDetails.stats?.sent || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Sent</p>
                </div>
                <div className="text-center p-3 bg-red-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">
                    {broadcastDetails.stats?.failed || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">
                    {broadcastDetails.stats?.skipped || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Skipped</p>
                </div>
                <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">
                    {broadcastDetails.stats?.pending || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>

              {broadcastDetails.logs.length > 0 && (
                <div>
                  <Label>Recent Logs</Label>
                  <div className="max-h-60 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead>Error</TableHead>
                          <TableHead>Sent At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {broadcastDetails.logs.map((log: any) => (
                          <TableRow key={log.id}>
                            <TableCell>{log.status}</TableCell>
                            <TableCell className="max-w-xs truncate">
                              {log.errorMessage || "-"}
                            </TableCell>
                            <TableCell>
                              {log.sentAt
                                ? formatDateTime(new Date(log.sentAt))
                                : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Broadcast?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The broadcast and all its logs
              will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
