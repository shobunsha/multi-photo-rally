import { getKv } from "@/lib/kv";

export function buildJudgeCacheKey(
  eventSlug: string,
  spotId: string,
  hash: string
) {
  return `judge_cache:${eventSlug}:${spotId}:${hash}`;
}

export async function getJudgeCache(key: string) {
  const kv = getKv();
  return await kv.get(key);
}

export async function setJudgeCache(key: string, value: any) {
  const kv = getKv();
  await kv.set(key, value);
}

export function hashImageDataUrl(dataUrl: string) {
  let hash = 0;

  for (let i = 0; i < dataUrl.length; i++) {
    const chr = dataUrl.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }

  return hash.toString();
}

export async function checkRateLimit({
  participantId,
  eventSlug,
}: {
  participantId: string;
  eventSlug: string;
}) {
  const kv = getKv();
  const key = `judge_attempts:${eventSlug}:${participantId}`;
  const now = Date.now();

  const related =
    (await kv.get<{ createdAt: string }[]>(key)) ?? [];

  const lastOne = related[related.length - 1];

  if (lastOne) {
    const diff = now - new Date(lastOne.createdAt).getTime();

    if (diff < 8000) {
      return {
        ok: false as const,
        reason: "連続送信が速すぎます。8秒ほど待ってください。",
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

  return { ok: true as const };
}

export async function recordJudgeAttempt({
  participantId,
  eventSlug,
}: {
  participantId: string;
  eventSlug: string;
}) {
  const kv = getKv();
  const key = `judge_attempts:${eventSlug}:${participantId}`;

  const list =
    (await kv.get<{ createdAt: string }[]>(key)) ?? [];

  list.push({
    createdAt: new Date().toISOString(),
  });

  await kv.set(key, list);
}

export async function isDuplicateRecentSubmission({
  participantId,
  eventSlug,
  hash,
}: {
  participantId: string;
  eventSlug: string;
  hash: string;
}) {
  const kv = getKv();
  const key = `recent_hash:${eventSlug}:${participantId}`;

  const lastHash = await kv.get<string>(key);

  if (lastHash === hash) {
    return true;
  }

  await kv.set(key, hash);

  return false;
}