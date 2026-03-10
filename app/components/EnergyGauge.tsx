"use client";

export default function EnergyGauge({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(100, value));
  const isLow = safe > 0 && safe < 34;
  const isFull = safe >= 100;

  return (
    <div className="rounded-2xl border border-white/20 bg-black/40 p-4 text-white">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">ENERGY</span>
        <span
          className={`text-lg font-bold ${
            isLow ? "animate-pulse text-red-400" : isFull ? "text-yellow-300" : ""
          }`}
        >
          {safe}%
        </span>
      </div>

      <div className="h-4 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isFull ? "animate-pulse" : ""
          }`}
          style={{ width: `${safe}%`, background: "linear-gradient(90deg, #22d3ee, #22c55e)" }}
        />
      </div>

      <div className="mt-2 text-xs text-white/70">
        {isFull ? "FULL" : isLow ? "LOW" : "CHARGING"}
      </div>
    </div>
  );
}