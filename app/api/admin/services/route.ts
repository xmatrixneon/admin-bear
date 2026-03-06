// app/api/admin/services/route.ts
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

  const services = await prisma.service.findMany({
    include: {
      server: { include: { api: true } },
      _count: { select: { purchases: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const service = await prisma.service.create({ data: body });
  return NextResponse.json(service);
}

export async function PUT(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, ...data } = await req.json();
  const service = await prisma.service.update({ where: { id }, data });
  return NextResponse.json(service);
}

export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.service.delete({ where: { id } });
  return NextResponse.json({ success: true });
}