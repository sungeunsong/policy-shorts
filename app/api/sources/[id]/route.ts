import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const body = await req.json();
  const updated = await prisma.source.update({
    where: { id },
    data: {
      name: body.name,
      type: body.type,
      url: body.url,
      enabled: typeof body.enabled === "boolean" ? body.enabled : undefined,
      weight: typeof body.weight === "number" ? body.weight : body.weight !== undefined ? Number(body.weight) : undefined,
    },
  });
  return NextResponse.json({ source: updated });
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  await prisma.source.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
