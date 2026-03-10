"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

type Stage =
  | "hidden"
  | "fadein"
  | "chest"
  | "shake"
  | "open"
  | "fadeout"
  | "coupon";

export default function TreasureAnimation({
  open,
  couponCode,
  onFinish,
}: {
  open: boolean;
  couponCode: string;
  onFinish: () => void;
}) {
  const [stage, setStage] = useState<Stage>("hidden");
  const timers = useRef<number[]>([]);

  function clearTimers() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }

  useEffect(() => {
    return () => clearTimers();
  }, []);

  useEffect(() => {
    if (!open) {
      clearTimers();
      setStage("hidden");
      return;
    }

    clearTimers();
    setStage("fadein");

    timers.current.push(
      window.setTimeout(() => setStage("chest"), 300),
      window.setTimeout(() => setStage("shake"), 900),
      window.setTimeout(() => setStage("open"), 2200),
      window.setTimeout(() => setStage("fadeout"), 3600),
      window.setTimeout(() => setStage("coupon"), 4700)
    );
  }, [open]);

  if (!open || stage === "hidden") return null;

  const isOpen = stage === "open" || stage === "fadeout";
  const isShaking = stage === "shake";
  const isFadingOut = stage === "fadeout";
  const showCoupon = stage === "coupon";

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px] transition-opacity duration-700 opacity-100" />

      {!showCoupon && (
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="relative flex h-full w-full max-w-md items-center justify-center">
            <div
              className={[
                "relative transition-all duration-1000 ease-in-out",
                stage === "fadein"
                  ? "translate-y-6 scale-95 opacity-0"
                  : "translate-y-0 scale-100 opacity-100",
                isFadingOut ? "scale-95 opacity-0" : "",
                isShaking ? "animate-[treasureShake_1.2s_ease-in-out_infinite]" : "",
              ].join(" ")}
            >
              <img
                src={isOpen ? "/treasure-open.png" : "/treasure-closed.png"}
                alt={isOpen ? "open treasure chest" : "closed treasure chest"}
                className="mx-auto w-[260px] max-w-full select-none drop-shadow-[0_20px_40px_rgba(0,0,0,0.55)]"
                draggable={false}
              />
            </div>
          </div>
        </div>
      )}

      {showCoupon && (
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-[28px] border border-white/15 bg-white p-6 text-center shadow-2xl animate-[couponFadeIn_0.6s_ease-out]">
            <div className="mb-2 text-2xl font-black text-slate-900">
              クーポン獲得！
            </div>
            <p className="mb-5 text-sm text-slate-600">
              スタッフにこのQRコードをご提示ください
            </p>

            <div className="mb-5 flex justify-center rounded-2xl bg-white p-4">
              <QRCodeCanvas value={couponCode} size={220} />
            </div>

            <div className="mb-5 rounded-2xl bg-slate-100 px-4 py-3 text-base font-bold text-slate-900 break-all">
              {couponCode}
            </div>

            <button
              onClick={onFinish}
              className="w-full rounded-2xl bg-cyan-500 px-4 py-4 text-lg font-black text-white"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes treasureShake {
          0% {
            transform: rotate(0deg) translateX(0);
          }
          20% {
            transform: rotate(-3deg) translateX(-3px);
          }
          40% {
            transform: rotate(3deg) translateX(3px);
          }
          60% {
            transform: rotate(-2deg) translateX(-2px);
          }
          80% {
            transform: rotate(2deg) translateX(2px);
          }
          100% {
            transform: rotate(0deg) translateX(0);
          }
        }

        @keyframes couponFadeIn {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}