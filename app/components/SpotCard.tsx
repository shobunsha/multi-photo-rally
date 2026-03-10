import Link from "next/link";
import type { Spot } from "@/lib/types";

export default function SpotCard({
  eventSlug,
  spot,
  completed,
}: {
  eventSlug: string;
  spot: Spot;
  completed: boolean;
}) {
  return (
    <Link
      href={`/${eventSlug}/spots/${spot.id}`}
      className="block rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur-sm"
    >
      <div className="mb-2 text-lg font-bold">{spot.title}</div>
      <div className="mb-3 text-sm text-white/80">{spot.description}</div>
      <div className="flex items-center justify-between text-sm">
        <span>{completed ? "修復済み" : "未修復"}</span>
        <span>{spot.energyGain}%</span>
      </div>
    </Link>
  );
}