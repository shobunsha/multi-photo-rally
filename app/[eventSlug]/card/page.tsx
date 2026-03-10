"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import IntroModal from "@/app/components/IntroModal";
import TreasureAnimation from "@/app/components/TreasureAnimation";
import type { PublicEventPayload } from "@/lib/types";
import {
  getOrCreateParticipantId,
  hasSeenIntro,
  hasShownTreasure,
  loadProgress,
  markIntroSeen,
  markTreasureShown,
  saveProgress,
  storageKeys,
} from "@/lib/storage";
import { makeCouponCode } from "@/lib/coupon-service";

export default function CardPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const [eventSlug, setEventSlug] = useState("");
  const [data, setData] = useState<PublicEventPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(false);
  const [showTreasure, setShowTreasure] = useState(false);
  const [participantId, setParticipantId] = useState("");
  const [progress, setProgress] = useState({
    completedSpotIds: [] as string[],
    energy: 0,
    couponIssued: false,
  });

  const [showHouseFlash, setShowHouseFlash] = useState(false);
  const [showHouseShake, setShowHouseShake] = useState(false);

  const treasureTimerRef = useRef<number | null>(null);
  const houseFlashTimerRef = useRef<number | null>(null);
  const houseFlashOffTimerRef = useRef<number | null>(null);
  const houseShakeOffTimerRef = useRef<number | null>(null);
  const prevCompletedRef = useRef(0);

  // 画像差し替え時はこの数字を変える
  const houseAssetVersion = "v4";

  function handleReset() {
    if (!eventSlug) return;

    if (!confirm("進行状況をリセットしますか？")) return;

    const keys = storageKeys(eventSlug);

    localStorage.removeItem(keys.progress);
    localStorage.removeItem(keys.introSeen);
    localStorage.removeItem(keys.treasureShown);

    if (treasureTimerRef.current) {
      window.clearTimeout(treasureTimerRef.current);
      treasureTimerRef.current = null;
    }

    if (houseFlashTimerRef.current) {
      window.clearTimeout(houseFlashTimerRef.current);
      houseFlashTimerRef.current = null;
    }

    if (houseFlashOffTimerRef.current) {
      window.clearTimeout(houseFlashOffTimerRef.current);
      houseFlashOffTimerRef.current = null;
    }

    if (houseShakeOffTimerRef.current) {
      window.clearTimeout(houseShakeOffTimerRef.current);
      houseShakeOffTimerRef.current = null;
    }

    prevCompletedRef.current = 0;

    setProgress({
      completedSpotIds: [],
      energy: 0,
      couponIssued: false,
    });
    setShowTreasure(false);
    setShowIntro(false);
    setShowHouseFlash(false);
    setShowHouseShake(false);

    location.reload();
  }

  useEffect(() => {
    return () => {
      if (treasureTimerRef.current) {
        window.clearTimeout(treasureTimerRef.current);
      }
      if (houseFlashTimerRef.current) {
        window.clearTimeout(houseFlashTimerRef.current);
      }
      if (houseFlashOffTimerRef.current) {
        window.clearTimeout(houseFlashOffTimerRef.current);
      }
      if (houseShakeOffTimerRef.current) {
        window.clearTimeout(houseShakeOffTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    params.then(({ eventSlug }) => setEventSlug(eventSlug));
  }, [params]);

  useEffect(() => {
    if (!eventSlug) return;

    setLoading(true);

    fetch(`/api/public/event/${eventSlug}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setData({ event: json.event, spots: json.spots });

          const pid = getOrCreateParticipantId(eventSlug);
          setParticipantId(pid);

          const saved = loadProgress(eventSlug);
          setProgress(saved);
          prevCompletedRef.current = saved.completedSpotIds.length;

          if (!hasSeenIntro(eventSlug) && json.event.rally.introEnabled) {
            setShowIntro(true);
          }

          const completed = saved.completedSpotIds.length;
          const required = json.event.rally.requiredSpotCount;

          if (
            completed >= required &&
            !saved.couponIssued &&
            !hasShownTreasure(eventSlug)
          ) {
            if (treasureTimerRef.current) {
              window.clearTimeout(treasureTimerRef.current);
            }
            if (houseFlashTimerRef.current) {
              window.clearTimeout(houseFlashTimerRef.current);
            }
            if (houseFlashOffTimerRef.current) {
              window.clearTimeout(houseFlashOffTimerRef.current);
            }
            if (houseShakeOffTimerRef.current) {
              window.clearTimeout(houseShakeOffTimerRef.current);
            }

            setShowHouseShake(true);

            houseShakeOffTimerRef.current = window.setTimeout(() => {
              setShowHouseShake(false);
            }, 520);

            houseFlashTimerRef.current = window.setTimeout(() => {
              setShowHouseFlash(true);
            }, 90);

            houseFlashOffTimerRef.current = window.setTimeout(() => {
              setShowHouseFlash(false);
            }, 1100);

            treasureTimerRef.current = window.setTimeout(() => {
              setShowTreasure(true);
            }, 2200);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [eventSlug]);

  const completedCount = progress.completedSpotIds.length;

  useEffect(() => {
    if (!data || !eventSlug) return;

    const required = data.event.rally.requiredSpotCount;
    const justCompleted =
      completedCount >= required && prevCompletedRef.current < required;

    if (
      justCompleted &&
      !progress.couponIssued &&
      !hasShownTreasure(eventSlug)
    ) {
      if (treasureTimerRef.current) {
        window.clearTimeout(treasureTimerRef.current);
      }
      if (houseFlashTimerRef.current) {
        window.clearTimeout(houseFlashTimerRef.current);
      }
      if (houseFlashOffTimerRef.current) {
        window.clearTimeout(houseFlashOffTimerRef.current);
      }
      if (houseShakeOffTimerRef.current) {
        window.clearTimeout(houseShakeOffTimerRef.current);
      }

      setShowHouseShake(true);

      houseShakeOffTimerRef.current = window.setTimeout(() => {
        setShowHouseShake(false);
      }, 520);

      houseFlashTimerRef.current = window.setTimeout(() => {
        setShowHouseFlash(true);
      }, 90);

      houseFlashOffTimerRef.current = window.setTimeout(() => {
        setShowHouseFlash(false);
      }, 1100);

      treasureTimerRef.current = window.setTimeout(() => {
        setShowTreasure(true);
      }, 2200);
    }

    prevCompletedRef.current = completedCount;
  }, [completedCount, data, eventSlug, progress.couponIssued]);

  const couponCode = useMemo(() => {
    if (!data || !participantId) return "";

    const prefix = data.event.coupon?.prefix ?? "AI-RALLY";

    return makeCouponCode(prefix, participantId);
  }, [data, participantId]);

  const houseSrc = useMemo(() => {
    if (completedCount <= 0) return `/house_0.png?${houseAssetVersion}`;
    if (completedCount === 1) return `/house_1.png?${houseAssetVersion}`;
    if (completedCount === 2) return `/house_2.png?${houseAssetVersion}`;
    return `/house_3.png?${houseAssetVersion}`;
  }, [completedCount]);

  const houseGlowSrc = useMemo(() => {
    return `/house_glow.png?${houseAssetVersion}`;
  }, []);

  const requiredCount = data?.event.rally.requiredSpotCount ?? 3;
  const isComplete = completedCount >= requiredCount;

  const handleTreasureFinish = () => {
    if (!eventSlug) return;

    const next = {
      ...progress,
      energy: 100,
      couponIssued: true,
    };

    setProgress(next);
    saveProgress(eventSlug, next);
    markTreasureShown(eventSlug);
    setShowTreasure(false);
  };

  if (loading || !data) {
    return <div className="min-h-screen bg-slate-950 p-6 text-white">Loading...</div>;
  }

  return (
    <main
      className={`min-h-screen bg-cover bg-center text-white ${
        showHouseShake ? "animate-[houseScreenShake_0.52s_ease-out]" : ""
      }`}
      style={{ backgroundImage: `url(${data.event.theme.backgroundImageUrl})` }}
    >
      <div className="min-h-screen px-4 py-6 pb-24">
        <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-xl flex-col justify-end space-y-4">
          {!showTreasure && (
            <div className="flex justify-center">
              <div
                className={`relative flex h-[160px] w-[160px] items-center justify-center overflow-hidden rounded-[28px] border border-white/20 bg-black/30 backdrop-blur-md transition-all duration-500 sm:h-[190px] sm:w-[190px] ${
                  isComplete
                    ? "shadow-[0_0_40px_rgba(255,255,255,0.18)]"
                    : "shadow-[0_14px_30px_rgba(0,0,0,0.35)]"
                } ${showHouseShake ? "animate-[houseBoxShake_0.52s_ease-out]" : ""}`}
              >
                <div
                  className={`absolute inset-0 flex items-center justify-center ${
                    isComplete ? "opacity-100" : "opacity-70"
                  }`}
                >
                  <div
                    className={`rounded-full bg-white/20 blur-2xl transition-all duration-700 ${
                      isComplete
                        ? "h-[120px] w-[120px] sm:h-[145px] sm:w-[145px]"
                        : "h-[90px] w-[90px] sm:h-[110px] sm:w-[110px]"
                    }`}
                  />
                </div>

                {isComplete && (
                  <div className="absolute inset-0 z-0 animate-pulse">
                    <Image
                      src={houseGlowSrc}
                      alt="glow"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}

                {showHouseFlash && (
                  <>
                    <div className="pointer-events-none absolute inset-0 z-[12] flex items-center justify-center">
                      <div className="house-flash-core" />
                    </div>

                    <div className="pointer-events-none absolute inset-0 z-[11] flex items-center justify-center">
                      <div className="house-flash-ring" />
                    </div>

                    <div className="pointer-events-none absolute inset-0 z-[13] house-screen-flash" />

                    <div className="pointer-events-none absolute inset-0 z-[14] flex items-center justify-center">
                      <div className="house-flash-spark" />
                    </div>
                  </>
                )}

                <div
                  key={houseSrc}
                  className={`absolute inset-0 z-10 animate-[houseStageIn_0.8s_ease-out] ${
                    isComplete ? "animate-[houseCompletePop_1.1s_ease-out]" : ""
                  }`}
                >
                  <Image
                    src={houseSrc}
                    alt="house build stage"
                    fill
                    className="object-contain drop-shadow-[0_14px_28px_rgba(0,0,0,0.65)]"
                    unoptimized
                  />
                </div>
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-white/15 bg-black/35 p-4 backdrop-blur-sm">
            <div className="grid grid-cols-3 gap-3">
              {data.spots.map((spot) => {
                const completed = progress.completedSpotIds.includes(spot.id);

                return (
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
                        className={`object-cover transition ${
                          completed ? "grayscale" : ""
                        }`}
                      />

                      {!completed && (
                        <div className="camera-badge absolute bottom-2 right-2 z-10 rounded-full bg-black/65 p-2 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="h-4 w-4 text-white"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4 7h3l1.4-2h7.2L17 7h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z"
                            />
                            <circle cx="12" cy="12.5" r="3.5" />
                          </svg>
                        </div>
                      )}

                      {completed && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-black text-slate-900">
                            解析成功
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {progress.couponIssued && (
            <a
              href={`/${eventSlug}/coupon`}
              className="block rounded-2xl bg-yellow-400 px-4 py-4 text-center text-lg font-bold text-slate-900"
            >
              クーポンを見る
            </a>
          )}
        </div>
      </div>

      <IntroModal
        open={showIntro}
        title={data.event.theme.storyTitle || "ミッション開始"}
        body={data.event.theme.storyBody || ""}
        onClose={() => {
          markIntroSeen(eventSlug);
          setShowIntro(false);
        }}
      />

      <TreasureAnimation
        open={showTreasure}
        couponCode={couponCode}
        onFinish={handleTreasureFinish}
      />

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/80 p-3 backdrop-blur">
        <div className="mx-auto max-w-xl">
          <button
            onClick={handleReset}
            className="w-full rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white"
          >
            開発用リセット
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes houseStageIn {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.94);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes houseCompletePop {
          0% {
            opacity: 0;
            transform: translateY(12px) scale(0.88);
          }
          45% {
            opacity: 1;
            transform: translateY(0) scale(1.08);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes houseBoxShake {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          10% {
            transform: translate3d(-2px, 1px, 0) scale(1.01);
          }
          20% {
            transform: translate3d(3px, -2px, 0) scale(1.01);
          }
          30% {
            transform: translate3d(-4px, 2px, 0) scale(1.015);
          }
          40% {
            transform: translate3d(4px, -2px, 0) scale(1.015);
          }
          50% {
            transform: translate3d(-3px, 2px, 0) scale(1.01);
          }
          60% {
            transform: translate3d(3px, -1px, 0) scale(1.01);
          }
          70% {
            transform: translate3d(-2px, 1px, 0) scale(1.005);
          }
          80% {
            transform: translate3d(2px, -1px, 0) scale(1.003);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes houseScreenShake {
          0% {
            transform: translate3d(0, 0, 0);
          }
          12% {
            transform: translate3d(-1px, 0, 0);
          }
          24% {
            transform: translate3d(2px, -1px, 0);
          }
          36% {
            transform: translate3d(-2px, 1px, 0);
          }
          48% {
            transform: translate3d(2px, 0, 0);
          }
          60% {
            transform: translate3d(-1px, 1px, 0);
          }
          72% {
            transform: translate3d(1px, -1px, 0);
          }
          100% {
            transform: translate3d(0, 0, 0);
          }
        }

        @keyframes houseFlashCore {
          0% {
            opacity: 0;
            transform: scale(0.18);
            filter: blur(6px);
          }
          12% {
            opacity: 1;
            transform: scale(0.42);
            filter: blur(8px);
          }
          35% {
            opacity: 1;
            transform: scale(1.18);
            filter: blur(14px);
          }
          70% {
            opacity: 0.6;
            transform: scale(1.75);
            filter: blur(18px);
          }
          100% {
            opacity: 0;
            transform: scale(2.1);
            filter: blur(24px);
          }
        }

        @keyframes houseFlashRing {
          0% {
            opacity: 0;
            transform: scale(0.2);
            filter: blur(10px);
          }
          18% {
            opacity: 0.95;
            transform: scale(0.75);
            filter: blur(16px);
          }
          45% {
            opacity: 0.85;
            transform: scale(1.45);
            filter: blur(24px);
          }
          100% {
            opacity: 0;
            transform: scale(2.5);
            filter: blur(36px);
          }
        }

        @keyframes houseScreenFlash {
          0% {
            opacity: 0;
          }
          10% {
            opacity: 0.88;
          }
          28% {
            opacity: 0.42;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes houseFlashSpark {
          0% {
            opacity: 0;
            transform: scale(0.4);
          }
          20% {
            opacity: 0.9;
            transform: scale(1);
          }
          55% {
            opacity: 0.45;
            transform: scale(1.4);
          }
          100% {
            opacity: 0;
            transform: scale(1.8);
          }
        }

        @keyframes cameraBadgeGlow {
          0% {
            opacity: 0.92;
            transform: scale(1);
            box-shadow: 0 0 0 rgba(255, 255, 255, 0);
          }
          35% {
            opacity: 1;
            transform: scale(1.08);
            box-shadow:
              0 0 12px rgba(255, 255, 255, 0.45),
              0 0 24px rgba(34, 211, 238, 0.28);
          }
          60% {
            opacity: 0.96;
            transform: scale(1.02);
            box-shadow:
              0 0 8px rgba(255, 255, 255, 0.25),
              0 0 18px rgba(34, 211, 238, 0.16);
          }
          100% {
            opacity: 0.92;
            transform: scale(1);
            box-shadow: 0 0 0 rgba(255, 255, 255, 0);
          }
        }

        .house-flash-core {
          width: 64px;
          height: 64px;
          border-radius: 9999px;
          background:
            radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,250,220,0.98) 28%, rgba(255,233,150,0.82) 54%, rgba(255,220,120,0.28) 74%, rgba(255,255,255,0) 100%);
          mix-blend-mode: screen;
          animation: houseFlashCore 0.95s ease-out forwards;
        }

        .house-flash-ring {
          width: 180px;
          height: 180px;
          border-radius: 9999px;
          background:
            radial-gradient(circle, rgba(255,245,190,0.9) 0%, rgba(255,230,150,0.62) 34%, rgba(255,214,102,0.34) 58%, rgba(255,255,255,0) 100%);
          mix-blend-mode: screen;
          animation: houseFlashRing 1.05s ease-out forwards;
        }

        .house-screen-flash {
          background:
            radial-gradient(circle at center, rgba(255,255,255,0.72) 0%, rgba(255,248,220,0.36) 34%, rgba(255,255,255,0.12) 55%, rgba(255,255,255,0) 78%);
          animation: houseScreenFlash 0.75s ease-out forwards;
          mix-blend-mode: screen;
        }

        .house-flash-spark {
          width: 150px;
          height: 150px;
          background:
            conic-gradient(
              from 0deg,
              rgba(255,255,255,0) 0deg,
              rgba(255,255,255,0.9) 12deg,
              rgba(255,255,255,0) 24deg,
              rgba(255,245,180,0) 54deg,
              rgba(255,245,180,0.8) 66deg,
              rgba(255,245,180,0) 78deg,
              rgba(255,255,255,0) 120deg,
              rgba(255,255,255,0.88) 132deg,
              rgba(255,255,255,0) 144deg,
              rgba(255,240,160,0) 210deg,
              rgba(255,240,160,0.72) 224deg,
              rgba(255,240,160,0) 238deg,
              rgba(255,255,255,0) 300deg,
              rgba(255,255,255,0.85) 314deg,
              rgba(255,255,255,0) 328deg,
              rgba(255,255,255,0) 360deg
            );
          mask-image: radial-gradient(circle, rgba(0,0,0,0) 0%, rgba(0,0,0,0.9) 28%, rgba(0,0,0,0) 76%);
          -webkit-mask-image: radial-gradient(circle, rgba(0,0,0,0) 0%, rgba(0,0,0,0.9) 28%, rgba(0,0,0,0) 76%);
          filter: blur(1.5px);
          animation: houseFlashSpark 0.9s ease-out forwards;
          mix-blend-mode: screen;
        }

        .camera-badge {
          animation: cameraBadgeGlow 1.6s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}