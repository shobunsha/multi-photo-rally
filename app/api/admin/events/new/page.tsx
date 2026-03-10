"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function makeSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function AdminNewEventPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [publicTitle, setPublicTitle] = useState("");
  const [storyTitle, setStoryTitle] = useState("");
  const [storyBody, setStoryBody] = useState("");
  const [couponTitle, setCouponTitle] = useState("来場特典");
  const [couponDescription, setCouponDescription] = useState(
    "受付でノベルティ引換ができます。"
  );
  const [couponPrefix, setCouponPrefix] = useState("NEW");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    if (!name || !slug || !publicTitle) {
      setMessage("会場名・slug・公開タイトルは必須です。");
      return;
    }

    setBusy(true);
    setMessage("作成中...");

    const res = await fetch("/api/admin/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        slug,
        publicTitle,
        storyTitle,
        storyBody,
        couponTitle,
        couponDescription,
        couponPrefix,
      }),
    });

    const json = await res.json();

    if (!json.ok) {
      setMessage(json.message || "作成に失敗しました。");
      setBusy(false);
      return;
    }

    setMessage("イベントを作成しました。");
    router.push(`/admin/events/${json.event.id}/spots`);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <div className="mb-2 text-sm font-semibold tracking-[0.2em] text-cyan-300">
            NEW EVENT
          </div>
          <h1 className="text-3xl font-black">新しい会場を追加</h1>
        </div>

        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div>
            <label className="mb-1 block text-sm text-white/70">会場名</label>
            <input
              value={name}
              onChange={(e) => {
                const v = e.target.value;
                setName(v);
                if (!slug) {
                  setSlug(makeSlug(v));
                }
              }}
              placeholder="住宅展示場 平塚会場"
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/70">slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(makeSlug(e.target.value))}
              placeholder="hiratsuka-housing"
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3"
            />
            <div className="mt-1 text-xs text-white/50">
              公開URLは /{slug || "your-slug"} になります
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/70">公開タイトル</label>
            <input
              value={publicTitle}
              onChange={(e) => setPublicTitle(e.target.value)}
              placeholder="HIRATSUKA HOUSING MISSION"
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/70">ストーリー見出し</label>
            <input
              value={storyTitle}
              onChange={(e) => setStoryTitle(e.target.value)}
              placeholder="平塚会場のチェックポイントを巡ろう"
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/70">ストーリー本文</label>
            <textarea
              value={storyBody}
              onChange={(e) => setStoryBody(e.target.value)}
              rows={4}
              placeholder="会場内にある3つの見本スポットを見つけて撮影し、ミッションをクリアしてください。"
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-white/70">特典名</label>
              <input
                value={couponTitle}
                onChange={(e) => setCouponTitle(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-white/70">特典説明</label>
              <input
                value={couponDescription}
                onChange={(e) => setCouponDescription(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-white/70">クーポン接頭辞</label>
              <input
                value={couponPrefix}
                onChange={(e) => setCouponPrefix(e.target.value.toUpperCase())}
                placeholder="HHTK"
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3"
              />
            </div>
          </div>

          {message && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
              {message}
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={busy}
            className="rounded-xl bg-cyan-500 px-5 py-3 font-bold disabled:opacity-50"
          >
            {busy ? "作成中..." : "新しい会場を作成する"}
          </button>
        </div>
      </div>
    </main>
  );
}