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

  const limit = pLimit(params.fetchConcurrency);

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

  const byUrl = new Map();
  for (const it of all) if (!byUrl.has(it.url)) byUrl.set(it.url, it);

  const upsertedItems = [];
  for (const it of byUrl.values()) {
    const hash = sha1(`${it.title}|${it.url}`);
    const src = await prisma.source.findUnique({ where: { sourceId: it.sourceId } });
    if (!src) continue;

    const saved = await prisma.item.upsert({
      where: { url: it.url },
      update: {
        title: it.title,
        publishedAt: it.publishedAt ?? null,
        summary: it.summary ?? null,
        contentText: it.contentText ?? null,
        hash,
        sourceId: src.id,
      },
      create: {
        title: it.title,
        url: it.url,
        publishedAt: it.publishedAt ?? null,
        summary: it.summary ?? null,
        contentText: it.contentText ?? null,
        hash,
        sourceId: src.id,
      },
    });
    upsertedItems.push({ it, savedId: saved.id });
  }

  const candidates = [];
  for (const u of upsertedItems) {
    const item = await prisma.item.findUnique({ where: { id: u.savedId }, include: { source: true } });
    if (!item) continue;

    const rs = computeRuleScore({
      title: item.title,
      summary: item.summary,
      contentText: item.contentText,
      sourceId: u.it.sourceId,
      dict: keywordDict,
    });

    const totalScore = rs.ruleScore;
    const c = await prisma.candidate.upsert({
      where: { runId_itemId: { runId: params.runId, itemId: item.id } },
      update: { ruleScore: rs.ruleScore, totalScore, reasonsJson: JSON.stringify(rs.reasons), rank: null },
      create: { runId: params.runId, itemId: item.id, ruleScore: rs.ruleScore, totalScore, reasonsJson: JSON.stringify(rs.reasons), rank: null },
    });
    candidates.push(c);
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
    totals: { fetched: all.length, deduped: byUrl.size, candidates: candidates.length },
    trendingTop10: top.map((t) => ({ title: t.item.title, url: t.item.url, source: t.item.source.name, totalScore: t.totalScore })),
  });

  await prisma.run.update({
    where: { id: params.runId },
    data: { status: "success", endedAt: new Date(), summaryJson, presetId: preset?.id ?? null },
  });

  return { summaryJson: JSON.parse(summaryJson) };
}
