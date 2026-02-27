import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  const runs = await prisma.run.findMany({ orderBy: { startedAt: "desc" }, take: 50 });
  return NextResponse.json({ runs });
}
