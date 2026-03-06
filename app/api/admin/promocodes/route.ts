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
 * GET /api/admin/promocodes - List promocodes
 */
export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { prisma } = await import("@/lib/db");

  const promocodes = await prisma.promocode.findMany({
    include: {
      _count: {
        select: { history: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(promocodes);
}

/**
 * POST /api/admin/promocodes - Generate promocodes
 */
export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const body = await req.json();
  const { prisma } = await import("@/lib/db");

  const { amount, count, maxUses } = body;

  const promocodes = [];
  for (let i = 0; i < count; i++) {
    const code = `PROMO${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    promocodes.push(
      await prisma.promocode.create({
        data: {
          code,
          amount: parseFloat(amount),
          maxUses,
          usedCount: 0,
        },
      })
    );
  }

  return NextResponse.json(promocodes);
}

/**
 * PATCH /api/admin/promocodes - Update promocode
 */
export async function PATCH(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const body = await req.json();
  const { prisma } = await import("@/lib/db");
  const { id, action } = body;

  if (action === "activate") {
    await prisma.promocode.update({
      where: { id },
      data: { isActive: true },
    });
  } else if (action === "deactivate") {
    await prisma.promocode.update({
      where: { id },
      data: { isActive: false },
    });
  }

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/admin/promocodes - Delete promocode
 */
export async function DELETE(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const { prisma } = await import("@/lib/db");

  await prisma.promocode.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
