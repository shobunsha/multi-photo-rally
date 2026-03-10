import { NextResponse } from "next/server";
import { updateSpotById } from "@/lib/event-service";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ spotId: string }> }
) {
  try {
    const { spotId } = await context.params;
    const body = await req.json();

    const updated = await updateSpotById(spotId, body);

    if (!updated) {
      return NextResponse.json(
        { ok: false, message: "スポットが見つかりません。" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      spot: updated,
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "更新に失敗しました。" },
      { status: 500 }
    );
  }
}