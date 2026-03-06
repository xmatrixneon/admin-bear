// app/api/admin/audit-logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

function requireAdmin(req: NextRequest): boolean {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return false;
  return verifyAdminToken(token);
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || undefined;
  const action = searchParams.get("action") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "25");

  const where: any = {};
  if (userId) where.userId = userId;
  if (action) where.action = action;

  const [logs, total] = await Promise.all([
    prisma.userAuditLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, telegramUsername: true },
        },
        admin: {
          select: { id: true, firstName: true, lastName: true, telegramUsername: true },
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
    pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  });
}