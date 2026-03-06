// app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Admin middleware - checks token from Authorization header
 */
function requireAdmin(req: NextRequest): boolean {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return false;
  return verifyAdminToken(token);
}

/**
 * GET /api/admin/stats - Get dashboard stats
 */
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  // Total Revenue: Only count SMS received (COMPLETED ActiveNumber)
  const totalRevenue = await prisma.activeNumber.aggregate({
    where: { status: "COMPLETED" },
    _sum: { price: true },
  });

  // Total Recharge: Only count DEPOSIT and PROMO transactions
  const totalRecharge = await prisma.transaction.aggregate({
    where: {
      status: "COMPLETED",
      type: { in: ["DEPOSIT", "PROMO"] },
    },
    _sum: { amount: true },
  });

  // OTP Revenue (same as totalRevenue - for compatibility)
  const otpRevenue = totalRevenue;

  return NextResponse.json({
    totalUsers,
    totalServices,
    totalServers,
    activeNumbers,
    totalWalletBalance: Number(totalWalletBalance._sum.balance || 0),
    activePromocodes,
    totalRevenue: Number(totalRevenue._sum.price || 0),
    otpRevenue: Number(otpRevenue._sum.price || 0),
    totalRecharge: Number(totalRecharge._sum.amount || 0),
  });
}