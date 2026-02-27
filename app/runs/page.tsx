import { prisma } from "@/src/lib/prisma";
import { Card, CardBody } from "@/src/ui/Card";
import { Chip } from "@/src/ui/Chip";

export default async function RunsPage() {
  const runs = await prisma.run.findMany({
    orderBy: { startedAt: "desc" },
    take: 50,
    include: { preset: true },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white/90">Runs</h1>
        <p className="text-xs text-white/35 mt-1">최근 실행 히스토리 (최대 50개)</p>
      </div>

      <Card>
        <CardBody className="py-2">
          {runs.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-center">
              <div className="text-4xl">🕐</div>
              <div className="text-sm text-white/35">아직 실행 기록이 없습니다.</div>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {runs.map((r) => {
                const summary = (() => {
                  try { return r.summaryJson ? JSON.parse(r.summaryJson) : null; }
                  catch { return null; }
                })();

                const duration = r.endedAt
                  ? Math.round((new Date(r.endedAt).getTime() - new Date(r.startedAt).getTime()) / 1000)
                  : null;

                return (
                  <details key={r.id} className="group py-4 first:pt-2 last:pb-2">
                    <summary className="list-none flex items-start gap-3 cursor-pointer select-none">
                      {/* Status dot */}
                      <div className={`shrink-0 w-2.5 h-2.5 rounded-full mt-2 ${r.status === "success" ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                          : r.status === "failed" ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]"
                            : "bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.5)]"
                        }`} />

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-white/80">
                            {new Date(r.startedAt).toLocaleString("ko-KR")}
                          </span>
                          {r.preset && (
                            <Chip tone="accent">{r.preset.name}</Chip>
                          )}
                          <Chip tone={r.mode === "ai_rank" ? "accent" : "neutral"}>{r.mode}</Chip>
                          {duration !== null && (
                            <span className="text-xs text-white/25">{duration}s</span>
                          )}
                        </div>

                        {summary && (
                          <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-white/30">
                            <span>수집 <span className="text-white/50">{summary.totals?.fetched ?? "—"}</span></span>
                            <span>중복제거 <span className="text-white/50">{summary.totals?.deduped ?? "—"}</span></span>
                            <span>후보 <span className="text-white/50">{summary.totals?.candidates ?? "—"}</span></span>
                            <span>창 <span className="text-white/50">{r.windowHours}h</span></span>
                          </div>
                        )}
                      </div>

                      <Chip tone={
                        r.status === "success" ? "good"
                          : r.status === "failed" ? "danger"
                            : "warn"
                      }>
                        {r.status}
                      </Chip>
                    </summary>

                    {/* Detail: source breakdown + trending */}
                    {summary && (
                      <div className="mt-4 ml-6 space-y-4">
                        {/* Sources */}
                        {Array.isArray(summary.sources) && summary.sources.length > 0 && (
                          <div>
                            <div className="text-[11px] font-semibold text-white/25 uppercase tracking-wider mb-2">소스별 수집</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {summary.sources.map((s: { sourceId: string; ok: boolean; count: number; error?: string | null }) => (
                                <div key={s.sourceId}
                                  className="flex items-center justify-between rounded-lg px-3 py-2 text-xs bg-white/3 border border-white/5">
                                  <span className="text-white/50 font-mono truncate">{s.sourceId}</span>
                                  <div className="flex items-center gap-2 shrink-0 ml-2">
                                    <span className="text-white/30">{s.count}건</span>
                                    <span className={s.ok ? "text-emerald-400" : "text-red-400"}>
                                      {s.ok ? "✓" : "✕"}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Trending Top 10 */}
                        {Array.isArray(summary.trendingTop10) && summary.trendingTop10.length > 0 && (
                          <div>
                            <div className="text-[11px] font-semibold text-white/25 uppercase tracking-wider mb-2">Trending Top 10 (당시)</div>
                            <ol className="space-y-1">
                              {summary.trendingTop10.map((t: { title: string; url: string; source: string; totalScore: number }, ti: number) => (
                                <li key={ti} className="flex items-center gap-2 text-xs">
                                  <span className="text-white/20 w-4 text-right shrink-0">{ti + 1}</span>
                                  <a href={t.url} target="_blank" rel="noopener noreferrer"
                                    className="text-white/55 hover:text-white transition-colors truncate flex-1">
                                    {t.title}
                                  </a>
                                  <span className="score-badge shrink-0">{t.totalScore}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    )}
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
