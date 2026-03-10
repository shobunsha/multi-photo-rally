import { NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/event-service";
import { makeCouponCode } from "@/lib/coupon-service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventSlug = searchParams.get("eventSlug");
  const participantId = searchParams.get("participantId");

  if (!eventSlug || !participantId) {
    return NextResponse.json(
      { ok: false, message: "パラメータが不足しています。" },
      { status: 400 }
    );
  }

  const event = await getEventBySlug(eventSlug);
  if (!event) {
    return NextResponse.json(
      { ok: false, message: "イベントが見つかりません。" },
      { status: 404 }
    );
  }

  const code = makeCouponCode(event.coupon.prefix, participantId);

  return NextResponse.json({
    ok: true,
    code,
    title: event.coupon.title,
    description: event.coupon.description,
    redeemNote: event.coupon.redeemNote ?? "",
  });
}