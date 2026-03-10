import { NextResponse } from "next/server";
import { createEvent, listEvents } from "@/lib/event-service";

export async function GET() {
  const events = await listEvents();

  return NextResponse.json({
    ok: true,
    events,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.name || !body.slug || !body.publicTitle) {
      return NextResponse.json(
        { ok: false, message: "必須項目が不足しています。" },
        { status: 400 }
      );
    }

    const created = await createEvent({
      name: body.name,
      slug: body.slug,
      publicTitle: body.publicTitle,
      storyTitle: body.storyTitle || "新しいミッションに挑戦",
      storyBody:
        body.storyBody ||
        "会場内の3つの見本スポットを探し、撮影してミッションをクリアしてください。",
      backgroundImageUrl: body.backgroundImageUrl || "/demo/housing-bg.jpg",
      couponTitle: body.couponTitle || "来場特典",
      couponDescription:
        body.couponDescription || "受付でノベルティ引換ができます。",
      couponPrefix: body.couponPrefix || "NEW",
    });

    return NextResponse.json({
      ok: true,
      event: created.event,
      spots: created.spots,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "slug_duplicate") {
      return NextResponse.json(
        { ok: false, message: "そのslugは既に使われています。" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { ok: false, message: "イベント作成に失敗しました。" },
      { status: 500 }
    );
  }
}