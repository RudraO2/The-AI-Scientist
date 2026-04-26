"use client";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[qc error]", error);
  }, [error]);
  return (
    <div className="min-h-screen p-12 bg-[#fcf9f8]">
      <h1 className="text-2xl font-bold text-[#16342e] mb-4">QC page error</h1>
      <pre className="bg-stone-100 p-4 text-xs overflow-auto whitespace-pre-wrap">{error.message}</pre>
      {error.stack && (
        <pre className="mt-4 bg-stone-100 p-4 text-[10px] overflow-auto whitespace-pre-wrap">{error.stack}</pre>
      )}
      {error.digest && <p className="mt-2 text-xs text-stone-500">digest: {error.digest}</p>}
      <button
        onClick={reset}
        className="mt-4 bg-[#16342e] text-white px-4 py-2"
      >
        Try again
      </button>
    </div>
  );
}
