"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Loader2, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 280, damping: 24, delay },
});

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    currency: "INR",
    minRechargeAmount: "10",
    maxRechargeAmount: "5000",
    referralPercent: "0",
    minRedeem: "0",
    numberExpiryMinutes: "20",
    minCancelMinutes: "2",
    maintenanceMode: false,
    upiId: "",
    bharatpeMerchantId: "",
    bharatpeToken: "",
    bharatpeQrImage: "",
    telegramSupportUsername: "",
    apiDocsBaseUrl: "",
  });

  const { data: settings, isLoading, refetch } = trpc.admin.settings.get.useQuery();

  const updateMutation = trpc.admin.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Settings updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update settings");
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        currency: settings.currency || "INR",
        minRechargeAmount: settings.minRechargeAmount?.toString() || "10",
        maxRechargeAmount: settings.maxRechargeAmount?.toString() || "5000",
        referralPercent: settings.referralPercent?.toString() || "0",
        minRedeem: settings.minRedeem?.toString() || "0",
        numberExpiryMinutes: settings.numberExpiryMinutes?.toString() || "20",
        minCancelMinutes: settings.minCancelMinutes?.toString() || "2",
        maintenanceMode: settings.maintenanceMode || false,
        upiId: settings.upiId || "",
        bharatpeMerchantId: settings.bharatpeMerchantId || "",
        bharatpeToken: settings.bharatpeToken || "",
        bharatpeQrImage: settings.bharatpeQrImage || "",
        telegramSupportUsername: settings.telegramSupportUsername || "",
        apiDocsBaseUrl: settings.apiDocsBaseUrl || "",
      });
    }
  }, [settings]);

  const handleSave = () => {
    updateMutation.mutate(formData as any);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp()} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage platform-wide settings
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
          <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* General Settings */}
        <motion.div {...fadeUp(0.1)}>
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Input
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  placeholder="INR"
                />
              </div>
              <div className="space-y-2">
                <Label>Min Recharge Amount</Label>
                <Input
                  type="number"
                  value={formData.minRechargeAmount}
                  onChange={(e) => setFormData({ ...formData, minRechargeAmount: e.target.value })}
                  placeholder="10"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Recharge Amount</Label>
                <Input
                  type="number"
                  value={formData.maxRechargeAmount}
                  onChange={(e) => setFormData({ ...formData, maxRechargeAmount: e.target.value })}
                  placeholder="5000"
                />
              </div>
              <div className="space-y-2">
                <Label>Referral Percent</Label>
                <Input
                  type="number"
                  value={formData.referralPercent}
                  onChange={(e) => setFormData({ ...formData, referralPercent: e.target.value })}
                  placeholder="0"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Number Settings */}
        <motion.div {...fadeUp(0.15)}>
          <Card>
            <CardHeader>
              <CardTitle>Number Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Number Expiry (minutes)</Label>
                <Input
                  type="number"
                  value={formData.numberExpiryMinutes}
                  onChange={(e) => setFormData({ ...formData, numberExpiryMinutes: e.target.value })}
                  placeholder="20"
                />
              </div>
              <div className="space-y-2">
                <Label>Min Cancel Time (minutes)</Label>
                <Input
                  type="number"
                  value={formData.minCancelMinutes}
                  onChange={(e) => setFormData({ ...formData, minCancelMinutes: e.target.value })}
                  placeholder="2"
                />
              </div>
              <div className="space-y-2">
                <Label>Min Redeem Amount</Label>
                <Input
                  type="number"
                  value={formData.minRedeem}
                  onChange={(e) => setFormData({ ...formData, minRedeem: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Maintenance Mode</Label>
                <Switch
                  checked={formData.maintenanceMode}
                  onCheckedChange={(checked) => setFormData({ ...formData, maintenanceMode: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Settings */}
        <motion.div {...fadeUp(0.2)}>
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>UPI ID</Label>
                <Input
                  value={formData.upiId}
                  onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                  placeholder="yourname@upi"
                />
              </div>
              <div className="space-y-2">
                <Label>BharatPe Merchant ID</Label>
                <Input
                  value={formData.bharatpeMerchantId}
                  onChange={(e) => setFormData({ ...formData, bharatpeMerchantId: e.target.value })}
                  placeholder="merchant_id"
                />
              </div>
              <div className="space-y-2">
                <Label>BharatPe Token</Label>
                <Input
                  type="password"
                  value={formData.bharatpeToken}
                  onChange={(e) => setFormData({ ...formData, bharatpeToken: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label>BharatPe QR Image URL</Label>
                <Input
                  value={formData.bharatpeQrImage}
                  onChange={(e) => setFormData({ ...formData, bharatpeQrImage: e.target.value })}
                  placeholder="https://example.com/qr.png"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Support & API Settings */}
        <motion.div {...fadeUp(0.25)}>
          <Card>
            <CardHeader>
              <CardTitle>Support & API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Telegram Support Username</Label>
                <Input
                  value={formData.telegramSupportUsername}
                  onChange={(e) => setFormData({ ...formData, telegramSupportUsername: e.target.value })}
                  placeholder="@support_bot"
                />
              </div>
              <div className="space-y-2">
                <Label>API Docs Base URL</Label>
                <Input
                  value={formData.apiDocsBaseUrl}
                  onChange={(e) => setFormData({ ...formData, apiDocsBaseUrl: e.target.value })}
                  placeholder="https://docs.example.com"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
