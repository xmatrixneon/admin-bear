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
 * GET /api/admin/audit-logs - List audit logs
 */
export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || undefined;
  const action = searchParams.get("action") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "25");

  const { prisma } = await import("@/lib/db");

  const where: any = {};
  if (userId) {
    where.userId = userId;
  }
  if (action) {
    where.action = action;
  }

  const [logs, total] = await Promise.all([
    prisma.userAuditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            telegramUsername: true,
          },
        },
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            telegramUsername: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.userAuditLog.count({ where }),
  ]);

  return NextResponse.json({
    logs,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}
