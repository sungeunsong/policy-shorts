import pLimit from "p-limit";
import { PrismaClient } from "@prisma/client";
import { fetchRss } from "./fetchRss";
import { fetchHtml } from "./fetchHtml";
import { sha1 } from "@/src/lib/hash";
import { computeRuleScore } from "./ruleScore";
import { windowStart } from "@/src/lib/time";
import type { NormalizedItem } from "./types";
import { getActivePresetId, loadPresetDict } from "./presetDict";
import { defaultKeywordDict } from "@/src/config/keywords";

const prisma = new PrismaClient();

function withinWindow(publishedAt: Date | null | undefined, start: Date): boolean {
  if (!publishedAt) return true;
  return publishedAt >= start;
}

export async function runCollectOnly(params: {
  runId: string;
  windowHours: number;
  maxItemsPerSource: number;
  fetchConcurrency: number;
  presetId?: string | null;
}) {
  const now = new Date();
  const start = windowStart(now, params.windowHours);

  const activePresetId = params.presetId ?? (await getActivePresetId());
  const { preset, dict } = await loadPresetDict(activePresetId);
  const keywordDict = dict ?? defaultKeywordDict;

  const allSources = await prisma.source.findMany({
    where: { enabled: true },
    orderBy: [{ weight: "desc" }, { name: "asc" }],
  });

  // presetSlugs가 null → 모든 프리셋에서 수집 (정부 공통 등)
  // presetSlugs가 있으면 활성 프리셋 slug 포함 여부 확인
  const sources = allSources.filter((s) => {
    if (!s.presetSlugs) return true; // null = 항상 포함
    if (!preset) return true;        // 프리셋 없으면 전체 수집
    const slugs = s.presetSlugs.split(",").map((x) => x.trim());
    return slugs.includes(preset.slug);
  });

  // 타임아웃 방지를 위해 클라이언트의 concurrency 옵션보다 더 넉넉하게 Vercel 환경에서 병렬 실행
  const limit = pLimit(10);

  const sourceResults = await Promise.all(
    sources.map((s) =>
      limit(async () => {
        try {
          const items: NormalizedItem[] =
            s.type === "rss"
              ? await fetchRss(s.sourceId, s.url, params.maxItemsPerSource)
              : await fetchHtml(s.sourceId, s.url, params.maxItemsPerSource);

          const filtered = items.filter((i) => withinWindow(i.publishedAt ?? null, start));
          return { sourceId: s.sourceId, ok: true, count: filtered.length, error: null, items: filtered };
        } catch (e) {
          return { sourceId: s.sourceId, ok: false, count: 0, error: String(e), items: [] };
        }
      })
    )
  );

  const all = sourceResults.flatMap((r) => r.items);

  // 중복 제거
  const byUrl = new Map<string, NormalizedItem>();
  for (const it of all) if (!byUrl.has(it.url)) byUrl.set(it.url, it);
  const deduped = [...byUrl.values()];

  // ── 소스 맵 캐시 (sourceId string → DB id) ──
  const sourceMap = new Map<string, string>();
  for (const s of allSources) sourceMap.set(s.sourceId, s.id);

  // ── 기존 Item 조회 (배치) ──
  const urls = deduped.map((i) => i.url);
  const existingItems = await prisma.item.findMany({
    where: { url: { in: urls } },
    select: { id: true, url: true },
  });
  const existingByUrl = new Map(existingItems.map((i) => [i.url, i.id]));

  // ── 새 Item INSERT (배치) ──
  const newItems = deduped.filter((i) => !existingByUrl.has(i.url) && sourceMap.has(i.sourceId));
  if (newItems.length > 0) {
    await prisma.item.createMany({
      data: newItems.map((it) => ({
        title: it.title,
        url: it.url,
        publishedAt: it.publishedAt ?? null,
        summary: it.summary ?? null,
        contentText: it.contentText ?? null,
        hash: sha1(`${it.title}|${it.url}`),
        sourceId: sourceMap.get(it.sourceId)!,
      })),
      skipDuplicates: true,
    });
  }

  // ── 기존 Item UPDATE (순차 처리: Connection Pool 고갈 및 타임아웃 방지) ──
  const updateItems = deduped.filter((i) => existingByUrl.has(i.url) && sourceMap.has(i.sourceId));
  for (const it of updateItems) {
    await prisma.item.update({
      where: { url: it.url },
      data: {
        title: it.title,
        publishedAt: it.publishedAt ?? null,
        summary: it.summary ?? null,
        contentText: it.contentText ?? null,
        hash: sha1(`${it.title}|${it.url}`),
      },
    });
  }

  // ── 최종 Item 로드 (배치) ──
  const savedItems = await prisma.item.findMany({
    where: { url: { in: urls } },
    include: { source: true },
  });
  const itemByUrl = new Map(savedItems.map((i) => [i.url, i]));

  // ── Rule Score 계산 + Candidate upsert (배치) ──
  const candidateData = deduped
    .map((it) => {
      const item = itemByUrl.get(it.url);
      if (!item) return null;
      const rs = computeRuleScore({
        title: item.title,
        summary: item.summary,
        contentText: item.contentText,
        sourceId: it.sourceId,
        dict: keywordDict,
      });
      return {
        runId: params.runId,
        itemId: item.id,
        ruleScore: rs.ruleScore,
        totalScore: rs.ruleScore,
        reasonsJson: JSON.stringify(rs.reasons),
        rank: null as number | null,
      };
    })
    .filter(Boolean) as Array<{ runId: string; itemId: string; ruleScore: number; totalScore: number; reasonsJson: string; rank: number | null }>;

  // Candidate createMany (skipDuplicates)
  if (candidateData.length > 0) {
    await prisma.candidate.createMany({
      data: candidateData,
      skipDuplicates: true,
    });
  }

  const top = await prisma.candidate.findMany({
    where: { runId: params.runId },
    orderBy: [{ totalScore: "desc" }],
    take: 10,
    include: { item: { include: { source: true } } },
  });

  const summaryJson = JSON.stringify({
    preset: preset ? { id: preset.id, slug: preset.slug, name: preset.name } : null,
    windowHours: params.windowHours,
    sources: sourceResults.map((r) => ({ sourceId: r.sourceId, ok: r.ok, count: r.count, error: r.error })),
    totals: { fetched: all.length, deduped: byUrl.size, candidates: candidateData.length },
    trendingTop10: top.map((t) => ({ title: t.item.title, url: t.item.url, source: t.item.source.name, totalScore: t.totalScore })),
  });

  await prisma.run.update({
    where: { id: params.runId },
    data: { status: "success", endedAt: new Date(), summaryJson, presetId: preset?.id ?? null },
  });

  return { summaryJson: JSON.parse(summaryJson) };
}
