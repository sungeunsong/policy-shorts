import Parser from "rss-parser";
import { normalizeText } from "@/src/lib/text";
import type { NormalizedItem } from "./types";

const parser: Parser = new Parser({
  timeout: 10_000,
  headers: { "User-Agent": process.env.USER_AGENT ?? "policy-shorts-hunter/0.1" },
});

function parseDate(d?: string): Date | null {
  if (!d) return null;
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export async function fetchRss(sourceId: string, feedUrl: string, maxItems: number): Promise<NormalizedItem[]> {
  const feed = await parser.parseURL(feedUrl);
  const now = new Date();
  const items = (feed.items ?? []).slice(0, maxItems).map((it) => {
    const title = normalizeText(it.title ?? "");
    const url = (it.link ?? "").trim();
    const summary = normalizeText((it.contentSnippet ?? it.content ?? "") as string);
    const publishedAt = parseDate(it.isoDate ?? it.pubDate);
    return {
      sourceId,
      sourceType: "rss",
      title,
      url,
      summary: summary || null,
      publishedAt,
      fetchedAt: now,
      contentText: null,
    } satisfies NormalizedItem;
  }).filter(i => i.title && i.url);

  return items;
}
