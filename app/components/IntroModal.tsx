"use client";

import { useEffect, useMemo, useState } from "react";

type Page = {
  title?: string;
  body: string;
};

export default function IntroModal({
  open,
  title,
  body,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  onClose: () => void;
}) {
  const pages = useMemo<Page[]>(
    () => [
      {
        body: "ようこそ、見習い建築士さん！\nここは夢と技術が詰まった、住宅展示場。",
      },
      {
        body: "君には今日、この展示場を巡りながら家づくりの「3つのヒント」を集めてほしい。",
      },
      {
        body: "モデルハウスに隠された、暮らしのこだわり。\nカメラで、その魅力を写真に収めるんだ。",
      },
      {
        body: "すべてのヒントが集まったとき\n「理想の家」が完成するはずさ。",
      },
      {
        body: "さあ、準備はいいかい？\n建築士の修行、いよいよスタートだ！",
      },
    ],
    []
  );

  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setPageIndex(0);
    }
  }, [open]);

  if (!open) return null;

  const current = pages[pageIndex];
  const isLast = pageIndex === pages.length - 1;

  function handleNext() {
    if (isLast) {
      onClose();
      return;
    }
    setPageIndex((prev) => prev + 1);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-6">
      <div className="w-full max-w-md rounded-[28px] border border-cyan-300/20 bg-[#071827]/90 p-0 text-white shadow-2xl backdrop-blur-md overflow-hidden">
        <div
          onClick={handleNext}
          className="relative min-h-[320px] cursor-pointer bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.06),transparent_60%)] px-6 py-6"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute right-4 top-4 text-3xl leading-none text-white/80 transition hover:text-white"
            aria-label="閉じる"
          >
            ×
          </button>

          <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(0,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.12)_1px,transparent_1px)] [background-size:18px_18px]" />

          <div className="relative z-10 flex min-h-[320px] flex-col justify-between">
            <div className="pt-8">
              {pageIndex === 0 && title ? (
                <div className="mb-4 text-base font-black tracking-wide text-cyan-300">
                  {title}
                </div>
              ) : null}

              <p className="whitespace-pre-line text-[26px] font-black leading-[1.75] text-white">
                {current.body}
              </p>
            </div>

            <div className="pb-2 text-center">
              <div className="mb-2 flex justify-center gap-2">
                {pages.map((_, i) => (
                  <span
                    key={i}
                    className={`h-2.5 w-2.5 rounded-full ${
                      i === pageIndex ? "bg-cyan-300" : "bg-white/25"
                    }`}
                  />
                ))}
              </div>

              <div className="animate-bounce text-2xl font-black text-cyan-300">
                ▼
              </div>
              <div className="mt-1 text-sm font-bold text-white/75">
                {isLast ? "タップしてはじめる" : "タップして続ける"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}