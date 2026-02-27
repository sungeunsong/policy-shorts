import { prisma } from "@/src/lib/prisma";
import { Card, CardBody, CardHeader } from "@/src/ui/Card";
import { Chip } from "@/src/ui/Chip";
import { RunNowClient } from "@/app/_components/RunNowClient";

export default async function DashboardPage() {
  const latestRun = await prisma.run.findFirst({
    orderBy: { startedAt: "desc" },
    include: { preset: true },
  });

  // AI Top5 (rank 있는 것)
  const aiTop5 = latestRun
    ? await prisma.candidate.findMany({
      where: { runId: latestRun.id, rank: { not: null } },
      orderBy: [{ rank: "asc" }],
      include: { item: { include: { source: true } } },
    })
    : [];

  // Rule 기반 Top10
  const candidates = latestRun
    ? await prisma.candidate.findMany({
      where: { runId: latestRun.id },
      orderBy: [{ totalScore: "desc" }],
      include: { item: { include: { source: true, judgment: true } } },
      take: 10,
    })
    : [];

  const maxScore = candidates[0]?.totalScore ?? 1;
  const isAiRun = latestRun?.aiUsed === true;

  return (
    <div className="space-y-6">

      {/* Run Now Card */}
      <Card>
        <CardBody>
          <div className="flex flex-col lg:flex-row lg:items-start gap-5 justify-between">
            {/* Status Info */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="text-lg font-bold text-white/90">Run Now</div>
                {latestRun && (
                  <Chip tone={
                    latestRun.status === "success" ? "good"
                      : latestRun.status === "failed" ? "danger"
                        : "neutral"
                  }>
                    {latestRun.status}
                  </Chip>
                )}
              </div>
              <div className="text-xs text-white/35">
                {latestRun ? (
                  <>
                    마지막 실행:{" "}
                    <span className="text-white/55">
                      {new Date(latestRun.startedAt).toLocaleString("ko-KR")}
                    </span>
                    {latestRun.preset && (
                      <> · 프리셋: <span className="text-white/55">{latestRun.preset.name}</span></>
                    )}
                  </>
                ) : (
                  "아직 실행 기록이 없습니다"
                )}
              </div>
            </div>

            <RunNowClient />
          </div>
        </CardBody>
      </Card>

      {/* AI Top5 카드 - AI Rank 실행 시에만 표시 */}
      {isAiRun && aiTop5.length > 0 && (
        <Card>
          <CardHeader
            title="🤖 AI Top 10"
            subtitle={`GPT가 선정한 쇼츠·블로그 소재 · ${latestRun?.preset?.name ?? ""}`}
            right={<Chip tone="accent">AI 선정</Chip>}
          />
          <CardBody className="py-2">
            <div className="space-y-1">
              {aiTop5.map((c) => {
                const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
                const medal = medals[(c.rank ?? 1) - 1] ?? `${c.rank}`;
                // reasons에서 ai: 접두사 항목 추출
                const reasons: string[] = (() => { try { return JSON.parse(c.reasonsJson ?? "[]"); } catch { return []; } })();
                const aiReason = reasons.find((r) => r.startsWith("ai:"))?.replace("ai:", "") ?? null;

                return (
                  <a
                    key={c.id}
                    href={c.item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 rounded-xl px-3 py-3 hover:bg-white/5 transition-colors group"
                  >
                    <div className="shrink-0 text-xl mt-0.5">{medal}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white/85 group-hover:text-white transition-colors leading-snug line-clamp-2">
                        {c.item.title}
                      </div>
                      {aiReason && (
                        <div className="text-xs text-indigo-300/70 mt-1 italic line-clamp-1">
                          💬 {aiReason}
                        </div>
                      )}
                      <div className="text-xs text-white/25 mt-1">{c.item.source.name}</div>
                    </div>
                    <div className="shrink-0 score-badge">{c.ruleScore}점</div>
                  </a>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Trending Card */}
        <Card>
          <CardHeader
            title="🔥 Trending Top 10"
            subtitle={latestRun?.preset ? `프리셋: ${latestRun.preset.name} · 룰 점수 기준` : "룰 점수 기준 상위 기사"}
          />
          <CardBody className="py-3">
            {candidates.length === 0 ? (
              <div className="py-8 flex flex-col items-center gap-3 text-center">
                <div className="text-3xl">📭</div>
                <div className="text-sm text-white/35">아직 결과가 없습니다.<br />Run Now를 눌러보세요.</div>
              </div>
            ) : (
              <div className="space-y-1">
                {candidates.map((c, i) => (
                  <a
                    key={c.id}
                    href={c.item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 rounded-xl px-3 py-3 hover:bg-white/5 transition-colors group"
                  >
                    {/* Rank */}
                    <div className="shrink-0 w-6 text-center text-xs font-bold mt-0.5"
                      style={{ color: i < 3 ? "#a5b4fc" : "rgba(255,255,255,0.2)" }}>
                      {i + 1}
                    </div>

                    {/* Title & Source */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white/80 leading-snug group-hover:text-white transition-colors line-clamp-2">
                        {c.item.title}
                      </div>
                      <div className="text-xs text-white/30 mt-1">{c.item.source.name}</div>
                    </div>

                    {/* Score Bar + Badge */}
                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <div className="score-badge">{c.totalScore}점</div>
                      <div className="w-16 h-1 rounded-full overflow-hidden bg-white/5">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.round((c.totalScore / maxScore) * 100)}%`,
                            background: "linear-gradient(90deg, #6366f1, #a855f7)",
                          }}
                        />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Next Steps Card */}
        <Card>
          <CardHeader title="🗺️ Next Steps" subtitle="바이브코딩으로 이어붙일 확장 포인트" />
          <CardBody>
            <ol className="space-y-3">
              {[
                { n: 1, text: "AI Rank 모드 구현", desc: "ruleScore 상위 N개만 GPT 판정 → totalScore → Top5 저장", done: false },
                { n: 2, text: "Sources 관리", desc: "소스 enable/disable + weight 조정 (현재 UI 있음)", done: true },
                { n: 3, text: "Runs 상세", desc: "소스별 성공/실패 + 캐시 히트율 표시", done: false },
                { n: 4, text: "키워드 웹 편집", desc: "프리셋 키워드/가중치 대시보드에서 직접 수정", done: false },
              ].map((item) => (
                <li key={item.n} className="flex gap-3">
                  <div className={`shrink-0 w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center mt-0.5 ${item.done
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                    : "bg-white/5 text-white/30 border border-white/8"
                    }`}>
                    {item.done ? "✓" : item.n}
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${item.done ? "text-white/40 line-through" : "text-white/80"}`}>
                      {item.text}
                    </div>
                    <div className="text-xs text-white/30 mt-0.5">{item.desc}</div>
                  </div>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
