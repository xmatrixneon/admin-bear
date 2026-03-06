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
 * GET /api/admin/servers - List servers
 */
export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { prisma } = await import("@/lib/db");

  const servers = await prisma.otpServer.findMany({
    include: {
      api: true,
      _count: {
        select: { services: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(servers);
}

/**
 * POST /api/admin/servers - Create server
 */
export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const body = await req.json();
  const { prisma } = await import("@/lib/db");

  const server = await prisma.otpServer.create({
    data: body,
  });

  return NextResponse.json(server);
}

/**
 * PUT /api/admin/servers - Update server
 */
export async function PUT(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { id, ...data } = await req.json();
  const { prisma } = await import("@/lib/db");

  const server = await prisma.otpServer.update({
    where: { id },
    data,
  });

  return NextResponse.json(server);
}

/**
 * DELETE /api/admin/servers - Delete server
 */
export async function DELETE(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const { prisma } = await import("@/lib/db");

  await prisma.otpServer.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
