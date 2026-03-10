import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicEventPayload } from "@/lib/event-service";

export default async function EventTopPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const payload = await getPublicEventPayload(eventSlug);

  if (!payload) return notFound();

  const { event, spots } = payload;

  return (
    <main
      className="min-h-screen bg-cover bg-center text-white"
      style={{ backgroundImage: `url(${event.theme.backgroundImageUrl})` }}
    >
      <div className="min-h-screen px-4 py-6 pb-10">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-xl flex-col justify-end">
          <div className="mb-8 rounded-3xl border border-white/15 bg-black/35 p-4 backdrop-blur-sm">
            <div className="mb-3 text-base font-bold">見本写真と同じ場所を探そう</div>

            <div className="grid grid-cols-3 gap-3">
              {spots.map((spot) => (
                <Link
                  key={spot.id}
                  href={`/${eventSlug}/spots/${spot.id}`}
                  className="block overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:scale-[1.03] active:scale-[0.97]"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden">
                    <Image
                      src={spot.thumbnailUrl || spot.refImageUrl}
                      alt={spot.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="p-2">
                    <div className="text-xs font-bold">{spot.title}</div>
                    {spot.hintText && (
                      <div className="mt-1 line-clamp-2 text-[11px] text-white/70">
                        {spot.hintText}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href={`/${eventSlug}/card`}
              className="block rounded-2xl bg-cyan-500 px-6 py-4 text-center text-lg font-bold text-white"
            >
              ミッションを開始する
            </Link>

            <div className="text-center text-xs text-white/60">
              スマートフォンでの参加を推奨
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}