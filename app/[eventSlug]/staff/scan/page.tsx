"use client";

import { BrowserMultiFormatReader } from "@zxing/browser";
import { useEffect, useRef, useState } from "react";
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

type UseResult = {
  ok?: boolean;
  message?: string;
  code?: string;
  used_at?: string;
  used_by?: string;
};

export default function StaffScanPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const handlingRef = useRef(false);

  const [eventSlug, setEventSlug] = useState("");
  const [ready, setReady] = useState(false);
  const [code, setCode] = useState("");
  const [staffPin, setStaffPin] = useState("1234");
  const [staffName, setStaffName] = useState("");
  const [message, setMessage] = useState("");
  const [scanning, setScanning] = useState(false);
  const [usingCoupon, setUsingCoupon] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastUsedCode, setLastUsedCode] = useState("");
  const [lastUseMessage, setLastUseMessage] = useState("");

  useEffect(() => {
    params.then(({ eventSlug }) => {
      setEventSlug(eventSlug);

      const savedPin = localStorage.getItem(getStaffPinKey(eventSlug));
      const savedName = localStorage.getItem(getStaffNameKey(eventSlug));

      if (savedPin) setStaffPin(savedPin);
      if (savedName) setStaffName(savedName);

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

      handlingRef.current = false;
      controlsRef.current?.stop();
      controlsRef.current = null;

      setCode("");
      setMessage("カメラを起動中...");
      setScanning(true);

      const reader = new BrowserMultiFormatReader();

      const devices = await BrowserMultiFormatReader.listVideoInputDevices();

      const backCamera =
        devices.find((d) => {
          const label = d.label.toLowerCase();
          return (
            label.includes("back") ||
            label.includes("rear") ||
            label.includes("environment")
          );
        }) ?? devices[0];

      const controls = await reader.decodeFromVideoDevice(
        backCamera?.deviceId,
        videoRef.current,
        async (result, error) => {
          if (result && !handlingRef.current) {
            handlingRef.current = true;

            const scannedCode = result.getText();
            setCode(scannedCode);
            setMessage("QRを読み取りました。使用処理を実行中...");
            controlsRef.current?.stop();
            controlsRef.current = null;
            setScanning(false);

            await handleUse(scannedCode);
          }

          if (error) {
            // 読み取り中の一時的なエラーは無視
          }
        }
      );

      controlsRef.current = controls as { stop: () => void };
      setMessage("QRコードをカメラにかざしてください。");
    } catch {
      setMessage("カメラを起動できませんでした。");
      setScanning(false);
    }
  }

  function stopScan() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(false);
    handlingRef.current = false;
    setMessage("スキャンを停止しました。");
  }

  async function handleUse(forcedCode?: string) {
    const targetCode = (forcedCode ?? code).trim();

    if (!targetCode) {
      setMessage("クーポンコードを入力してください。");
      return;
    }

    localStorage.setItem(getStaffPinKey(eventSlug), staffPin);
    localStorage.setItem(getStaffNameKey(eventSlug), staffName);

    setUsingCoupon(true);
    setMessage("処理中...");

    try {
      const res = await fetch("/api/staff/coupon/use", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventSlug,
          code: targetCode,
          staffPin,
          staffName,
        }),
      });

      const json = (await res.json()) as UseResult;

      setMessage(json.message || "完了");

      if (res.ok && json.ok !== false) {
        setLastUsedCode(targetCode);
        setLastUseMessage(json.message || "読込完了");
        setShowSuccessModal(true);
      }
    } catch {
      setMessage("使用処理中にエラーが発生しました。");
    } finally {
      setUsingCoupon(false);
    }
  }

  function handleContinueScan() {
    setShowSuccessModal(false);
    setLastUsedCode("");
    setLastUseMessage("");
    setCode("");
    setMessage("次のQRをスキャンしてください。");
    handlingRef.current = false;
    void startScan();
  }

  if (!ready) {
    return <div className="min-h-screen bg-slate-950 p-6 text-white">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => router.push(`/${eventSlug}/staff`)}
            className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold"
          >
            ← 管理画面に戻る
          </button>

          <div className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold">
            {eventSlug}
          </div>
        </div>

        <h1 className="text-2xl font-black">クーポン使用処理</h1>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 text-sm font-bold">QRスキャン</div>

          <div className="overflow-hidden rounded-2xl bg-black">
            <video
              ref={videoRef}
              className="aspect-[3/4] w-full object-cover"
              muted
              playsInline
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              onClick={startScan}
              disabled={scanning || usingCoupon}
              className="rounded-xl bg-cyan-500 px-4 py-3 font-bold disabled:opacity-50"
            >
              {scanning ? "スキャン中..." : "スキャン開始"}
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
            onClick={() => handleUse()}
            disabled={usingCoupon}
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-bold disabled:opacity-50"
          >
            {usingCoupon ? "処理中..." : "使用済みにする"}
          </button>
        </div>

        {message && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
            {message}
          </div>
        )}

        {lastUsedCode && (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
            <div className="text-xs font-bold text-emerald-300">直近の読込コード</div>
            <div className="mt-1 break-all text-sm font-black">{lastUsedCode}</div>
          </div>
        )}

        {scanning && (
          <div className="text-center text-xs text-cyan-300">
            QRコードをカメラにかざしてください
          </div>
        )}
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="text-center">
              <div className="text-2xl font-black text-emerald-300">読込完了</div>
              <div className="mt-3 text-sm text-white/80">
                クーポンを使用済みにしました
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-bold text-white/60">クーポンコード</div>
                <div className="mt-1 break-all text-sm font-black text-white">
                  {lastUsedCode}
                </div>
              </div>

              <div className="mt-3 text-sm text-emerald-300">{lastUseMessage}</div>

              <div className="mt-5 space-y-3">
                <button
                  onClick={handleContinueScan}
                  className="w-full rounded-2xl bg-cyan-500 px-4 py-3 font-black text-white"
                >
                  続けてスキャン
                </button>

                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 font-bold text-white"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}