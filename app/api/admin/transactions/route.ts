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
 * GET /api/admin/transactions - List transactions with filters
 */
export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;
  const type = searchParams.get("type") || undefined;
  const status = searchParams.get("status") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "25");

  const { prisma } = await import("@/lib/db");

  const where: any = {};

  if (search && search.length >= 2) {
    where.OR = [
      { phoneNumber: { contains: search } },
      { txnId: { contains: search } },
    ];
  }

  if (type) {
    where.type = type;
  }

  if (status) {
    where.status = status;
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        wallet: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                telegramUsername: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({
    transactions,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}

/**
 * GET /api/admin/transactions/stats - Get transaction stats
 */
export async function GET_STATS(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  const { prisma } = await import("@/lib/db");

  const where: any = {
    status: "COMPLETED",
  };

  if (startDate) {
    where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
  }

  if (endDate) {
    where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
  }

  const transactions = await prisma.transaction.findMany({
    where,
    select: {
      type: true,
      amount: true,
      status: true,
    },
  });

  const stats = {
    total: transactions.length,
    byType: transactions.reduce((acc: any, tx) => {
      if (!acc[tx.type]) {
        acc[tx.type] = { count: 0, amount: 0 };
      }
      acc[tx.type].count++;
      acc[tx.type].amount = Number(acc[tx.type].amount) + Number(tx.amount);
      return acc;
    }, {}),
    byStatus: transactions.reduce((acc: any, tx) => {
      if (!acc[tx.status]) {
        acc[tx.status] = 0;
      }
      acc[tx.status]++;
      return acc;
    }, {}),
    totalAmount: transactions.reduce((sum, tx) => sum + Number(tx.amount), 0),
  };

  return NextResponse.json(stats);
}
