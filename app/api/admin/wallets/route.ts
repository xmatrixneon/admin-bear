// app/api/admin/wallets/route.ts
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

  const wallets = await prisma.wallet.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          telegramUsername: true,
          firstName: true,
          lastName: true,
          isAdmin: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(wallets);
}