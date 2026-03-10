export type EventStatus = "draft" | "published" | "archived";

export type RewardType = "coupon" | "gift" | "ticket";

export type EventTheme = {
  backgroundImageUrl: string;
  logoImageUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  storyTitle?: string;
  storyBody?: string;
};

export type EventRallySettings = {
  requiredSpotCount: number;
  successEnergyPerSpot: number;
  introEnabled: boolean;
  soundEnabled: boolean;
};

export type EventCouponSettings = {
  enabled: boolean;
  title: string;
  description: string;
  prefix: string;
  rewardType: RewardType;
  qrMode: "code" | "url";
  redeemNote?: string;
};

export type Event = {
  id: string;
  slug: string;
  name: string;
  publicTitle: string;
  status: EventStatus;
  theme: EventTheme;
  rally: EventRallySettings;
  coupon: EventCouponSettings;
  createdAt: string;
  updatedAt: string;
};

export type Spot = {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  order: number;
  refImageUrl: string;
  thumbnailUrl?: string;
  hintText?: string;
  energyGain: number;
  active: boolean;
};

export type ParticipantProgress = {
  completedSpotIds: string[];
  energy: number;
  couponIssued: boolean;
};

export type Coupon = {
  code: string;
  eventId: string;
  participantId: string;
  status: "issued" | "used";
  issuedAt: string;
  usedAt?: string;
  usedBy?: string;
};

export type JudgeResult = {
  ok: boolean;
  reason: string;
};

export type PublicEventPayload = {
  event: Event;
  spots: Spot[];
};