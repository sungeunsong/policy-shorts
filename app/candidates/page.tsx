import { prisma } from "@/src/lib/prisma";
import { Card, CardBody, CardHeader } from "@/src/ui/Card";
import { Chip } from "@/src/ui/Chip";

export const dynamic = "force-dynamic";

export default async function CandidatesPage() {
  const latestRun = await prisma.run.findFirst({
    orderBy: { startedAt: "desc" },
    include: { preset: true },
  });

  const candidates = latestRun
    ? await prisma.candidate.findMany({
      where: { runId: latestRun.id },
      orderBy: [{ totalScore: "desc" }],
      include: { item: { include: { source: true, judgment: true } } },
      take: 300,
    })
    : [];

  const maxScore = candidates[0]?.totalScore ?? 1;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white/90">Candidates</h1>
          <p className="text-xs text-white/35 mt-1">
            {latestRun
              ? `최근 실행 · ${new Date(latestRun.startedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}${latestRun.preset ? ` · ${latestRun.preset.name}` : ""}`
              : "아직 실행 기록이 없습니다"}
          </p>
        </div>
        <Chip tone={candidates.length > 0 ? "accent" : "neutral"}>
          {candidates.length}개
        </Chip>
      </div>

      <Card>
        <CardBody className="py-2">
          {candidates.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-center">
              <div className="text-4xl">📭</div>
              <div className="text-sm text-white/35">데이터가 없습니다.<br />Dashboard에서 Run Now를 눌러보세요.</div>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {candidates.map((c, i) => {
                const reasons = (() => {
                  try { return JSON.parse(c.reasonsJson ?? "[]") as string[]; }
                  catch { return []; }
                })();

                return (
                  <details key={c.id} className="group py-4 first:pt-2 last:pb-2">
                    <summary className="list-none flex items-start gap-3 cursor-pointer">
                      {/* Rank */}
                      <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold mt-0.5"
                        style={{
                          background: i < 3 ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)",
                          color: i < 3 ? "#a5b4fc" : "rgba(255,255,255,0.25)",
                          border: i < 3 ? "1px solid rgba(99,102,241,0.25)" : "1px solid rgba(255,255,255,0.06)",
                        }}>
                        {i + 1}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <a
                          href={c.item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-white/80 hover:text-white transition-colors leading-snug line-clamp-2"
                        >
                          {c.item.title}
                        </a>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className="text-xs text-white/30">{c.item.source.name}</span>
                          {c.item.publishedAt && (
                            <>
                              <span className="text-white/15">·</span>
                              <span className="text-xs text-white/25">
                                {new Date(c.item.publishedAt).toLocaleDateString("ko-KR")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Scores */}
                      <div className="shrink-0 flex flex-col items-end gap-1.5 ml-2">
                        <div className="score-badge">{c.totalScore}</div>
                        <div className="w-20 h-1 rounded-full overflow-hidden bg-white/5">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.round((c.totalScore / maxScore) * 100)}%`,
                              background: "linear-gradient(90deg, #6366f1, #a855f7)",
                            }}
                          />
                        </div>
                        <div className="text-[10px] text-white/20 group-open:rotate-180 transition-transform">▾</div>
                      </div>
                    </summary>

                    {/* Expanded: Reasons */}
                    <div className="mt-3 pl-9">
                      <div className="flex flex-wrap gap-1.5">
                        {reasons.length === 0 ? (
                          <span className="text-xs text-white/25">reasons 없음</span>
                        ) : (
                          reasons.map((r, ri) => (
                            <span
                              key={ri}
                              className={`text-xs px-2 py-0.5 rounded-md font-mono ${r.startsWith("bonus") ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                                : r.startsWith("cap") ? "bg-amber-500/10 text-amber-400 border border-amber-500/15"
                                  : r.includes("-") ? "bg-red-500/10 text-red-400 border border-red-500/15"
                                    : "bg-indigo-500/10 text-indigo-300 border border-indigo-500/15"
                                }`}
                            >
                              {r}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
