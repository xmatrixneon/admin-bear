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
 * GET /api/admin/services - List all services
 */
export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { prisma } = await import("@/lib/db");

  const services = await prisma.service.findMany({
    include: {
      server: {
        include: {
          api: true,
        },
      },
      _count: {
        select: { purchases: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(services);
}

/**
 * POST /api/admin/services - Create service
 */
export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const body = await req.json();
  const { prisma } = await import("@/lib/db");

  const service = await prisma.service.create({
    data: body,
  });

  return NextResponse.json(service);
}

/**
 * PUT /api/admin/services - Update service
 */
export async function PUT(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { id, ...data } = await req.json();
  const { prisma } = await import("@/lib/db");

  const service = await prisma.service.update({
    where: { id },
    data,
  });

  return NextResponse.json(service);
}

/**
 * DELETE /api/admin/services - Delete service
 */
export async function DELETE(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const { prisma } = await import("@/lib/db");

  await prisma.service.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
