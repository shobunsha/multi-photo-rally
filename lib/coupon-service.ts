import { getKv } from "@/lib/kv";

type RedeemResult =
  | {
      ok: true;
      entry: {
        code: string;
        usedAt: string;
        usedBy: string;
      };
    }
  | {
      ok: false;
      reason: string;
      entry?: {
        code: string;
        usedAt: string;
        usedBy: string;
      };
    };

export function makeCouponCode(participantId: string) {
  const tail = participantId.replace(/-/g, "").slice(-12).toUpperCase();
  return `AI-RALLY-${tail}`;
}

export async function redeemCoupon({
  eventSlug,
  code,
  staffName,
}: {
  eventSlug: string;
  code: string;
  staffName: string;
}): Promise<RedeemResult> {
  const kv = getKv();

  const key = `coupon:${eventSlug}:${code}`;

  const existing = await kv.get<{
    code: string;
    usedAt: string;
    usedBy: string;
  }>(key);

  if (existing) {
    return {
      ok: false,
      reason: "already_used",
      entry: existing,
    };
  }

  const entry = {
    code,
    usedAt: new Date().toISOString(),
    usedBy: staffName,
  };

  await kv.set(key, entry);

  return {
    ok: true,
    entry,
  };
}

export async function listRecentRedeems({
  eventSlug,
  limit = 100,
}: {
  eventSlug: string;
  limit?: number;
}) {
  const kv = getKv();

  const pattern = `coupon:${eventSlug}:*`;

  const keys = await kv.keys(pattern);

  const entries = [];

  for (const key of keys) {
    const data = await kv.get<{
      code: string;
      usedAt: string;
      usedBy: string;
    }>(key);

    if (data) {
      entries.push(data);
    }
  }

  entries.sort((a, b) => {
    return new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime();
  });

  return entries.slice(0, limit);
}