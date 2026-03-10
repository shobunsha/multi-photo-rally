import crypto from "crypto";
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

function isVercelRuntime() {
  return process.env.VERCEL === "1" || !!process.env.VERCEL;
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
  if (isVercelRuntime()) {
    return null;
  }

  const all = await readJsonFile<JudgeCacheEntry[]>(CACHE_FILE, []);
  return all.find((x) => x.key === key) ?? null;
}

export async function setJudgeCache(entry: JudgeCacheEntry): Promise<void> {
  if (isVercelRuntime()) {
    return;
  }

  const all = await readJsonFile<JudgeCacheEntry[]>(CACHE_FILE, []);
  const next = all.filter((x) => x.key !== entry.key);
  next.push(entry);
  await writeJsonFile(CACHE_FILE, next.slice(-1000));
}

export async function recordJudgeAttempt(entry: JudgeAttemptEntry): Promise<void> {
  if (isVercelRuntime()) {
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
  if (isVercelRuntime()) {
    return false;
  }

  const withinMs = params.withinMs ?? 10 * 60 * 1000;
  const all = await readJsonFile<JudgeAttemptEntry[]>(ATTEMPT_FILE, []);
  const now = Date.now();

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
  if (isVercelRuntime()) {
    return {
      ok: true as const,
    };
  }

  const all = await readJsonFile<JudgeAttemptEntry[]>(ATTEMPT_FILE, []);
  const now = Date.now();

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