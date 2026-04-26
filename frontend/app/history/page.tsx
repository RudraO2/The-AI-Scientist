import Link from "next/link";
import { ArrowLeft, FlaskConical } from "lucide-react";
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
    <main className="relative min-h-screen">
      <header className="container py-6 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-ink-400 hover:text-ink-100 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          New hypothesis
        </Link>
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-accent-400" />
          <span className="text-xs font-mono text-ink-500">history</span>
        </div>
      </header>

      <section className="container pb-20 max-w-5xl">
        <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-ink-50">
          Correction history
        </h1>
        <p className="mt-2 text-sm text-ink-400 max-w-2xl">
          Every scientist correction stored across plans. Future plans for similar experiments apply these as memory.
        </p>

        <div className="mt-8">
          <HistoryList items={items} />
        </div>
      </section>
    </main>
  );
}
