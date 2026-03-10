import crypto from "crypto";
import { kv } from "@vercel/kv";
import { readJsonFile, writeJsonFile } from "@/lib/file-db";
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

const CACHE_FILE = "judge-cache.json";
const ATTEMPT_FILE = "judge-attempts.json";

const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7日
const ATTEMPT_TTL_SECONDS = 60 * 60 * 24; // 24時間
const ATTEMPT_LIST_MAX = 300;

function hasKvEnv() {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

function cacheRedisKey(key: string) {
  return `judge:cache:${key}`;
}

function attemptsRedisKey(params: {
  eventSlug: string;
  participantId: string;
}) {
  return `judge:attempts:${params.eventSlug}:${params.participantId}`;
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
  if (hasKvEnv()) {
    const data = await kv.get<JudgeCacheEntry>(cacheRedisKey(key));
    return data ?? null;
  }

  const all = await readJsonFile<JudgeCacheEntry[]>(CACHE_FILE, []);
  return all.find((x) => x.key === key) ?? null;
}

export async function setJudgeCache(entry: JudgeCacheEntry): Promise<void> {
  if (hasKvEnv()) {
    await kv.set(cacheRedisKey(entry.key), entry, { ex: CACHE_TTL_SECONDS });
    return;
  }

  const all = await readJsonFile<JudgeCacheEntry[]>(CACHE_FILE, []);
  const next = all.filter((x) => x.key !== entry.key);
  next.push(entry);
  await writeJsonFile(CACHE_FILE, next.slice(-1000));
}

export async function recordJudgeAttempt(entry: JudgeAttemptEntry): Promise<void> {
  if (hasKvEnv()) {
    const key = attemptsRedisKey({
      eventSlug: entry.eventSlug,
      participantId: entry.participantId,
    });

    await kv.rpush(key, JSON.stringify(entry));
    await kv.ltrim(key, -ATTEMPT_LIST_MAX, -1);
    await kv.expire(key, ATTEMPT_TTL_SECONDS);
    return;
  }

  const all = await readJsonFile<JudgeAttemptEntry[]>(ATTEMPT_FILE, []);
  all.push(entry);
  await writeJsonFile(ATTEMPT_FILE, all.slice(-3000));
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

  if (hasKvEnv()) {
    const key = attemptsRedisKey({
      eventSlug: params.eventSlug,
      participantId: params.participantId,
    });

const rows = await kv.lrange<string>(key, 0, -1);
    const all = rows
      .map((row) => {
        try {
          return JSON.parse(row) as JudgeAttemptEntry;
        } catch {
          return null;
        }
      })
      .filter((x): x is JudgeAttemptEntry => !!x);

    return all.some((x) => {
      return (
        x.participantId === params.participantId &&
        x.eventSlug === params.eventSlug &&
        x.spotId === params.spotId &&
        x.imageHash === params.imageHash &&
        now - new Date(x.createdAt).getTime() <= withinMs
      );
    });
  }

  const all = await readJsonFile<JudgeAttemptEntry[]>(ATTEMPT_FILE, []);

  return all.some((x) => {
    return (
      x.participantId === params.participantId &&
      x.eventSlug === params.eventSlug &&
      x.spotId === params.spotId &&
      x.imageHash === params.imageHash &&
      now - new Date(x.createdAt).getTime() <= withinMs
    );
  });
}

export async function checkRateLimit(params: {
  participantId: string;
  eventSlug: string;
}) {
  const now = Date.now();

  if (hasKvEnv()) {
    const key = attemptsRedisKey({
      eventSlug: params.eventSlug,
      participantId: params.participantId,
    });

const rows = await kv.lrange<string>(key, 0, -1);
    const related = rows
      .map((row) => {
        try {
          return JSON.parse(row) as JudgeAttemptEntry;
        } catch {
          return null;
        }
      })
      .filter((x): x is JudgeAttemptEntry => !!x);

    const lastOne = related[related.length - 1];

    if (lastOne) {
      const diff = now - new Date(lastOne.createdAt).getTime();
      if (diff < 8000) {
        return {
          ok: false as const,
          reason: "連続送信が速すぎます。8秒ほど待ってから再送してください。",
        };
      }
    }

    const recent60s = related.filter(
      (x) => now - new Date(x.createdAt).getTime() <= 60 * 1000
    );

    if (recent60s.length >= 6) {
      return {
        ok: false as const,
        reason: "短時間の送信回数が多いため、一度時間を置いてください。",
      };
    }

    return {
      ok: true as const,
    };
  }

  const all = await readJsonFile<JudgeAttemptEntry[]>(ATTEMPT_FILE, []);

  const related = all.filter(
    (x) =>
      x.participantId === params.participantId &&
      x.eventSlug === params.eventSlug
  );

  const lastOne = related[related.length - 1];

  if (lastOne) {
    const diff = now - new Date(lastOne.createdAt).getTime();
    if (diff < 8000) {
      return {
        ok: false as const,
        reason: "連続送信が速すぎます。8秒ほど待ってから再送してください。",
      };
    }
  }

  const recent60s = related.filter(
    (x) => now - new Date(x.createdAt).getTime() <= 60 * 1000
  );

  if (recent60s.length >= 6) {
    return {
      ok: false as const,
      reason: "短時間の送信回数が多いため、一度時間を置いてください。",
    };
  }

  return {
    ok: true as const,
  };
}