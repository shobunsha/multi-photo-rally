import Link from "next/link";
import { listEvents } from "@/lib/event-service";
import DeleteEventButton from "@/app/components/DeleteEventButton";

export default async function AdminEventsPage() {
  const events = await listEvents();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 text-sm font-semibold tracking-[0.2em] text-cyan-300">
              EVENTS
            </div>
            <h1 className="text-3xl font-black">イベント一覧</h1>
          </div>

          <div className="flex gap-3">
            <Link
              href="/admin"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 font-bold"
            >
              管理トップへ
            </Link>
            <Link
              href="/admin/events/new"
              className="rounded-xl bg-cyan-500 px-4 py-2 font-bold"
            >
              新しい会場を追加
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-3xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-xl font-bold">{event.name}</div>
                  <div className="mt-1 text-sm text-white/70">slug: {event.slug}</div>
                  <div className="mt-1 text-sm text-white/80">{event.publicTitle}</div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/${event.slug}`}
                    className="rounded-xl bg-cyan-500 px-4 py-2 font-bold"
                  >
                    公開ページ
                  </Link>
                  <Link
                    href={`/${event.slug}/staff`}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 font-bold"
                  >
                    スタッフ
                  </Link>
                  <Link
                    href={`/admin/events/${event.id}/spots`}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 font-bold"
                  >
                    見本写真設定
                  </Link>

                  <DeleteEventButton
                    eventId={event.id}
                    eventName={event.name}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}