import { ensureRedis, redis } from "@/lib/redis";
import type { Event, PublicEventPayload, Spot } from "@/lib/types";

const EVENTS_SET_KEY = "events:index";
const SPOTS_SET_KEY = "spots:index";

function eventKey(eventId: string) {
  return `event:${eventId}`;
}

function eventSlugKey(slug: string) {
  return `event:slug:${slug}`;
}

function eventSpotsKey(eventId: string) {
  return `event:${eventId}:spots`;
}

function spotKey(spotId: string) {
  return `spot:${spotId}`;
}

async function getJson<T>(key: string): Promise<T | null> {
  await ensureRedis();
  const raw = await redis.get(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

async function setJson(key: string, value: unknown) {
  await ensureRedis();
  await redis.set(key, JSON.stringify(value));
}

async function getManyJson<T>(keys: string[]): Promise<T[]> {
  await ensureRedis();
  if (keys.length === 0) return [];

  const values = await redis.mGet(keys);

  return values
    .filter((v): v is string => typeof v === "string")
    .map((v) => JSON.parse(v) as T);
}

export async function listEvents(): Promise<Event[]> {
  await ensureRedis();

  const ids = (await redis.sMembers(EVENTS_SET_KEY)) ?? [];
  const keys = ids.map((id) => eventKey(id));
  const events = await getManyJson<Event>(keys);
  return events.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getEventBySlug(eventSlug: string): Promise<Event | null> {
  await ensureRedis();

  const eventId = await redis.get(eventSlugKey(eventSlug));
  if (!eventId) return null;
  return await getJson<Event>(eventKey(eventId));
}

export async function getEventById(eventId: string): Promise<Event | null> {
  await ensureRedis();
  return await getJson<Event>(eventKey(eventId));
}

export async function getAllSpots(): Promise<Spot[]> {
  await ensureRedis();

  const ids = (await redis.sMembers(SPOTS_SET_KEY)) ?? [];
  const keys = ids.map((id) => spotKey(id));
  const spots = await getManyJson<Spot>(keys);
  return spots.sort((a, b) => a.order - b.order);
}

export async function getSpotsByEventId(eventId: string): Promise<Spot[]> {
  await ensureRedis();

  const ids = (await redis.sMembers(eventSpotsKey(eventId))) ?? [];
  const keys = ids.map((id) => spotKey(id));
  const spots = await getManyJson<Spot>(keys);
  return spots.sort((a, b) => a.order - b.order);
}

export async function getSpotById(
  eventId: string,
  spotId: string
): Promise<Spot | null> {
  await ensureRedis();

  const spot = await getJson<Spot>(spotKey(spotId));
  if (!spot) return null;
  if (spot.eventId !== eventId) return null;
  return spot;
}

export async function updateSpotById(
  spotId: string,
  patch: Partial<Spot>
): Promise<Spot | null> {
  await ensureRedis();

  const current = await getJson<Spot>(spotKey(spotId));
  if (!current) return null;

  const next: Spot = {
    ...current,
    ...patch,
  };

  await setJson(spotKey(spotId), next);
  await redis.sAdd(SPOTS_SET_KEY, spotId);
  await redis.sAdd(eventSpotsKey(next.eventId), spotId);

  return next;
}

export async function createSpot(input: Spot): Promise<Spot> {
  await ensureRedis();

  await setJson(spotKey(input.id), input);
  await redis.sAdd(SPOTS_SET_KEY, input.id);
  await redis.sAdd(eventSpotsKey(input.eventId), input.id);
  return input;
}

export async function createEvent(input: {
  name: string;
  slug: string;
  publicTitle: string;
  storyTitle: string;
  storyBody: string;
  backgroundImageUrl?: string;
  couponTitle?: string;
  couponDescription?: string;
  couponPrefix?: string;
}) {
  await ensureRedis();

  const exists = await redis.get(eventSlugKey(input.slug));
  if (exists) {
    throw new Error("slug_duplicate");
  }

  const now = new Date().toISOString();
  const eventId = `evt_${input.slug.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

  const event: Event = {
    id: eventId,
    slug: input.slug,
    name: input.name,
    publicTitle: input.publicTitle,
    status: "published",
    theme: {
      backgroundImageUrl: input.backgroundImageUrl || "/demo/base-bg.jpg",
      storyTitle: input.storyTitle,
      storyBody: input.storyBody,
      primaryColor: "#f97316",
      accentColor: "#eab308",
    },
    rally: {
      requiredSpotCount: 3,
      successEnergyPerSpot: 34,
      introEnabled: true,
      soundEnabled: false,
    },
    coupon: {
      enabled: true,
      title: input.couponTitle || "来場特典",
      description: input.couponDescription || "受付でノベルティ引換ができます。",
      prefix: input.couponPrefix || "NEW",
      rewardType: "gift",
      qrMode: "code",
      redeemNote: "景品交換所でスタッフにご提示ください。",
    },
    createdAt: now,
    updatedAt: now,
  };

  const defaultNewSpots: Spot[] = [
    {
      id: `${input.slug}_spot1`,
      eventId,
      title: "スポット1",
      description: "見本と同じ場所を撮影",
      order: 1,
      refImageUrl: "/demo/default-ref-select.png",
      thumbnailUrl: "/demo/default-ref-select.png",
      hintText: "見本画像をあとで差し替えてください",
      energyGain: 34,
      active: true,
    },
    {
      id: `${input.slug}_spot2`,
      eventId,
      title: "スポット2",
      description: "見本と同じ場所を撮影",
      order: 2,
      refImageUrl: "/demo/default-ref-select.png",
      thumbnailUrl: "/demo/default-ref-select.png",
      hintText: "見本画像をあとで差し替えてください",
      energyGain: 33,
      active: true,
    },
    {
      id: `${input.slug}_spot3`,
      eventId,
      title: "スポット3",
      description: "見本と同じ場所を撮影",
      order: 3,
      refImageUrl: "/demo/default-ref-select.png",
      thumbnailUrl: "/demo/default-ref-select.png",
      hintText: "見本画像をあとで差し替えてください",
      energyGain: 33,
      active: true,
    },
  ];

  await setJson(eventKey(eventId), event);
  await redis.set(eventSlugKey(input.slug), eventId);
  await redis.sAdd(EVENTS_SET_KEY, eventId);

  for (const spot of defaultNewSpots) {
    await setJson(spotKey(spot.id), spot);
    await redis.sAdd(SPOTS_SET_KEY, spot.id);
    await redis.sAdd(eventSpotsKey(eventId), spot.id);
  }

  return {
    event,
    spots: defaultNewSpots,
  };
}

export async function deleteEvent(eventId: string): Promise<void> {
  await ensureRedis();

  const event = await getEventById(eventId);
  if (!event) return;

  const spotIds = (await redis.sMembers(eventSpotsKey(eventId))) ?? [];

  for (const spotId of spotIds) {
    await redis.del(spotKey(spotId));
    await redis.sRem(SPOTS_SET_KEY, spotId);
  }

  await redis.del(eventSpotsKey(eventId));
  await redis.del(eventKey(eventId));
  await redis.del(eventSlugKey(event.slug));
  await redis.sRem(EVENTS_SET_KEY, eventId);
}

export async function getPublicEventPayload(
  eventSlug: string
): Promise<PublicEventPayload | null> {
  await ensureRedis();

  const event = await getEventBySlug(eventSlug);
  if (!event) return null;

  const spots = await getSpotsByEventId(event.id);

  return {
    event,
    spots: spots.filter((s) => s.active),
  };
}