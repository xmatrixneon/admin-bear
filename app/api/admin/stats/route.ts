import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "better-auth/next";
import { auth } from "@/lib/auth";

/**
 * Admin middleware - checks if user has admin privileges
 */
async function requireAdmin(req: NextRequest) {
  const session = await getServerSession(req);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin by querying the database directly
  const { prisma } = await import("@/lib/db");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });

  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  return null; // Success
}

/**
 * GET /api/admin/stats - Get dashboard stats
 */
export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { prisma } = await import("@/lib/db");

  const [
    totalUsers,
    totalServices,
    totalServers,
    activeNumbers,
    totalWalletBalance,
    activePromocodes,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.service.count({ where: { isActive: true } }),
    prisma.otpServer.count({ where: { isActive: true } }),
    prisma.activeNumber.count({ where: { status: "PENDING" } }),
    prisma.wallet.aggregate({
      _sum: { balance: true },
    }),
    prisma.promocode.count({ where: { isActive: true } }),
  ]);

  const totalRevenue = await prisma.transaction.aggregate({
    where: {
      status: "COMPLETED",
      amount: { gt: 0 },
    },
    _sum: { amount: true },
  });

  const otpRevenue = await prisma.activeNumber.aggregate({
    where: { status: "COMPLETED" },
    _sum: { price: true },
  });

  return NextResponse.json({
    totalUsers,
    totalServices,
    totalServers,
    activeNumbers,
    totalWalletBalance: totalWalletBalance._sum.balance || 0,
    activePromocodes,
    totalRevenue: totalRevenue._sum.amount || 0,
    otpRevenue: otpRevenue._sum.price || 0,
  });
}
