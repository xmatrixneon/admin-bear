import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Fields that Prisma expects as Float — coerce from string if needed
const FLOAT_FIELDS = new Set([
  "minRechargeAmount",
  "maxRechargeAmount",
  "referralPercent",
  "minRedeem",
  "numberExpiryMinutes",
  "minCancelMinutes",
]);

const DEFAULT_SETTINGS = {
  currency: "INR",
  minRechargeAmount: 10,
  maxRechargeAmount: 5000,
  referralPercent: 0,
  minRedeem: 0,
  numberExpiryMinutes: 20,
  minCancelMinutes: 2,
  maintenanceMode: false,
  upiId: "",
  bharatpeMerchantId: "",
  bharatpeToken: "",
  bharatpeQrImage: "",
  telegramSupportUsername: "",
  apiDocsBaseUrl: "",
};

function requireAdmin(req: NextRequest): boolean {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return false;
  return verifyAdminToken(token);
}

function getAdminId(req: NextRequest): string {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "") || "";
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString());
    return decoded.id;
  } catch {
    return "unknown";
  }
}

/**
 * Coerce only the fields that were actually sent.
 * Fields not present in the body are left untouched in the DB.
 */
function coerceBody(raw: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (FLOAT_FIELDS.has(key)) {
      const num = parseFloat(value as string);
      result[key] = isNaN(num) ? 0 : num;
    } else {
      result[key] = value;
    }
  }
  return result;
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.settings.findUnique({ where: { id: "1" } });

  if (!settings) {
    return NextResponse.json({ id: "1", ...DEFAULT_SETTINGS });
  }

  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody: Record<string, unknown> = await req.json();
  const adminId = getAdminId(req);

  // Only the fields you sent — nothing more
  const updateData = coerceBody(rawBody);

  const settings = await prisma.settings.upsert({
    where: { id: "1" },
    // On first create, fall back to defaults for any field not supplied
    create: { id: "1", ...DEFAULT_SETTINGS, ...updateData },
    // On update, only touch what was sent
    update: updateData,
  });

  // Audit log
  try {
    const adminUser = await prisma.user.findFirst({ where: { isAdmin: true } });
    if (adminUser) {
      await prisma.userAuditLog.create({
        data: {
          userId: adminUser.id,
          adminId: adminId || adminUser.id,
          action: "UPDATE_SETTINGS",
          // line 107 — replace with this:
          changes: rawBody as Record<string, string | number | boolean | null>,
          reason: "Settings update",
        },
      });
    }
  } catch {
    // Don't fail the request if audit log fails
  }

  return NextResponse.json(settings);
}
