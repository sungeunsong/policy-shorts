import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { runCollectOnly } from "@/src/pipeline/runCollect";
import { runAiRank } from "@/src/pipeline/runAiRank";
import { getActivePresetId } from "@/src/pipeline/presetDict";

const prisma = new PrismaClient();

// Vercel 서버리스 함수 최대 실행 시간 (hobby: 60s, pro: 300s)
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const mode = (body.mode === "ai_rank" ? "ai_rank" : "collect_only") as "collect_only" | "ai_rank";
  const windowHours = Number(body.windowHours ?? process.env.WINDOW_HOURS ?? 24);
  const aiTopN = Number(body.aiTopN ?? 20);

  const presetId = typeof body.presetId === "string" ? body.presetId : await getActivePresetId();

  const run = await prisma.run.create({
    data: {
      mode,
      windowHours,
      presetId: presetId ?? null,
      aiRequested: mode === "ai_rank",
      aiTopN,
      status: "running",
    },
  });

  try {
    await runCollectOnly({
      runId: run.id,
      windowHours,
      maxItemsPerSource: Number(process.env.MAX_ITEMS_PER_SOURCE ?? 50),
      fetchConcurrency: Number(process.env.FETCH_CONCURRENCY ?? 3),
      presetId,
    });

    if (mode === "ai_rank") {
      // preset 정보 조회 (GPT 프롬프트에 주제 맥락 제공)
      const runData = await prisma.run.findUnique({
        where: { id: run.id },
        include: { preset: true },
      });
      const presetName = runData?.preset?.name ?? "정책·제도";
      const presetDescription = runData?.preset?.description ?? null;

      const aiResult = await runAiRank({
        runId: run.id,
        presetName,
        presetDescription,
      });

      console.log(
        `[AI Rank] 완료: ${aiResult.model}, 토큰: ${aiResult.tokensUsed}, Top10: ${aiResult.top10.map((t) => t.rank).join(",")}`
      );
    }

    const updated = await prisma.run.findUnique({ where: { id: run.id }, include: { preset: true } });
    return NextResponse.json({ run: updated });
  } catch (e) {
    await prisma.run.update({
      where: { id: run.id },
      data: { status: "failed", endedAt: new Date(), summaryJson: JSON.stringify({ error: String(e) }) },
    });
    return NextResponse.json({ error: String(e), runId: run.id }, { status: 500 });
  }
}
