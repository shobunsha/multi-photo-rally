export function makeCouponCode(prefix: string, participantId: string) {
  const tail = participantId.replace(/-/g, "").slice(-12).toUpperCase();
  return `${prefix}-${tail}`;
}