export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getEventBySlug, getSpotById } from "@/lib/event-service";
import { judgePhoto } from "@/lib/judge-service";
import {
  buildJudgeCacheKey,
  checkRateLimit,
  getJudgeCache,
  hashImageDataUrl,
  isDuplicateRecentSubmission,
  recordJudgeAttempt,
  setJudgeCache,
} from "@/lib/judge-guard";

type JudgeRequest = {
  eventSlug: string;
  spotId: string;
  participantId: string;
  imageDataUrl: string;
};

function isDataUrl(x: unknown): x is string {
  return typeof x === "string" && x.startsWith("data:image/");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<JudgeRequest>;

    if (
      !body.eventSlug ||
      !body.spotId ||
      !body.participantId ||
      !isDataUrl(body.imageDataUrl)
    ) {
      return NextResponse.json(
        { ok: false, reason: "リクエストが不正です。" },
        { status: 400 }
      );
    }

    const rate = await checkRateLimit({
      participantId: body.participantId,
      eventSlug: body.eventSlug,
    });

    if (!rate.ok) {
      return NextResponse.json(
        { ok: false, reason: rate.reason },
        { status: 429 }
      );
    }

    const imageHash = hashImageDataUrl(body.imageDataUrl);

    const duplicate = await isDuplicateRecentSubmission({
      participantId: body.participantId,
      eventSlug: body.eventSlug,
      hash: imageHash,
    });

    // 開発中は同じ写真の再送防止を一時的にオフにしたい場合はこの if をコメントアウト
    // if (duplicate) {
    //   return NextResponse.json(
    //     {
    //       ok: false,
    //       reason: "同じ写真が送信済みです。別の構図で撮り直してください。",
    //     },
    //     { status: 409 }
    //   );
    // }

    const cacheKey = buildJudgeCacheKey(
      body.eventSlug,
      body.spotId,
      imageHash
    );

    const cached = await getJudgeCache(cacheKey);

    if (cached) {
      await recordJudgeAttempt({
        participantId: body.participantId,
        eventSlug: body.eventSlug,
      });

      return NextResponse.json(cached);
    }

    const event = await getEventBySlug(body.eventSlug);
    if (!event) {
      return NextResponse.json(
        { ok: false, reason: "イベントが見つかりません。" },
        { status: 404 }
      );
    }

    const spot = await getSpotById(event.id, body.spotId);
    if (!spot) {
      return NextResponse.json(
        { ok: false, reason: "スポットが見つかりません。" },
        { status: 404 }
      );
    }

    const refImageUrl = new URL(spot.refImageUrl, req.url).toString();

    const result = await judgePhoto({
      spotTitle: spot.title,
      refImageUrl,
      imageDataUrl: body.imageDataUrl,
    });

    await setJudgeCache(cacheKey, result);

    await recordJudgeAttempt({
      participantId: body.participantId,
      eventSlug: body.eventSlug,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("judge route error:", error);

    return NextResponse.json(
      {
        ok: false,
        reason: "判定中にエラーが発生しました。",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}