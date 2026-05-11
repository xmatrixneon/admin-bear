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
  Megaphone,
  Gauge,
  Bitcoin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/admin/page-header";

// ─── Types ────────────────────────────────────────────────────────────────────

type SettingsData = {
  currency: string;
  minRechargeAmount: number | string;
  maxRechargeAmount: number | string;
  referralPercent: number | string;
  referredUserPercent: number | string;
  minReferralDeposit: number | string;
  minRedeem: number | string;
  numberExpiryMinutes: number | string;
  minCancelMinutes: number | string;
  maxDiscountPercent: number | string;
  maxPromoAmount: number | string;
  maintenanceMode: boolean;
  upiId: string;
  bharatpeMerchantId: string;
  bharatpeToken: string;
  bharatpeQrImage: string;
  telegramSupportUsername: string;
  telegramChannelUrl: string;
  apiDocsBaseUrl: string;
  // API rate limiting
  apiRateLimit: number;
  // Announcement banner
  announcementEnabled: boolean;
  announcementMessage: string;
  announcementType: string;
  // App branding
  appVersion: string;
  builtWithText: string;
  // Crypto payments (Heleket)
  cryptoEnabled: boolean;
  cryptoSupportedCoins: string[];
  cryptoMinAmount: number;
  cryptoMaxAmount: number;
  cryptoTargetCurrency: string;
  cryptoAccuracyPercent: number;
  cryptoAllowMultiple: boolean;
  heleketApiKey: string;
  heleketMerchantId: string;
  heleketAllowedIps: string[];
  usdToInrRate: number | null;
  cryptoBonusPercent: number;
  cryptoReferralBonusEnabled: boolean;
};

type SectionKey = "general" | "limits" | "timing" | "payment" | "crypto" | "api" | "support" | "announcement" | "branding" | "channel";

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
    type?: "text" | "number" | "password" | "url" | "switch" | "textarea" | "select";
    placeholder?: string;
    hint?: string;
    options?: string[];
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
      { key: "referralPercent", label: "Referral % (Referrer)", type: "number", placeholder: "2", hint: "Bonus % for referrer when referred user deposits" },
      { key: "referredUserPercent", label: "Referral % (New User)", type: "number", placeholder: "1", hint: "Welcome bonus % for referred user on first deposit" },
      { key: "minReferralDeposit", label: "Min Deposit for Referral (₹)", type: "number", placeholder: "100", hint: "Minimum deposit amount to trigger referral bonus" },
      { key: "maxPromoAmount", label: "Max Promo Amount (₹)", type: "number", placeholder: "5000", hint: "Maximum amount for a single promo code" },
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
    key: "crypto",
    title: "Crypto / Heleket",
    icon: <Bitcoin size={16} />,
    description: "Heleket crypto payment gateway settings",
    fields: [
      { key: "cryptoEnabled", label: "Enable Crypto Payments", type: "switch", hint: "Enable users to deposit via cryptocurrency" },
      { key: "cryptoMinAmount", label: "Min Deposit (₹)", type: "number", placeholder: "100" },
      { key: "cryptoMaxAmount", label: "Max Deposit (₹)", type: "number", placeholder: "50000" },
      { key: "cryptoTargetCurrency", label: "Target Currency", placeholder: "USDT", hint: "Auto-convert all payments to this currency (USDT, USDC, BTC, etc.)" },
      { key: "cryptoAccuracyPercent", label: "Payment Tolerance (%)", type: "number", placeholder: "1", hint: "Allow payment variation % for network fees (0-5%)" },
      { key: "cryptoAllowMultiple", label: "Allow Partial Payments", type: "switch", hint: "Allow users to pay remaining amount if first payment is insufficient" },
      { key: "heleketMerchantId", label: "Heleket Merchant ID", placeholder: "1c1a0744-8e75-4e54-82fe-38db2b3bebdb", hint: "Your Heleket merchant UUID" },
      { key: "heleketApiKey", label: "Heleket API Key", type: "password", placeholder: "••••••••••••", hint: "Your Heleket API key for signature verification" },
      { key: "heleketAllowedIps", label: "Allowed IPs", type: "textarea", placeholder: '["31.133.220.8"]', hint: "JSON array of allowed IP addresses for Heleket webhooks (empty = allow all)" },
      { key: "usdToInrRate", label: "USD to INR Rate", type: "number", placeholder: "94.57", hint: "Fixed exchange rate for USD to INR conversion (empty = use live API rate)" },
      { key: "cryptoBonusPercent", label: "Bonus Percent", type: "number", placeholder: "5", hint: "Bonus percentage added to crypto deposits (0-100%)" },
      { key: "cryptoReferralBonusEnabled", label: "Enable Referral Bonus", type: "switch", hint: "Apply referral bonus to crypto deposits" },
      { key: "cryptoSupportedCoins", label: "Supported Coins", type: "textarea", placeholder: '["BTC", "ETH", "USDT", "USDC"]', hint: "JSON array of supported cryptocurrencies (for UI display)" },
    ],
  },
  {
    key: "api",
    title: "API Rate Limit",
    icon: <Gauge size={16} />,
    description: "External API rate limiting per user",
    fields: [
      { key: "apiRateLimit", label: "Requests Per Second", type: "number", placeholder: "100", hint: "Max API requests per second per user (default: 100)" },
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
  {
    key: "channel",
    title: "Join Channel",
    icon: <MessageCircle size={16} />,
    description: "Telegram channel join link",
    fields: [
      { key: "telegramChannelUrl", label: "Channel URL", type: "url", placeholder: "https://t.me/+xxxxxx", hint: "Join channel link shown in bot /start" },
    ],
  },
  {
    key: "announcement",
    title: "Announcement Banner",
    icon: <Megaphone size={16} />,
    description: "Show announcements to users on the home page",
    fields: [
      { key: "announcementEnabled", label: "Enable Announcement", type: "switch", hint: "Show announcement banner on home page" },
      { key: "announcementMessage", label: "Message", type: "textarea", placeholder: "Enter your announcement message here...", hint: "Supports plain text and emojis" },
      { key: "announcementType", label: "Type", type: "select", options: ["info", "warning", "success", "error"], hint: "info (blue) | warning (amber) | success (green) | error (red)" },
    ],
  },
  {
    key: "branding",
    title: "App Branding",
    icon: <Settings2 size={16} />,
    description: "Version and branding text shown on profile page",
    fields: [
      { key: "appVersion", label: "App Version", placeholder: "v1.0.0", hint: "Version displayed on profile page" },
      { key: "builtWithText", label: "Built With Text", placeholder: "Built with ❤️", hint: "Branding text shown next to version" },
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
          {section.fields.map(({ key, label, type = "text", placeholder, hint, options }) => {
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

            if (type === "textarea") {
              return (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground/80">{label}</Label>
                  <Textarea
                    value={value !== undefined && value !== null ? String(value) : ""}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={placeholder}
                    className="min-h-[80px] text-sm resize-y"
                  />
                  {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
                </div>
              );
            }

            if (type === "select") {
              return (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground/80">{label}</Label>
                  <select
                    value={value !== undefined && value !== null ? String(value) : options?.[0] || ""}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
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
    referredUserPercent: Number(rawSettings.referredUserPercent ?? 1),
    minReferralDeposit: Number(rawSettings.minReferralDeposit ?? 100),
    minRedeem: Number(rawSettings.minRedeem),
    numberExpiryMinutes: rawSettings.numberExpiryMinutes || 0,
    minCancelMinutes: rawSettings.minCancelMinutes || 0,
    maxDiscountPercent: Number(rawSettings.maxDiscountPercent || 20),
    maxPromoAmount: Number(rawSettings.maxPromoAmount || 5000),
    maintenanceMode: rawSettings.maintenanceMode || false,
    upiId: rawSettings.upiId || '',
    bharatpeMerchantId: rawSettings.bharatpeMerchantId || '',
    bharatpeToken: rawSettings.bharatpeToken || '',
    bharatpeQrImage: rawSettings.bharatpeQrImage || '',
    telegramSupportUsername: rawSettings.telegramSupportUsername || '',
    telegramChannelUrl: rawSettings.telegramChannelUrl || '',
    apiDocsBaseUrl: rawSettings.apiDocsBaseUrl || '',
    // API rate limiting
    apiRateLimit: Number(rawSettings.apiRateLimit || 100),
    // Announcement banner
    announcementEnabled: rawSettings.announcementEnabled || false,
    announcementMessage: rawSettings.announcementMessage || '',
    announcementType: rawSettings.announcementType || 'info',
    // App branding
    appVersion: rawSettings.appVersion || 'v1.0.0',
    builtWithText: rawSettings.builtWithText || 'Built with 🇷🇺',
    // Crypto payments (Heleket)
    cryptoEnabled: rawSettings.cryptoEnabled || false,
    cryptoSupportedCoins: rawSettings.cryptoSupportedCoins as string[] || ['BTC', 'ETH', 'USDT', 'USDC'],
    cryptoMinAmount: Number(rawSettings.cryptoMinAmount ?? 100),
    cryptoMaxAmount: Number(rawSettings.cryptoMaxAmount ?? 50000),
    cryptoTargetCurrency: rawSettings.cryptoTargetCurrency || 'USDT',
    cryptoAccuracyPercent: Number(rawSettings.cryptoAccuracyPercent ?? 1),
    cryptoAllowMultiple: rawSettings.cryptoAllowMultiple || false,
    heleketApiKey: rawSettings.heleketApiKey || '',
    heleketMerchantId: rawSettings.heleketMerchantId || '',
    heleketAllowedIps: rawSettings.heleketAllowedIps as string[] || [],
    usdToInrRate: rawSettings.usdToInrRate ? Number(rawSettings.usdToInrRate) : null,
    cryptoBonusPercent: Number(rawSettings.cryptoBonusPercent ?? 0),
    cryptoReferralBonusEnabled: rawSettings.cryptoReferralBonusEnabled ?? true,
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
    // Convert numeric string fields to actual numbers
    const numericFields = [
      'minRechargeAmount',
      'maxRechargeAmount',
      'referralPercent',
      'referredUserPercent',
      'minReferralDeposit',
      'minRedeem',
      'numberExpiryMinutes',
      'minCancelMinutes',
      'maxDiscountPercent',
      'maxPromoAmount',
      'apiRateLimit',
      'cryptoBonusPercent',
    ] as const;

    const converted = { ...partial } as Record<string, unknown>;
    for (const key of numericFields) {
      if (key in converted && typeof converted[key] === 'string') {
        converted[key] = parseFloat(converted[key] as string) || 0;
      }
    }

    // Handle usdToInrRate - convert empty string to null
    if ('usdToInrRate' in converted) {
      const val = converted.usdToInrRate;
      if (val === '' || val === null || val === undefined) {
        converted.usdToInrRate = null;
      } else if (typeof val === 'string') {
        converted.usdToInrRate = parseFloat(val) || null;
      }
    }

    // Parse heleketAllowedIps from JSON string if needed
    if ('heleketAllowedIps' in converted && typeof converted.heleketAllowedIps === 'string') {
      try {
        converted.heleketAllowedIps = JSON.parse(converted.heleketAllowedIps as string);
      } catch {
        // If parse fails, treat as empty array
        converted.heleketAllowedIps = [];
      }
    }

    await updateSettingsMutation.mutateAsync(converted as any);
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
      <PageHeader
        title="Settings"
        description="Edit any section and save independently — no need to fill everything."
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Refresh
          </Button>
        }
      />

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