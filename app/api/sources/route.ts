import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  const sources = await prisma.source.findMany({ orderBy: [{ weight: "desc" }, { name: "asc" }] });
  return NextResponse.json({ sources });
}

export async function POST(req: Request) {
  const body = await req.json();
  const created = await prisma.source.create({
    data: {
      name: body.name,
      sourceId: body.sourceId,
      type: body.type,
      url: body.url,
      enabled: Boolean(body.enabled ?? true),
      weight: Number(body.weight ?? 0),
    },
  });
  return NextResponse.json({ source: created });
}
