import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "better-auth/next";
import { auth } from "@/lib/auth";

/**
 * Admin middleware
 */
async function requireAdmin(req: NextRequest) {
  const session = await getServerSession(req);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prisma } = await import("@/lib/db");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });

  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  return null;
}

/**
 * GET /api/admin/settings - Get settings
 */
export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { prisma } = await import("@/lib/db");

  const settings = await prisma.settings.findUnique({
    where: { id: "1" },
  });

  return NextResponse.json(settings);
}

/**
 * PATCH /api/admin/settings - Update settings
 */
export async function PATCH(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const body = await req.json();
  const { prisma } = await import("@/lib/db");

  const settings = await prisma.settings.update({
    where: { id: "1" },
    data: body,
  });

  // Create audit log
  const session = await getServerSession(req);
  await prisma.userAuditLog.create({
    data: {
      userId: "1", // Settings record ID
      adminId: session.user.id,
      action: "UPDATE",
      changes: body,
      reason: "Settings update",
    },
  });

  return NextResponse.json(settings);
}
