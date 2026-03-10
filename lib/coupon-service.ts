import "server-only";

import { kv } from "@/lib/kv";
import { readJsonFile, writeJsonFile } from "@/lib/file-db";

export type CouponRedeemEntry = {
  eventSlug: string;
  code: string;
  usedAt: string;
  usedBy: string;
};

const REDEEM_FILE = "coupon-redeems.json";
const LIST_MAX = 1000;
const REDEEM_TTL_SECONDS = 60 * 60 * 24 * 90; // 90日

function hasKvEnv() {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

function redeemKey(eventSlug: string, code: string) {
  return `coupon:redeem:${eventSlug}:${code}`;
}

function redeemListKey(eventSlug: string) {
  return `coupon:redeems:${eventSlug}`;
}

export async function redeemCoupon(params: {
  eventSlug: string;
  code: string;
  staffName?: string;
}) {
  const usedAt = new Date().toISOString();
  const usedBy = params.staffName?.trim() || "staff";

  const entry: CouponRedeemEntry = {
    eventSlug: params.eventSlug,
    code: params.code,
    usedAt,
    usedBy,
  };

  if (hasKvEnv()) {
    const existing = await kv.get<CouponRedeemEntry>(
      redeemKey(params.eventSlug, params.code)
    );

    if (existing) {
      return {
        ok: false as const,
        alreadyUsed: true as const,
        entry: existing,
      };
    }

    await kv.set(redeemKey(params.eventSlug, params.code), entry, {
      ex: REDEEM_TTL_SECONDS,
    });

    await kv.lpush(redeemListKey(params.eventSlug), JSON.stringify(entry));
    await kv.ltrim(redeemListKey(params.eventSlug), 0, LIST_MAX - 1);
    await kv.expire(redeemListKey(params.eventSlug), REDEEM_TTL_SECONDS);

    return {
      ok: true as const,
      entry,
    };
  }

  const all = await readJsonFile<CouponRedeemEntry[]>(REDEEM_FILE, []);
  const existing = all.find(
    (x) => x.eventSlug === params.eventSlug && x.code === params.code
  );

  if (existing) {
    return {
      ok: false as const,
      alreadyUsed: true as const,
      entry: existing,
    };
  }

  const next = [entry, ...all].slice(0, LIST_MAX);
  await writeJsonFile(REDEEM_FILE, next);

  return {
    ok: true as const,
    entry,
  };
}

export async function listRecentRedeems(params: {
  eventSlug: string;
  limit?: number;
}) {
  const limit = params.limit ?? 100;

  if (hasKvEnv()) {
    const rows = await kv.lrange<string>(redeemListKey(params.eventSlug), 0, limit - 1);

    return rows
      .map((row) => {
        try {
          return JSON.parse(row) as CouponRedeemEntry;
        } catch {
          return null;
        }
      })
      .filter((x): x is CouponRedeemEntry => !!x);
  }

  const all = await readJsonFile<CouponRedeemEntry[]>(REDEEM_FILE, []);

  return all
    .filter((x) => x.eventSlug === params.eventSlug)
    .sort((a, b) => new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime())
    .slice(0, limit);
}