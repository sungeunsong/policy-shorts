import clsx from "clsx";

export function Chip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "danger" | "accent";
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium border whitespace-nowrap",
        tone === "neutral" && "bg-white/5 border-white/10 text-white/60",
        tone === "good" && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        tone === "warn" && "bg-amber-500/10 border-amber-500/20 text-amber-400",
        tone === "danger" && "bg-red-500/10 border-red-500/20 text-red-400",
        tone === "accent" && "bg-indigo-500/15 border-indigo-500/25 text-indigo-300"
      )}
    >
      {children}
    </span>
  );
}
