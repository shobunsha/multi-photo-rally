"use client";

import { BrowserMultiFormatReader } from "@zxing/browser";
import { useEffect, useRef, useState } from "react";

function getStaffAuthKey(eventSlug: string) {
  return `staff_authed:${eventSlug}`;
}

export default function StaffScanPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  const [eventSlug, setEventSlug] = useState("");
  const [ready, setReady] = useState(false);
  const [code, setCode] = useState("");
  const [staffPin, setStaffPin] = useState("1234");
  const [staffName, setStaffName] = useState("");
  const [message, setMessage] = useState("");
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    params.then(({ eventSlug }) => {
      setEventSlug(eventSlug);
      setReady(true);
    });
  }, [params]);

  useEffect(() => {
    return () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, []);

  async function startScan() {
    try {
      if (!videoRef.current) return;

      const authed = localStorage.getItem(getStaffAuthKey(eventSlug));
      if (authed !== "1") {
        setMessage("先にスタッフ画面でログインしてください。");
        return;
      }

      controlsRef.current?.stop();
      controlsRef.current = null;

      setMessage("カメラを起動中...");
      setScanning(true);

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      const deviceId = devices[0]?.deviceId;

      const controls = await reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            setCode(result.getText());
            setMessage("QRを読み取りました。");
            controlsRef.current?.stop();
            controlsRef.current = null;
            setScanning(false);
          }

          if (error) {
            // 読み取り中の一時的なエラーは無視
          }
        }
      );

      controlsRef.current = controls as { stop: () => void };
    } catch {
      setMessage("カメラを起動できませんでした。");
      setScanning(false);
    }
  }

  function stopScan() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(false);
    setMessage("スキャンを停止しました。");
  }

  async function handleUse() {
    if (!code) {
      setMessage("クーポンコードを入力してください。");
      return;
    }

    setMessage("処理中...");

    const res = await fetch("/api/staff/coupon/use", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventSlug,
        code,
        staffPin,
        staffName,
      }),
    });

    const json = await res.json();
    setMessage(json.message || "完了");
  }

  if (!ready) {
    return <div className="min-h-screen bg-slate-950 p-6 text-white">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-2xl font-black">クーポン使用処理</h1>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 text-sm font-bold">QRスキャン</div>

          <div className="overflow-hidden rounded-2xl bg-black">
            <video ref={videoRef} className="aspect-[3/4] w-full object-cover" />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              onClick={startScan}
              className="rounded-xl bg-cyan-500 px-4 py-3 font-bold"
            >
              スキャン開始
            </button>
            <button
              onClick={stopScan}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-bold"
            >
              停止
            </button>
          </div>
        </div>

        <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm font-bold">手入力 / 確認</div>

          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="クーポンコード"
            className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3"
          />

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
            onClick={handleUse}
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-bold"
          >
            使用済みにする
          </button>
        </div>

        {message && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
            {message}
          </div>
        )}

        {scanning && (
          <div className="text-center text-xs text-cyan-300">
            QRコードをカメラにかざしてください
          </div>
        )}
      </div>
    </main>
  );
}