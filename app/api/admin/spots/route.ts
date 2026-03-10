import { NextResponse } from "next/server";
import { createSpot, getSpotsByEventId } from "@/lib/event-service";
import type { Spot } from "@/lib/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json(
      { ok: false, message: "eventId が必要です。" },
      { status: 400 }
    );
  }

  const spots = await getSpotsByEventId(eventId);

  return NextResponse.json({
    ok: true,
    spots,
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Spot;

    if (!body.id || !body.eventId || !body.title) {
      return NextResponse.json(
        { ok: false, message: "必須項目が不足しています。" },
        { status: 400 }
      );
    }

    const created = await createSpot(body);

    return NextResponse.json({
      ok: true,
      spot: created,
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "スポット追加に失敗しました。" },
      { status: 500 }
    );
  }
}