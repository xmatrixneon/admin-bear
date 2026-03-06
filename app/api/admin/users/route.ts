// app/api/admin/users/route.ts
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
  const search = searchParams.get("search") || undefined;
  const filter = searchParams.get("filter") || "all";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");

  const where: any = {
    deletedAt: filter === "deleted" ? { not: null } : null,
    isAdmin: filter === "admin" ? true : filter === "regular" ? false : undefined,
  };

  if (search && search.length >= 2) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { telegramId: { contains: search } },
      { telegramUsername: { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { wallet: true, userData: true },
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

export async function PATCH(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (body.action === "setAdmin") {
    const { userId, isAdmin } = body;
    await prisma.user.update({ where: { id: userId }, data: { isAdmin } });
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
          data: {
            userId,
            balance: amountNum,
            totalSpent: 0,
            totalOtp: 0,
            totalRecharge: 0,
          },
        });
      } else {
        const newBalance =
          type === "debit"
            ? Number(wallet.balance) - amountNum
            : Number(wallet.balance) + amountNum;

        await tx.wallet.update({
          where: { userId },
          data: { balance: newBalance },
        });

        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: "ADJUSTMENT",
            amount: type === "debit" ? -amountNum : amountNum,
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

    // Get admin user from token
    const token = req.headers.get("Authorization")?.replace("Bearer ", "") || "";
    const decoded = JSON.parse(Buffer.from(token, "base64").toString());
    const adminId = decoded.id;

    if (permanent) {
      await prisma.user.delete({ where: { id: userId } });
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: { deletedAt: new Date() },
      });
    }

    await prisma.userAuditLog.create({
      data: { userId, adminId, action: "DELETE", reason },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}