"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/src/ui/Button";
import { Chip } from "@/src/ui/Chip";

type Source = {
  id: string;
  name: string;
  sourceId: string;
  type: "rss" | "html";
  url: string;
  enabled: boolean;
  weight: number;
};

export function SourcesClient() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/sources", { cache: "no-store" });
    const json = await res.json();
    setSources(json.sources ?? []);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function save(s: Source) {
    setSavingId(s.id);
    await fetch(`/api/sources/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: s.name, type: s.type, url: s.url, enabled: s.enabled, weight: s.weight }),
    });
    setSavingId(null);
    setSavedId(s.id);
    setTimeout(() => setSavedId(null), 2000);
    await load();
  }

  const sorted = useMemo(
    () => [...sources].sort((a, b) => b.weight - a.weight || a.name.localeCompare(b.name)),
    [sources]
  );

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center gap-3 text-white/30">
        <div className="w-6 h-6 border-2 border-white/10 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-sm">불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/5">
      {sorted.map((s) => (
        <div key={s.id} className="py-4 first:pt-2 last:pb-2">
          <div className="flex flex-col gap-3">
            {/* Top row: enabled toggle + name + badges */}
            <div className="flex items-start gap-3">
              {/* Toggle */}
              <button
                onClick={() => setSources((prev) =>
                  prev.map((p) => p.id === s.id ? { ...p, enabled: !p.enabled } : p)
                )}
                className={`shrink-0 mt-0.5 w-10 h-6 rounded-full transition-colors relative focus:outline-none ${s.enabled ? "bg-indigo-600" : "bg-white/10"
                  }`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${s.enabled ? "left-5" : "left-1"
                  }`} />
              </button>

              {/* Name input */}
              <input
                type="text"
                value={s.name}
                onChange={(e) =>
                  setSources((prev) => prev.map((p) => p.id === s.id ? { ...p, name: e.target.value } : p))
                }
                className="flex-1 min-w-0 bg-transparent border-b border-white/10 focus:border-indigo-500 focus:outline-none text-sm font-medium text-white/80 focus:text-white pb-1 transition-colors"
              />

              <div className="flex items-center gap-1.5 shrink-0">
                <Chip tone={s.type === "rss" ? "accent" : "neutral"}>{s.type.toUpperCase()}</Chip>
                <Chip>w{s.weight}</Chip>
              </div>
            </div>

            {/* URL row */}
            <div className="pl-12">
              <input
                type="text"
                value={s.url}
                onChange={(e) =>
                  setSources((prev) => prev.map((p) => p.id === s.id ? { ...p, url: e.target.value } : p))
                }
                className="w-full text-xs text-white/40 bg-transparent border border-white/6 rounded-xl px-3 py-2 focus:border-indigo-500/50 focus:text-white/60 focus:outline-none transition-colors font-mono"
              />
            </div>

            {/* Bottom row: weight + type + save */}
            <div className="flex items-center gap-3 flex-wrap pl-12">
              {/* Type */}
              <select
                value={s.type}
                onChange={(e) =>
                  setSources((prev) => prev.map((p) => p.id === s.id ? { ...p, type: e.target.value as "rss" | "html" } : p))
                }
                className="rounded-lg border border-white/10 bg-white/5 text-white/60 text-xs px-2 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="rss">RSS</option>
                <option value="html">HTML</option>
              </select>

              {/* Weight */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/30">가중치</span>
                <input
                  type="range" min={0} max={10} value={s.weight}
                  onChange={(e) =>
                    setSources((prev) => prev.map((p) => p.id === s.id ? { ...p, weight: Number(e.target.value) } : p))
                  }
                  className="w-24"
                />
                <span className="text-xs text-white/50 font-mono w-4">{s.weight}</span>
              </div>

              <div className="ml-auto">
                {savedId === s.id ? (
                  <span className="text-xs text-emerald-400 font-medium">✓ 저장됨</span>
                ) : (
                  <Button variant="ghost" onClick={() => save(s)} disabled={savingId === s.id}>
                    {savingId === s.id ? "저장 중..." : "저장"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
