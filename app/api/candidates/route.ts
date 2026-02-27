import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const runId = url.searchParams.get("runId") ?? "latest";

  let targetRunId = runId;
  if (runId === "latest") {
    const latest = await prisma.run.findFirst({ orderBy: { startedAt: "desc" } });
    if (!latest) return NextResponse.json({ run: null, candidates: [] });
    targetRunId = latest.id;
  }

  const candidates = await prisma.candidate.findMany({
    where: { runId: targetRunId },
    orderBy: [{ totalScore: "desc" }],
    include: { item: { include: { source: true, judgment: true } } },
    take: 300,
  });

  return NextResponse.json({ runId: targetRunId, candidates });
}
