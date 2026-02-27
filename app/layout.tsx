import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Policy Shorts Hunter",
  description: "제도요약 쇼츠 소재발굴 자동화 대시보드",
};

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/candidates", label: "Candidates" },
  { href: "/sources", label: "Sources" },
  { href: "/runs", label: "Runs" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="min-h-dvh flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-30 border-b border-white/6 backdrop-blur-xl"
            style={{ background: "rgba(10, 15, 30, 0.8)" }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 group shrink-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-lg shadow-indigo-500/20 shrink-0"
                  style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}>
                  PS
                </div>
                <div className="hidden sm:block">
                  <div className="font-semibold text-white/90 text-[15px] leading-tight group-hover:text-white transition-colors">
                    Policy Shorts Hunter
                  </div>
                  <div className="text-[11px] text-white/35 leading-tight">소재발굴 · 룰점수 · AI Top10</div>
                </div>
              </Link>

              {/* Nav */}
              <nav className="flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/6 transition-all duration-150"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>

          {/* Main */}
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="max-w-6xl mx-auto px-4 sm:px-6 pb-8 text-xs text-white/20 text-center">
            Policy Shorts Hunter · MVP v0.1 · Collect-only 기본 · AI Rank 옵션
          </footer>
        </div>
      </body>
    </html>
  );
}
