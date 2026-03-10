import { NextResponse } from "next/server";

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

    // 仮実装。将来はKVへ保存
    return NextResponse.json({
      ok: true,
      message: "使用済みにしました（仮実装）。",
      used_at: new Date().toISOString(),
      used_by: body.staffName || "staff",
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "サーバーエラーです。" },
      { status: 500 }
    );
  }
}