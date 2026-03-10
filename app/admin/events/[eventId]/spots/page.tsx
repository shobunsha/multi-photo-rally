"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Spot = {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  order: number;
  refImageUrl: string;
  thumbnailUrl?: string;
  hintText?: string;
  energyGain: number;
  active: boolean;
};

type EventData = {
  id: string;
  slug: string;
  name: string;
  publicTitle: string;
};

export default function AdminEventSpotsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const [eventId, setEventId] = useState("");
  const [event, setEvent] = useState<EventData | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    params.then(({ eventId }) => setEventId(eventId));
  }, [params]);

  useEffect(() => {
    if (!eventId) return;

    setLoading(true);

    fetch("/api/admin/events")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          const found = (json.events as EventData[]).find((e) => e.id === eventId) ?? null;
          setEvent(found);
        }
      });

    fetch(`/api/admin/spots?eventId=${encodeURIComponent(eventId)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setSpots(json.spots);
        }
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  function updateLocalSpot(spotId: string, patch: Partial<Spot>) {
    setSpots((prev) =>
      prev.map((spot) => (spot.id === spotId ? { ...spot, ...patch } : spot))
    );
  }

  async function saveSpot(spot: Spot) {
    setMessage("保存中...");

    const res = await fetch(`/api/admin/spots/${spot.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(spot),
    });

    const json = await res.json();
    setMessage(json.ok ? "保存しました。" : "保存に失敗しました。");
  }

  async function uploadImage(spotId: string, file: File) {
    if (!eventId) return;

    setMessage("画像アップロード中...");

    const form = new FormData();
    form.append("file", file);
    form.append("eventId", eventId);
    form.append("spotId", spotId);

    const res = await fetch("/api/admin/assets/upload", {
      method: "POST",
      body: form,
    });

    const json = await res.json();

    if (!json.ok) {
      setMessage("アップロードに失敗しました。");
      return;
    }

    updateLocalSpot(spotId, {
      refImageUrl: json.url,
      thumbnailUrl: json.url,
    });

    setMessage("画像を反映しました。保存してください。");
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-950 p-6 text-white">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 text-sm font-semibold tracking-[0.2em] text-cyan-300">
              SPOT SETTINGS
            </div>
            <h1 className="text-3xl font-black">見本写真・スポット設定</h1>
            <div className="mt-2 text-sm text-white/60">eventId: {eventId}</div>
            {event && (
              <div className="mt-1 text-sm text-white/70">
                会場名: {event.name}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/events"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 font-bold"
            >
              イベント一覧に戻る
            </Link>

            {event && (
              <Link
                href={`/${event.slug}`}
                className="rounded-xl bg-cyan-500 px-4 py-2 font-bold"
              >
                この会場の公開ページを見る
              </Link>
            )}
          </div>
        </div>

        {message && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
            {message}
          </div>
        )}

        <div className="grid gap-6">
          {spots.map((spot) => (
            <div
              key={spot.id}
              className="rounded-3xl border border-white/10 bg-white/5 p-5"
            >
              <div className="grid gap-6 md:grid-cols-[220px_1fr]">
                <div>
                  <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-black">
                    <Image
                      src={spot.thumbnailUrl || spot.refImageUrl}
                      alt={spot.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <input
                    ref={(el) => {
                      fileInputRefs.current[spot.id] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadImage(spot.id, file);
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[spot.id]?.click()}
                    className="mt-3 w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-white"
                  >
                    見本画像を選択
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm text-white/70">タイトル</label>
                    <input
                      value={spot.title}
                      onChange={(e) =>
                        updateLocalSpot(spot.id, { title: e.target.value })
                      }
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-white/70">説明</label>
                    <textarea
                      value={spot.description || ""}
                      onChange={(e) =>
                        updateLocalSpot(spot.id, { description: e.target.value })
                      }
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-white/70">ヒント</label>
                    <input
                      value={spot.hintText || ""}
                      onChange={(e) =>
                        updateLocalSpot(spot.id, { hintText: e.target.value })
                      }
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3"
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm text-white/70">並び順</label>
                      <input
                        type="number"
                        value={spot.order}
                        onChange={(e) =>
                          updateLocalSpot(spot.id, {
                            order: Number(e.target.value),
                          })
                        }
                        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm text-white/70">エネルギー</label>
                      <input
                        type="number"
                        value={spot.energyGain}
                        onChange={(e) =>
                          updateLocalSpot(spot.id, {
                            energyGain: Number(e.target.value),
                          })
                        }
                        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3"
                      />
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={spot.active}
                          onChange={(e) =>
                            updateLocalSpot(spot.id, { active: e.target.checked })
                          }
                        />
                        <span>公開</span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => saveSpot(spot)}
                      className="rounded-xl bg-emerald-500 px-5 py-3 font-bold"
                    >
                      このスポットを保存
                    </button>
                  </div>

                  <div className="text-xs text-white/50">
                    現在の画像URL: {spot.refImageUrl}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}