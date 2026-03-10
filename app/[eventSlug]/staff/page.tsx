"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function getStaffAuthKey(eventSlug: string) {
  return `staff_authed:${eventSlug}`;
}

function getStaffPinKey(eventSlug: string) {
  return `staff_pin:${eventSlug}`;
}

function getStaffNameKey(eventSlug: string) {
  return `staff_name:${eventSlug}`;
}

type RedeemItem = {
  eventSlug: string;
  code: string;
  usedAt: string;
  usedBy: string;
};

export default function StaffPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const router = useRouter();

  const [eventSlug, setEventSlug] = useState("");
  const [ready, setReady] = useState(false);

  const [staffPin, setStaffPin] = useState("1234");
  const [staffName, setStaffName] = useState("");
  const [authed, setAuthed] = useState(false);

  const [items, setItems] = useState<RedeemItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    params.then(({ eventSlug }) => {
      setEventSlug(eventSlug);

      const savedAuthed = localStorage.getItem(getStaffAuthKey(eventSlug)) === "1";
      const savedPin = localStorage.getItem(getStaffPinKey(eventSlug));
      const savedName = localStorage.getItem(getStaffNameKey(eventSlug));

      if (savedPin) setStaffPin(savedPin);
      if (savedName) setStaffName(savedName);
      setAuthed(savedAuthed);
      setReady(true);

      if (savedAuthed && savedPin) {
        void fetchHistory(eventSlug, savedPin);
      }
    });
  }, [params]);

  async function fetchHistory(targetEventSlug = eventSlug, pin = staffPin) {
    if (!targetEventSlug || !pin) return;

    setLoading(true);
    setMessage("履歴を読み込み中...");

    try {
      const res = await fetch(
        `/api/staff/coupon/history?eventSlug=${encodeURIComponent(
          targetEventSlug
        )}&staffPin=${encodeURIComponent(pin)}&limit=100`
      );

      const json = await res.json();

      if (!res.ok || !json.ok) {
        setMessage(json.message || "履歴を取得できませんでした。");
        return;
      }

      setItems(json.items || []);
      setMessage("履歴を更新しました。");
    } catch {
      setMessage("履歴取得中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    if (!eventSlug) return;
    if (!staffPin) {
      setMessage("スタッフPINを入力してください。");
      return;
    }

    localStorage.setItem(getStaffPinKey(eventSlug), staffPin);
    localStorage.setItem(getStaffNameKey(eventSlug), staffName);

    setLoading(true);
    setMessage("ログイン確認中...");

    try {
      const res = await fetch(
        `/api/staff/coupon/history?eventSlug=${encodeURIComponent(
          eventSlug
        )}&staffPin=${encodeURIComponent(staffPin)}&limit=100`
      );

      const json = await res.json();

      if (!res.ok || !json.ok) {
        setMessage(json.message || "ログインできませんでした。");
        return;
      }

      localStorage.setItem(getStaffAuthKey(eventSlug), "1");
      setAuthed(true);
      setItems(json.items || []);
      setMessage("ログインしました。");
    } catch {
      setMessage("ログイン中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    if (!eventSlug) return;
    localStorage.removeItem(getStaffAuthKey(eventSlug));
    setAuthed(false);
    setItems([]);
    setMessage("ログアウトしました。");
  }

  if (!ready) {
    return <div className="min-h-screen bg-slate-950 p-6 text-white">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => router.push(`/${eventSlug}`)}
            className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold"
          >
            ← イベントへ戻る
          </button>

          <div className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold">
            {eventSlug}
          </div>
        </div>

        <h1 className="text-2xl font-black">スタッフ管理画面</h1>

        {!authed ? (
          <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-bold">スタッフログイン</div>

            <input
              value={staffPin}
              onChange={(e) => setStaffPin(e.target.value)}
              placeholder="スタッフPIN"
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3"
            />

            <input
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              placeholder="スタッフ名"
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3"
            />

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-xl bg-cyan-500 px-4 py-3 font-bold disabled:opacity-50"
            >
              {loading ? "確認中..." : "ログイン"}
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push(`/${eventSlug}/staff/scan`)}
                className="rounded-2xl bg-cyan-500 px-4 py-4 font-black"
              >
                QRスキャンへ
              </button>

              <button
                onClick={() => fetchHistory()}
                disabled={loading}
                className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 font-black disabled:opacity-50"
              >
                {loading ? "更新中..." : "履歴更新"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-bold text-white/60">本日の読込件数</div>
                <div className="mt-1 text-2xl font-black">{items.length}</div>
              </div>

              <button
                onClick={handleLogout}
                className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-4 font-bold text-rose-200"
              >
                ログアウト
              </button>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-bold">読込済み一覧</div>
                <div className="text-xs text-white/60">最新順</div>
              </div>

              {items.length === 0 ? (
                <div className="rounded-2xl bg-white/5 px-4 py-6 text-sm text-white/60">
                  まだ読み込み履歴はありません
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={`${item.code}-${item.usedAt}-${index}`}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="text-xs text-white/50">
                        {new Date(item.usedAt).toLocaleString("ja-JP")}
                      </div>
                      <div className="mt-1 break-all text-sm font-black">
                        {item.code}
                      </div>
                      <div className="mt-2 text-xs text-cyan-300">
                        担当: {item.usedBy}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {message && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
            {message}
          </div>
        )}
      </div>
    </main>
  );
}