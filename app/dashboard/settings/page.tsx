"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  RefreshCw,
  Save,
  Settings2,
  CreditCard,
  Clock,
  MessageCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

// ─── Types ────────────────────────────────────────────────────────────────────

type SettingsData = {
  currency: string;
  minRechargeAmount: number | string;
  maxRechargeAmount: number | string;
  referralPercent: number | string;
  minRedeem: number | string;
  numberExpiryMinutes: number | string;
  minCancelMinutes: number | string;
  maintenanceMode: boolean;
  upiId: string;
  bharatpeMerchantId: string;
  bharatpeToken: string;
  bharatpeQrImage: string;
  telegramSupportUsername: string;
  apiDocsBaseUrl: string;
};

type SectionKey = "general" | "limits" | "timing" | "payment" | "support";

// ─── Animation ────────────────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 300, damping: 26, delay },
});

// ─── Field config — each section declares its own fields ─────────────────────

const SECTIONS: {
  key: SectionKey;
  title: string;
  icon: React.ReactNode;
  description: string;
  fields: {
    key: keyof SettingsData;
    label: string;
    type?: "text" | "number" | "password" | "url" | "switch";
    placeholder?: string;
    hint?: string;
  }[];
}[] = [
  {
    key: "general",
    title: "General",
    icon: <Settings2 size={16} />,
    description: "Platform-wide defaults",
    fields: [
      { key: "currency", label: "Currency", placeholder: "INR", hint: "3-letter ISO code" },
      { key: "maintenanceMode", label: "Maintenance Mode", type: "switch", hint: "Blocks all user activity when enabled" },
    ],
  },
  {
    key: "limits",
    title: "Recharge & Redeem",
    icon: <CreditCard size={16} />,
    description: "Amounts and referral settings",
    fields: [
      { key: "minRechargeAmount", label: "Min Recharge (₹)", type: "number", placeholder: "10" },
      { key: "maxRechargeAmount", label: "Max Recharge (₹)", type: "number", placeholder: "5000" },
      { key: "minRedeem", label: "Min Redeem (₹)", type: "number", placeholder: "0" },
      { key: "referralPercent", label: "Referral %", type: "number", placeholder: "0", hint: "Percentage credited on referral recharge" },
    ],
  },
  {
    key: "timing",
    title: "Timing",
    icon: <Clock size={16} />,
    description: "Expiry and cancellation windows",
    fields: [
      { key: "numberExpiryMinutes", label: "Number Expiry (min)", type: "number", placeholder: "20" },
      { key: "minCancelMinutes", label: "Min Cancel Window (min)", type: "number", placeholder: "2" },
    ],
  },
  {
    key: "payment",
    title: "Payment / BharatPe",
    icon: <CreditCard size={16} />,
    description: "UPI and BharatPe credentials",
    fields: [
      { key: "upiId", label: "UPI ID", placeholder: "BHARATPE.xxx@fbpe" },
      { key: "bharatpeMerchantId", label: "Merchant ID", placeholder: "57113736" },
      { key: "bharatpeToken", label: "BharatPe Token", type: "password", placeholder: "••••••••••••" },
      { key: "bharatpeQrImage", label: "QR Image URL", type: "url", placeholder: "https://i.ibb.co/..." },
    ],
  },
  {
    key: "support",
    title: "Support & API",
    icon: <MessageCircle size={16} />,
    description: "Telegram and developer settings",
    fields: [
      { key: "telegramSupportUsername", label: "Telegram Username", placeholder: "meowsmsxbot", hint: "Without the @ sign" },
      { key: "apiDocsBaseUrl", label: "API Docs Base URL", type: "url", placeholder: "https://yourdomain.com" },
    ],
  },
];

// ─── Individual Section Card ──────────────────────────────────────────────────

function SettingSection({
  section,
  globalSettings,
  onSave,
  delay,
}: {
  section: (typeof SECTIONS)[number];
  globalSettings: SettingsData;
  onSave: (fields: Partial<SettingsData>) => Promise<void>;
  delay: number;
}) {
  // Local state — only this section's fields
  const initialLocal = useCallback(() => {
    const obj: Partial<SettingsData> = {};
    section.fields.forEach(({ key }) => {
      (obj as Record<string, unknown>)[key] = globalSettings[key];
    });
    return obj;
  }, [globalSettings, section.fields]);

  const [local, setLocal] = useState<Partial<SettingsData>>(initialLocal);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Re-sync when global settings change (e.g. after refresh)
  useEffect(() => {
    setLocal(initialLocal());
  }, [initialLocal]);

  const isDirty = section.fields.some(
    ({ key }) => String(local[key]) !== String(globalSettings[key])
  );

  const handleChange = (key: keyof SettingsData, value: string | boolean) => {
    setSaved(false);
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(local);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div {...fadeUp(delay)}>
      <Card className="overflow-hidden border-border/60 shadow-sm">
        <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-muted-foreground">{section.icon}</span>
              <div>
                <CardTitle className="text-sm font-semibold leading-none">{section.title}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{section.description}</p>
              </div>
            </div>
            {isDirty && (
              <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 bg-amber-50">
                Unsaved
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-4 pb-4 space-y-4">
          {section.fields.map(({ key, label, type = "text", placeholder, hint }) => {
            const value = local[key];

            if (type === "switch") {
              return (
                <div key={key} className="flex items-center justify-between py-1">
                  <div>
                    <Label className="text-sm font-medium">{label}</Label>
                    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
                  </div>
                  <Switch
                    checked={!!value}
                    onCheckedChange={(checked) => handleChange(key, checked)}
                  />
                </div>
              );
            }

            return (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground/80">{label}</Label>
                <Input
                  type={type}
                  value={value !== undefined && value !== null ? String(value) : ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  className="h-8 text-sm"
                />
                {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
              </div>
            );
          })}
        </CardContent>

        <div className="px-6 pb-4 flex justify-end">
          <Button
            size="sm"
            variant={isDirty ? "default" : "outline"}
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="h-8 text-xs gap-1.5 min-w-[110px]"
          >
            {saving ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Saving…
              </>
            ) : saved ? (
              <>
                <CheckCircle2 size={12} className="text-green-500" />
                Saved
              </>
            ) : (
              <>
                <Save size={12} />
                Save {section.title}
              </>
            )}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  // tRPC query for fetching settings
  const { data: rawSettings, isLoading, refetch, isFetching } = trpc.settings.get.useQuery();

  // Convert Decimal values to numbers for the UI
  const settings: SettingsData | null = rawSettings ? {
    currency: rawSettings.currency || '',
    minRechargeAmount: Number(rawSettings.minRechargeAmount),
    maxRechargeAmount: Number(rawSettings.maxRechargeAmount),
    referralPercent: Number(rawSettings.referralPercent),
    minRedeem: Number(rawSettings.minRedeem),
    numberExpiryMinutes: rawSettings.numberExpiryMinutes || 0,
    minCancelMinutes: rawSettings.minCancelMinutes || 0,
    maintenanceMode: rawSettings.maintenanceMode || false,
    upiId: rawSettings.upiId || '',
    bharatpeMerchantId: rawSettings.bharatpeMerchantId || '',
    bharatpeToken: rawSettings.bharatpeToken || '',
    bharatpeQrImage: rawSettings.bharatpeQrImage || '',
    telegramSupportUsername: rawSettings.telegramSupportUsername || '',
    apiDocsBaseUrl: rawSettings.apiDocsBaseUrl || '',
  } : null;

  // tRPC mutation for updating settings
  const updateSettingsMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Saved successfully");
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save");
    },
  });

  // Called by each section with only its own changed fields
  const handleSectionSave = async (partial: Partial<SettingsData>) => {
    await updateSettingsMutation.mutateAsync(partial as any);
  };

  if (isLoading || !settings) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-52" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <motion.div {...fadeUp()} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-foreground">Settings</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Edit any section and save independently — no need to fill everything.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-8 text-xs gap-1.5 shrink-0"
        >
          {isFetching ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <RefreshCw size={12} />
          )}
          Refresh
        </Button>
      </motion.div>

      {/* Sections grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {SECTIONS.map((section, i) => (
          <SettingSection
            key={section.key}
            section={section}
            globalSettings={settings}
            onSave={handleSectionSave}
            delay={0.05 * (i + 1)}
          />
        ))}
      </div>
    </div>
  );
}