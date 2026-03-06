// app/api/admin/promocodes/route.ts
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

  const promocodes = await prisma.promocode.findMany({
    include: { _count: { select: { history: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(promocodes);
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { amount, count, maxUses } = await req.json();
  const promocodes = [];

  for (let i = 0; i < count; i++) {
    const code = `PROMO${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    promocodes.push(
      await prisma.promocode.create({
        data: { code, amount: parseFloat(amount), maxUses, usedCount: 0 },
      })
    );
  }

  return NextResponse.json(promocodes);
}

export async function PATCH(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, action } = await req.json();

  await prisma.promocode.update({
    where: { id },
    data: { isActive: action === "activate" },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.promocode.delete({ where: { id } });
  return NextResponse.json({ success: true });
}