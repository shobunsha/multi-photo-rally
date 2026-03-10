import { NextResponse } from "next/server";
import { listRecentRedeems } from "@/lib/coupon-service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventSlug = searchParams.get("eventSlug");
    const staffPin = searchParams.get("staffPin");
    const limit = Number(searchParams.get("limit") || "100");

    if (!eventSlug || !staffPin) {
      return NextResponse.json(
        { ok: false, message: "必要な情報が不足しています。" },
        { status: 400 }
      );
    }

    if (staffPin !== process.env.STAFF_PIN) {
      return NextResponse.json(
        { ok: false, message: "PINが違います。" },
        { status: 401 }
      );
    }

    const items = await listRecentRedeems({
      eventSlug,
      limit,
    });

    return NextResponse.json({
      ok: true,
      items,
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "サーバーエラーです。" },
      { status: 500 }
    );
  }
}