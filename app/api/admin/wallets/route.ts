import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "better-auth/next";

/**
 * GET /api/admin/wallets - List all wallets
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(req);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prisma } = await import("@/lib/db");

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
