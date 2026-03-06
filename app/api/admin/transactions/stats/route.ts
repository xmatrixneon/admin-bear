// app/api/admin/transactions/stats/route.ts
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
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const dateFilter: any = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.lte = new Date(endDate);
  }

  const [totalCount, byType] = await Promise.all([
    prisma.transaction.count({ where: dateFilter }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: dateFilter,
      _count: true,
      _sum: { amount: true },
    }),
  ]);

  const byTypeMap = byType.reduce((acc: any, item) => {
    acc[item.type] = {
      count: item._count,
      amount: item._sum.amount || 0,
    };
    return acc;
  }, {});

  return NextResponse.json({
    total: totalCount,
    byType: byTypeMap,
  });
}
