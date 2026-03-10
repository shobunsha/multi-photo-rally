"use client";

import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { getOrCreateParticipantId } from "@/lib/storage";

export default function CouponPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const [eventSlug, setEventSlug] = useState("");
  const [data, setData] = useState<{
    code: string;
    title: string;
    description: string;
    redeemNote: string;
  } | null>(null);

  useEffect(() => {
    params.then(({ eventSlug }) => setEventSlug(eventSlug));
  }, [params]);

  useEffect(() => {
    if (!eventSlug) return;

    const participantId = getOrCreateParticipantId(eventSlug);

    fetch(
      `/api/public/coupon/my?eventSlug=${encodeURIComponent(
        eventSlug
      )}&participantId=${encodeURIComponent(participantId)}`
    )
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setData({
            code: json.code,
            title: json.title,
            description: json.description,
            redeemNote: json.redeemNote,
          });
        }
      });
  }, [eventSlug]);

  if (!data) {
    return <div className="min-h-screen bg-slate-950 p-6 text-white">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
        <div className="mb-2 text-2xl font-black">{data.title}</div>
        <p className="mb-6 text-sm text-white/75">{data.description}</p>

        <div className="mb-6 flex justify-center rounded-2xl bg-white p-4">
          <QRCodeCanvas value={data.code} size={220} />
        </div>

        <div className="mb-3 text-xl font-bold">{data.code}</div>
        <div className="text-sm text-white/70">{data.redeemNote}</div>
      </div>
    </main>
  );
}