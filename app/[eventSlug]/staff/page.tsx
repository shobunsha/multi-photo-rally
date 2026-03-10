"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function getStaffAuthKey(eventSlug: string) {
  return `staff_authed:${eventSlug}`;
}

export default function StaffPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const [eventSlug, setEventSlug] = useState("");
  const [staffPin, setStaffPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    params.then(({ eventSlug }) => {
      setEventSlug(eventSlug);
      const saved = localStorage.getItem(getStaffAuthKey(eventSlug));
      if (saved === "1") {
        setAuthed(true);
      }
    });
  }, [params]);

  const title = useMemo(() => {
    if (eventSlug === "fujisawa") return "藤沢イベント スタッフ画面";
    return "スタッフ画面";
  }, [eventSlug]);

  function handleLogin() {
    if (!staffPin) {
      setMessage("PINを入力してください。");
      return;
    }

    if (staffPin === "1234") {
      localStorage.setItem(getStaffAuthKey(eventSlug), "1");
      setAuthed(true);
      setMessage("");
      return;
    }

    setMessage("PINが違います。");
  }

  function handleLogout() {
    localStorage.removeItem(getStaffAuthKey(eventSlug));
    setAuthed(false);
    setStaffPin("");
    setMessage("");
  }

  if (!eventSlug) {
    return <div className="min-h-screen bg-slate-950 p-6 text-white">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-3xl font-black">{title}</h1>

        {!authed ? (
          <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="text-lg font-bold">スタッフ認証</div>

            <input
              type="password"
              value={staffPin}
              onChange={(e) => setStaffPin(e.target.value)}
              placeholder="スタッフPIN"
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 outline-none"
            />

            <button
              onClick={handleLogin}
              className="w-full rounded-xl bg-cyan-500 px-4 py-3 font-bold text-white"
            >
              ログイン
            </button>

            {message && (
              <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
                {message}
              </div>
            )}

            <div className="text-xs text-white/50">
              開発中は仮で 1234 にしています
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="mb-2 text-lg font-bold">利用メニュー</div>
              <div className="text-sm text-white/70">
                クーポンの読み取り、手入力処理、イベント確認ができます。
              </div>
            </div>

            <Link
              href={`/${eventSlug}/staff/scan`}
              className="block rounded-2xl bg-cyan-500 px-4 py-4 text-center text-lg font-bold"
            >
              クーポンをスキャンする
            </Link>

            <Link
              href={`/${eventSlug}`}
              className="block rounded-2xl border border-white/15 bg-white/5 px-4 py-4 text-center font-bold"
            >
              公開ページを見る
            </Link>

            <button
              onClick={handleLogout}
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-4 text-center font-bold"
            >
              ログアウト
            </button>
          </div>
        )}
      </div>
    </main>
  );
}