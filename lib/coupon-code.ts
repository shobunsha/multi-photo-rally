export function makeCouponCode(params: {
  eventSlug: string;
  participantId: string;
  prefix?: string;
}) {
  const safePrefix = (params.prefix || "CP").trim().toUpperCase();
  const tail = params.participantId.replace(/-/g, "").slice(-8).toUpperCase();
  return `${safePrefix}-${tail}`;
}