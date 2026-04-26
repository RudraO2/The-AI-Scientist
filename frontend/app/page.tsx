import Link from "next/link";
import { HypothesisForm } from "@/components/hypothesis-form";

export default function Home() {
  return (
    <>
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
        {/* TopAppBar */}
        <header className="flex justify-between items-center px-8 h-16 w-full sticky top-0 z-50 bg-stone-50/95 backdrop-blur border-b-[0.5px] border-stone-300">
          <div className="flex items-center gap-8">
            <span
              className="text-xl font-bold text-[#2D4B44] uppercase tracking-widest"
              style={{ fontFamily: "Newsreader, serif" }}
            >
              The AI Scientist
            </span>
            <nav className="hidden md:flex gap-6 items-center h-full">
              <span
                className="text-base tracking-tight text-[#2D4B44] font-semibold border-b-2 border-[#2D4B44] cursor-default h-full flex items-center px-2"
                style={{ fontFamily: "Newsreader, serif" }}
              >
                New Plan
              </span>
              {/* <Link
                href="/history"
                className="text-base tracking-tight text-stone-500 hover:bg-stone-100 transition-colors cursor-pointer px-2 py-1"
                style={{ fontFamily: "Newsreader, serif" }}
              >
                History
              </Link> */}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/history"
              className="p-2 cursor-pointer hover:bg-stone-100 transition-colors rounded text-[#2D4B44]"
              aria-label="History"
            >
              <span className="material-symbols-outlined" style={{ fontFamily: "Material Symbols Outlined" }}>
                history
              </span>
            </Link>
          </div>
        </header>

        <main className="max-w-[800px] mx-auto pt-16 pb-24 px-6 flex flex-col items-center">
          {/* Brand Narrative */}
          <div className="text-center mb-12">
            <h1
              className="mb-2 text-[57px] leading-[1.2] font-semibold text-[#16342e]"
              style={{ fontFamily: "Newsreader, serif" }}
            >
              Formulate Your Hypothesis
            </h1>
            <p
              className="text-base leading-[1.6] text-[#414846] italic"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              Convert your research question into a full laboratory plan in minutes.
            </p>
          </div>

          <HypothesisForm />
        </main>

        
        
      </div>
    </>
  );
}
