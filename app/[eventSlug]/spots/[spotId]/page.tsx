"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicEventPayload, Spot } from "@/lib/types";
import { loadProgress, saveProgress } from "@/lib/storage";
import ScanningOverlay from "@/app/components/ScanningOverlay";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getOrCreateParticipantId(eventSlug: string) {
  const key = `participant_id:${eventSlug}`;
  const existing = localStorage.getItem(key);
  if (existing) return existing;

  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

type JudgeState = "idle" | "judging" | "success" | "ng";

export default function SpotPage({
  params,
}: {
  params: Promise<{ eventSlug: string; spotId: string }>;
}) {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [eventSlug, setEventSlug] = useState("");
  const [spotId, setSpotId] = useState("");
  const [payload, setPayload] = useState<PublicEventPayload | null>(null);
  const [spot, setSpot] = useState<Spot | null>(null);

  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const [imageDataUrl, setImageDataUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  const [judgeState, setJudgeState] = useState<JudgeState>("idle");
  const [judgeComment, setJudgeComment] = useState("");
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    params.then(({ eventSlug, spotId }) => {
      setEventSlug(eventSlug);
      setSpotId(spotId);
    });
  }, [params]);

  useEffect(() => {
    if (!eventSlug) return;

    fetch(`/api/public/event/${eventSlug}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          const data = {
            event: json.event,
            spots: json.spots,
          };
          setPayload(data);
          const found = data.spots.find((s: Spot) => s.id === spotId) ?? null;
          setSpot(found);
        }
      });
  }, [eventSlug, spotId]);

  useEffect(() => {
    if (judgeState !== "judging") {
      setScanProgress(0);
      return;
    }

    let progress = 0;
    const timer = window.setInterval(() => {
      progress += Math.random() * 12 + 6;
      if (progress > 92) progress = 92;
      setScanProgress(Math.floor(progress));
    }, 180);

    return () => window.clearInterval(timer);
  }, [judgeState]);

  const alreadyCompleted = useMemo(() => {
    if (!eventSlug || !spot) return false;
    return loadProgress(eventSlug).completedSpotIds.includes(spot.id);
  }, [eventSlug, spot]);

  async function handleSelectFile(file: File) {
    try {
      setMessage("画像を読み込み中...");
      const dataUrl = await fileToDataUrl(file);
      setImageDataUrl(dataUrl);
      setPreviewUrl(dataUrl);
      setJudgeState("idle");
      setJudgeComment("");
      setMessage("画像を選択しました。下の送信ボタンで判定できます。");
    } catch {
      setMessage("画像の読み込みに失敗しました。");
    }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleSelectFile(file);
  }

  function openCameraOrPicker() {
    cameraInputRef.current?.click();
  }

  async function handleJudge() {
    if (!eventSlug || !spot || !payload) return;

    if (!imageDataUrl) {
      setMessage("先に写真を選択してください。");
      return;
    }

    const participantId = getOrCreateParticipantId(eventSlug);

    setBusy(true);
    setJudgeState("judging");
    setJudgeComment("");
    setMessage("AI判定中...");

    try {
      const startedAt = Date.now();

      const res = await fetch("/api/public/judge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventSlug,
          spotId: spot.id,
          participantId,
          imageDataUrl,
        }),
      });

      const json = await res.json();

      const elapsed = Date.now() - startedAt;
      const minDuration = 3000;
      const waitMs = Math.max(0, minDuration - elapsed);

      await new Promise((resolve) => window.setTimeout(resolve, waitMs));

      if (json.ok) {
        setScanProgress(100);
        setJudgeState("success");
        setJudgeComment("OK! 修復に成功しました");
        setMessage(`成功: ${json.reason || "一致と判定されました。"}`);

        const saved = loadProgress(eventSlug);

        if (!saved.completedSpotIds.includes(spot.id)) {
          const nextCompleted = [...saved.completedSpotIds, spot.id];
          const required = payload.event.rally.requiredSpotCount ?? 3;
          const nextEnergy = Math.min(
            100,
            Math.round((nextCompleted.length / required) * 100)
          );

          saveProgress(eventSlug, {
            ...saved,
            completedSpotIds: nextCompleted,
            energy: nextEnergy,
            couponIssued: saved.couponIssued ?? false,
          });
        }

        window.setTimeout(() => {
          router.push(`/${eventSlug}/card`);
        }, 1400);
      } else {
        setScanProgress(100);
        setJudgeState("ng");
        setJudgeComment(json.reason || "NG もう一度撮影してください");
        setMessage(`失敗: ${json.reason || "別の場所の可能性があります。"}`);
      }
    } catch {
      await new Promise((resolve) => window.setTimeout(resolve, 3000));
      setJudgeState("ng");
      setJudgeComment("NG 判定中にエラーが発生しました");
      setMessage("判定中にエラーが発生しました。");
    } finally {
      setBusy(false);
    }
  }

  if (!payload || !spot) {
    return <div className="min-h-screen bg-slate-950 p-6 text-white">Loading...</div>;
  }

  return (
    <main
      className="min-h-screen bg-cover bg-center text-white"
      style={{ backgroundImage: `url(${payload.event.theme.backgroundImageUrl})` }}
    >
      <div className="min-h-screen bg-black/55 pb-28">
        <div className="mx-auto max-w-xl px-4 py-4">
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="rounded-full bg-white px-4 py-2 text-sm font-bold text-black shadow"
            >
              ← 戻る
            </button>

            <div className="rounded-full bg-black/70 px-4 py-2 text-sm font-bold text-white">
              {alreadyCompleted ? "解析済み" : "未解析"}
            </div>
          </div>

          <div className="mb-4 rounded-[28px] border border-white/10 bg-black/35 p-4 backdrop-blur-sm">
            <div className="mb-1 text-xl font-black">
              この場所を撮影してアップロード
            </div>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onFileChange}
              className="hidden"
            />

            <button
              onClick={openCameraOrPicker}
              className="mb-3 w-full rounded-2xl border border-cyan-300/40 bg-cyan-500/15 px-4 py-4 text-center text-lg font-bold text-white"
            >
              📸 今すぐ撮影する
            </button>
          </div>

          <div className="mb-4 rounded-[24px] bg-white p-4 text-slate-900 shadow">
            <div className="mb-2 text-lg font-black">あなたの写真</div>

            {!previewUrl ? (
              <div className="rounded-2xl bg-slate-100 px-4 py-6 text-sm text-slate-500">
                まだ写真が選択されていません
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="relative aspect-[4/3] w-full bg-slate-100">
                  <Image
                    src={previewUrl}
                    alt="選択した写真"
                    fill
                    className="object-cover"
                    unoptimized
                  />

                  <Image
                    src="/grid.png"
                    alt="grid"
                    fill
                    className="pointer-events-none z-10 object-cover opacity-60"
                    unoptimized
                  />

                  <Image
                    src="/hud-frame.png"
                    alt="hud frame"
                    fill
                    className="pointer-events-none z-20 object-contain opacity-95"
                    unoptimized
                  />

                  <ScanningOverlay active={judgeState === "judging"} />

                  {(judgeState === "success" || judgeState === "ng") && (
                    <div className="absolute inset-0 z-30 bg-black/35" />
                  )}

                  <div className="absolute left-1/2 top-1/2 z-40 w-[68%] -translate-x-1/2 -translate-y-1/2">
                    <div className="relative h-8 w-full">
                      <Image
                        src="/judge-progress-bar.png"
                        alt="progress frame"
                        fill
                        className="pointer-events-none object-fill"
                        unoptimized
                      />
                      <div className="absolute inset-y-[9px] left-[18px] right-[18px] overflow-hidden rounded-full">
                        <div
                          className={`h-full transition-all duration-200 ${
                            judgeState === "success"
                              ? "bg-emerald-400"
                              : judgeState === "ng"
                              ? "bg-rose-400"
                              : "bg-cyan-400"
                          }`}
                          style={{ width: `${scanProgress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-1 text-center text-sm font-bold text-white drop-shadow">
                      {judgeState === "judging" && `${scanProgress}%　照合中`}
                      {judgeState === "success" && "100%　一致しました"}
                      {judgeState === "ng" && "100%　不一致"}
                    </div>
                  </div>

                  {(judgeState === "success" || judgeState === "ng") && (
                    <div className="absolute inset-x-4 top-[36%] z-50 -translate-y-1/2">
                      <div
                        className={`rounded-2xl border px-4 py-4 text-center text-xl font-black shadow-2xl backdrop-blur-md ${
                          judgeState === "success"
                            ? "border-emerald-300/70 bg-emerald-500/25 text-white"
                            : "border-rose-300/70 bg-rose-500/25 text-white"
                        }`}
                      >
                        {judgeComment}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mb-4 rounded-[24px] bg-white p-4 text-slate-900 shadow">
            <div className="mb-2 text-lg font-black">見本写真</div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="relative aspect-[4/3] w-full bg-slate-100">
                <Image
                  src={spot.refImageUrl}
                  alt={spot.title}
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {spot.hintText && (
              <div className="mt-3 text-sm text-slate-600">ヒント: {spot.hintText}</div>
            )}
          </div>

          {message && (
            <div className="mb-4 rounded-2xl border border-white/15 bg-black/35 p-4 text-sm text-white backdrop-blur-sm">
              {message}
            </div>
          )}
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/80 p-3 backdrop-blur-md">
          <div className="mx-auto max-w-xl">
            <button
              onClick={handleJudge}
              disabled={busy || !imageDataUrl}
              className="w-full rounded-2xl bg-white px-4 py-4 text-lg font-black text-slate-900 disabled:cursor-not-allowed disabled:bg-white/40 disabled:text-slate-500"
            >
              {busy ? "判定中..." : "写真送信　解析スキャン"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}