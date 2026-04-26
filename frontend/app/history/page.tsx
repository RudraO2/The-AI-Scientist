import Link from "next/link";
import { getHistory } from "@/lib/api";
import { HistoryList } from "@/components/history-list";
import type { HistoryItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  let items: HistoryItem[];
  try {
    items = await getHistory();
  } catch {
    items = [];
  }

  return (
    <div
      className="relative min-h-screen text-[#1c1b1b]"
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        backgroundColor: "#fcf9f8",
        backgroundImage:
          "linear-gradient(rgba(22, 52, 46, 0.10) 0.1px, transparent 0.1px), linear-gradient(90deg, rgba(22, 52, 46, 0.10) 0.1px, transparent 0.1px)",
        backgroundSize: "24px 24px",
      }}
    >
      {/* Side Navigation */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col pt-4 pb-8 bg-stone-50 border-r-[0.5px] border-stone-300 z-50">
        <div className="px-6 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2d4b44] flex items-center justify-center text-white font-bold">AI</div>
            <div>
              <h1 className="text-lg font-bold text-[#2D4B44]" style={{ fontFamily: "Newsreader, serif" }}>
                Lab Notebook
              </h1>
              <p className="text-xs tracking-tight text-stone-500" style={{ fontFamily: "Newsreader, serif" }}>
                Precision Planning
              </p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          <Link
            href="/"
            className="px-4 py-3 flex items-center gap-3 text-sm tracking-tight text-stone-600 hover:text-[#2D4B44] hover:bg-stone-100 transition-all duration-150"
            style={{ fontFamily: "Newsreader, serif" }}
          >
            <span className="material-symbols-outlined">add_notes</span>
            New Plan
          </Link>
          <Link
            href="/history"
            className="px-4 py-3 flex items-center gap-3 text-sm tracking-tight text-[#2D4B44] bg-stone-200/50 font-bold border-l-4 border-[#2D4B44]"
            style={{ fontFamily: "Newsreader, serif" }}
          >
            <span className="material-symbols-outlined">inventory_2</span>
            History
          </Link>
        </nav>
      </aside>

      {/* Top Header */}
      <header className="flex justify-between items-center px-8 h-16 sticky top-0 z-40 bg-stone-50/95 backdrop-blur border-b-[0.5px] border-stone-300 lg:ml-64">
        <Link
          href="/"
          className="text-xl font-bold text-[#2D4B44] uppercase tracking-widest"
          style={{ fontFamily: "Newsreader, serif" }}
        >
          The AI Scientist
        </Link>
        <Link
          href="/"
          className="p-2 cursor-pointer hover:bg-stone-100 transition-colors rounded text-[#2D4B44]"
          aria-label="New hypothesis"
        >
          <span className="material-symbols-outlined">add_notes</span>
        </Link>
      </header>

      <main className="lg:ml-64 p-8 md:p-12 flex justify-center min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-[850px] space-y-8">
          <div className="space-y-2">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#5d6052]"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              Archive · {items.length} {items.length === 1 ? "correction" : "corrections"}
            </p>
            <h1
              className="text-[32px] leading-[1.2] font-semibold text-[#16342e]"
              style={{ fontFamily: "Newsreader, serif" }}
            >
              Correction History
            </h1>
            <p
              className="text-base text-[#414846] leading-relaxed max-w-2xl pt-2"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              Every scientist correction stored across plans. Future plans for similar experiments apply these as memory.
            </p>
          </div>

          <HistoryList items={items} />
        </div>
      </main>
    </div>
  );
}
