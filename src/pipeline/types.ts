export type SourceType = "rss" | "html";

export type NormalizedItem = {
  sourceId: string;
  sourceType: SourceType;
  title: string;
  url: string;
  publishedAt?: Date | null;
  fetchedAt: Date;
  summary?: string | null;
  contentText?: string | null;
};

export type RunMode = "collect_only" | "ai_rank";
