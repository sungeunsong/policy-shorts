import clsx from "clsx";
import React from "react";

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }
) {
  const { className, variant = "primary", disabled, ...rest } = props;
  return (
    <button
      disabled={disabled}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150 active:scale-[0.97] select-none cursor-pointer",
        variant === "primary" && [
          "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20",
          "hover:bg-indigo-500 hover:shadow-indigo-500/30",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100",
        ],
        variant === "ghost" && [
          "bg-white/5 border border-white/10 text-white/80",
          "hover:bg-white/10 hover:border-white/20 hover:text-white",
          "disabled:opacity-40 disabled:cursor-not-allowed",
        ],
        variant === "danger" && [
          "bg-red-500/10 border border-red-500/20 text-red-400",
          "hover:bg-red-500/20 hover:border-red-500/30",
          "disabled:opacity-40 disabled:cursor-not-allowed",
        ],
        className
      )}
      {...rest}
    />
  );
}
