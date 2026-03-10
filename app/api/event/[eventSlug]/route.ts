import { NextResponse } from "next/server";
import { getPublicEventPayload } from "@/lib/event-service";

export async function GET(
  _req: Request,
  context: { params: Promise<{ eventSlug: string }> }
) {
  const { eventSlug } = await context.params;
  const payload = await getPublicEventPayload(eventSlug);

  if (!payload) {
    return NextResponse.json(
      { ok: false, message: "イベントが見つかりません。" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    ...payload,
  });
}