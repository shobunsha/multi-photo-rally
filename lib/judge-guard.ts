import crypto from "crypto";
import { kv } from "@vercel/kv";
import type { JudgeResult } from "@/lib/types";

type JudgeCacheEntry = {
  key: string;
  eventSlug: string;
  spotId: string;
  imageHash: string;
  result: JudgeResult;
  createdAt: string;
};

type JudgeAttemptEntry = {
  participantId: string;
  eventSlug: string;
  spotId: string;
  imageHash: string;
  createdAt: string;
  usedCache: boolean;
};

const CACHE_TTL = 60 * 60 * 24 * 7;
const ATTEMPT_TTL = 60 * 60 * 24;

function cacheKey(key: string) {
  return `judge:cache:${key}`;
}

function attemptKey(params: { eventSlug: string; participantId: string }) {
  return `judge:attempt:${params.eventSlug}:${params.participantId}`;
}

export function hashImageDataUrl(imageDataUrl: string) {
  return crypto.createHash("sha256").update(imageDataUrl).digest("hex");
}

export function buildJudgeCacheKey(params: {
  eventSlug: string;
  spotId: string;
  imageHash: string;
}) {
  return `${params.eventSlug}:${params.spotId}:${params.imageHash}`;
}

export async function getJudgeCache(key: string): Promise<JudgeCacheEntry | null> {
  const data = await kv.get<JudgeCacheEntry>(cacheKey(key));
  return data ?? null;
}

export async function setJudgeCache(entry: JudgeCacheEntry): Promise<void> {
  await kv.set(cacheKey(entry.key), entry, {
    ex: CACHE_TTL,
  });
}

export async function recordJudgeAttempt(entry: JudgeAttemptEntry): Promise<void> {
  const key = attemptKey({
    eventSlug: entry.eventSlug,
    participantId: entry.participantId,
  });

  await kv.rpush(key, JSON.stringify(entry));
  await kv.expire(key, ATTEMPT_TTL);
}

export async function isDuplicateRecentSubmission(params: {
  participantId: string;
  eventSlug: string;
  spotId: string;
  imageHash: string;
  withinMs?: number;
}): Promise<boolean> {
  const withinMs = params.withinMs ?? 10 * 60 * 1000;
  const now = Date.now();

  const key = attemptKey({
    eventSlug: params.eventSlug,
    participantId: params.participantId,
  });

  const rows = await kv.lrange<string>(key, 0, -1);

  for (const row of rows) {
    try {
      const x = JSON.parse(row) as JudgeAttemptEntry;

      if (
        x.participantId === params.participantId &&
        x.eventSlug === params.eventSlug &&
        x.spotId === params.spotId &&
        x.imageHash === params.imageHash &&
        now - new Date(x.createdAt).getTime() <= withinMs
      ) {
        return true;
      }
    } catch {}
  }

  return false;
}

export async function checkRateLimit(params: {
  participantId: string;
  eventSlug: string;
}) {
  const key = attemptKey({
    eventSlug: params.eventSlug,
    participantId: params.participantId,
  });

  const rows = await kv.lrange<string>(key, 0, -1);
  const now = Date.now();

  const attempts = rows
    .map((r) => {
      try {
        return JSON.parse(r) as JudgeAttemptEntry;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as JudgeAttemptEntry[];

  const last = attempts[attempts.length - 1];

  if (last) {
    const diff = now - new Date(last.createdAt).getTime();
    if (diff < 8000) {
      return {
        ok: false as const,
        reason: "連続送信が速すぎます。8秒ほど待ってください。",
      };
    }
  }

  const recent60 = attempts.filter(
    (x) => now - new Date(x.createdAt).getTime() < 60000
  );

  if (recent60.length >= 6) {
    return {
      ok: false as const,
      reason: "送信回数が多すぎます。少し待ってください。",
    };
  }

  return { ok: true as const };
}