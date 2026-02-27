import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const updated = await prisma.source.update({
    where: { id: params.id },
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

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.source.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
