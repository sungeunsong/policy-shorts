import clsx from "clsx";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "rounded-2xl glass overflow-hidden",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="px-6 py-5 border-b border-white/6 flex items-start justify-between gap-3">
      <div>
        <div className="font-semibold text-white/90 text-[15px]">{title}</div>
        {subtitle ? (
          <div className="text-xs text-white/40 mt-1 leading-relaxed">{subtitle}</div>
        ) : null}
      </div>
      {right}
    </div>
  );
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("px-6 py-5", className)}>{children}</div>;
}
