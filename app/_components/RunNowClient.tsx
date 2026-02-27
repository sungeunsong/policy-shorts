"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/ui/Button";

type Preset = { id: string; slug: string; name: string; description?: string | null; defaultAiTopN: number };

const WINDOW_OPTIONS = [
  { label: "6시간", value: 6 },
  { label: "12시간", value: 12 },
  { label: "24시간", value: 24 },
  { label: "48시간", value: 48 },
  { label: "3일", value: 72 },
  { label: "7일", value: 168 },
  { label: "14일", value: 336 },
  { label: "30일", value: 720 },
];

const selectCls =
  "rounded-xl border px-3 py-2 text-sm bg-white/5 border-white/10 text-white/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all cursor-pointer";

export function RunNowClient() {
  const router = useRouter();
  const [mode, setMode] = useState<"collect_only" | "ai_rank">("collect_only");
  const [windowHours, setWindowHours] = useState(24);
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  const [presets, setPresets] = useState<Preset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const activePreset = useMemo(
    () => presets.find((p) => p.id === activePresetId) ?? null,
    [presets, activePresetId]
  );

  async function loadPresets() {
    const res = await fetch("/api/presets", { cache: "no-store" });
    const json = await res.json();
    setPresets(json.presets ?? []);
    setActivePresetId(json.activePresetId ?? null);
  }

  useEffect(() => { void loadPresets(); }, []);

  async function setActivePreset(presetId: string) {
    setActivePresetId(presetId);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activePresetId: presetId }),
    });
  }

  async function run() {
    setStatus("running");
    setMessage("");
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, windowHours, presetId: activePresetId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "run failed");
      setStatus("done");
      setMessage("✓ 완료! 결과를 갱신합니다...");
      // 서버 컴포넌트 데이터 갱신 (페이지 이동 없이)
      setTimeout(() => router.refresh(), 300);
    } catch (e) {
      setStatus("error");
      setMessage(`✕ ${String(e)}`);
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Controls Row */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* 주제 프리셋 */}
        <select
          className={selectCls}
          value={activePresetId ?? ""}
          onChange={(e) => setActivePreset(e.target.value)}
          disabled={!presets.length}
        >
          {presets.length === 0 ? <option value="">불러오는 중...</option> : null}
          {presets.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* 시간 범위 */}
        <select
          className={selectCls}
          value={windowHours}
          onChange={(e) => setWindowHours(Number(e.target.value))}
        >
          {WINDOW_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* 구분선 */}
        <div className="w-px h-5 bg-white/10 hidden sm:block" />

        {/* 모드 토글 */}
        <div className="flex items-center gap-0.5 rounded-xl border border-white/10 bg-white/5 p-1">
          {[
            { key: "collect_only", label: "수집만" },
            { key: "ai_rank", label: "AI Top5" },
          ].map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key as "collect_only" | "ai_rank")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${mode === m.key
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-white/45 hover:text-white/70"
                }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Run Button */}
        <Button
          onClick={run}
          disabled={status === "running" || !activePresetId}
          className="ml-auto sm:ml-0"
        >
          {status === "running" ? (
            <>
              <span className="animate-spin text-base leading-none">⧗</span>
              Running...
            </>
          ) : "▶ Run Now"}
        </Button>
      </div>

      {/* Description Row */}
      {(activePreset || status !== "idle") && (
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {activePreset && (
            <span className="text-white/35">
              <span className="text-white/55 font-medium">{activePreset.name}</span>
              {activePreset.description && <> · {activePreset.description}</>}
              {" · "}
              <span className="text-white/55 font-medium">
                {WINDOW_OPTIONS.find((o) => o.value === windowHours)?.label ?? `${windowHours}h`}
              </span>{" "}이내
            </span>
          )}
          {status === "done" && (
            <span className="text-emerald-400 font-medium">{message}</span>
          )}
          {status === "error" && (
            <span className="text-red-400">{message}</span>
          )}
        </div>
      )}
    </div>
  );
}
