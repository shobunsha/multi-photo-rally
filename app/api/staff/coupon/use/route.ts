import { NextResponse } from "next/server";
import { redeemCoupon } from "@/lib/coupon-service";

type Body = {
  eventSlug: string;
  code: string;
  staffPin: string;
  staffName?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<Body>;

    if (!body.eventSlug || !body.code || !body.staffPin) {
      return NextResponse.json(
        { ok: false, message: "入力が不足しています。" },
        { status: 400 }
      );
    }

    if (body.staffPin !== process.env.STAFF_PIN) {
      return NextResponse.json(
        { ok: false, message: "PINが違います。" },
        { status: 401 }
      );
    }

    const result = await redeemCoupon({
      eventSlug: body.eventSlug,
      code: body.code.trim(),
      staffName: body.staffName,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: "このクーポンはすでに使用済みです。",
          used_at: result.entry.usedAt,
          used_by: result.entry.usedBy,
          code: result.entry.code,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "使用済みにしました。",
      used_at: result.entry.usedAt,
      used_by: result.entry.usedBy,
      code: result.entry.code,
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "サーバーエラーです。" },
      { status: 500 }
    );
  }
}