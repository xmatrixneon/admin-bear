import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "better-auth/next";
import { auth } from "@/lib/auth";
import { z } from "zod";

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
 * GET /api/admin/users - List users with filters
 */
export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;
  const filter = searchParams.get("filter") || "all";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");

  const { prisma } = await import("@/lib/db");

  // Build where clause
  const where: any = {
    deletedAt: filter === "deleted" ? { not: null } : null,
    isAdmin: filter === "admin" ? { equals: true } : filter === "regular" ? { equals: false } : undefined,
  };

  // Add search
  if (search && search.length >= 2) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { "telegramId": { contains: search } },
      { "telegramUsername": { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
    ];
  }

  // Get users with pagination
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        wallet: true,
        userData: true,
      },
      orderBy: { [sortBy]: sortOrder === "asc" ? "asc" : "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}

/**
 * PATCH /api/admin/users - Update user
 */
export async function PATCH(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const body = await req.json();
  const { prisma } = await import("@/lib/db");

  if (body.action === "setAdmin") {
    const { userId, isAdmin } = body;
    await prisma.user.update({
      where: { id: userId },
      data: { isAdmin },
    });
    return NextResponse.json({ success: true });
  }

  if (body.action === "setStatus") {
    const { userId, status } = body;
    await prisma.userData.upsert({
      where: { userId },
      create: { userId, status },
      update: { status },
    });
    return NextResponse.json({ success: true });
  }

  if (body.action === "adjustBalance") {
    const { userId, amount, reason, type } = body;
    const amountNum = parseFloat(amount);

    await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });

      if (!wallet) {
        await tx.wallet.create({
          data: { userId, balance: amountNum, totalSpent: 0, totalOtp: 0, totalRecharge: 0 },
        });
      } else {
        const newBalance = type === "debit"
          ? Number(wallet.balance) - amountNum
          : Number(wallet.balance) + amountNum;

        await tx.wallet.update({
          where: { userId },
          data: { balance: newBalance },
        });

        // Create transaction record
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: type === "credit" ? "ADJUSTMENT" : "ADJUSTMENT",
            amount: new Decimal(type === "debit" ? -amountNum : amountNum),
            status: "COMPLETED",
            description: reason,
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  }

  if (body.action === "delete") {
    const { userId, permanent, reason } = body;

    if (permanent) {
      await prisma.user.delete({ where: { id: userId } });
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: { deletedAt: new Date() },
      });
    }

    // Create audit log
    const session = await getServerSession(req);
    await prisma.userAuditLog.create({
      data: {
        userId,
        adminId: session.user.id,
        action: "DELETE",
        reason,
      },
    });

    return NextResponse.json({ success: true });
  }
}
