import { readJsonFile, writeJsonFile } from "@/lib/file-db";
import type { Event, PublicEventPayload, Spot } from "@/lib/types";

const defaultEvents: Event[] = [];
const defaultSpots: Spot[] = [];

export async function listEvents(): Promise<Event[]> {
  return readJsonFile<Event[]>("events.json", defaultEvents);
}

export async function getEventBySlug(eventSlug: string): Promise<Event | null> {
  const events = await listEvents();
  return events.find((e) => e.slug === eventSlug) ?? null;
}

export async function getEventById(eventId: string): Promise<Event | null> {
  const events = await listEvents();
  return events.find((e) => e.id === eventId) ?? null;
}

export async function getAllSpots(): Promise<Spot[]> {
  return readJsonFile<Spot[]>("spots.json", defaultSpots);
}

export async function getSpotsByEventId(eventId: string): Promise<Spot[]> {
  const spots = await getAllSpots();
  return spots
    .filter((s) => s.eventId === eventId)
    .sort((a, b) => a.order - b.order);
}

export async function getSpotById(
  eventId: string,
  spotId: string
): Promise<Spot | null> {
  const spots = await getSpotsByEventId(eventId);
  return spots.find((s) => s.id === spotId) ?? null;
}

export async function updateSpotById(
  spotId: string,
  patch: Partial<Spot>
): Promise<Spot | null> {
  const spots = await getAllSpots();
  const idx = spots.findIndex((s) => s.id === spotId);
  if (idx === -1) return null;

  const next = {
    ...spots[idx],
    ...patch,
  };

  spots[idx] = next;
  await writeJsonFile("spots.json", spots);

  return next;
}

export async function createSpot(input: Spot): Promise<Spot> {
  const spots = await getAllSpots();
  spots.push(input);
  await writeJsonFile("spots.json", spots);
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
  const events = await listEvents();

  const exists = events.find((e) => e.slug === input.slug);
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
      backgroundImageUrl: input.backgroundImageUrl || "/demo/housing-bg.jpg",
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

  events.push(event);
  await writeJsonFile("events.json", events);

  const spots = await getAllSpots();

  const defaultNewSpots: Spot[] = [
    {
      id: `${input.slug}_spot1`,
      eventId,
      title: "スポット1",
      description: "見本と同じ場所を撮影",
      order: 1,
      refImageUrl: "/demo/ref1.jpg",
      thumbnailUrl: "/demo/ref1.jpg",
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
      refImageUrl: "/demo/ref2.jpg",
      thumbnailUrl: "/demo/ref2.jpg",
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
      refImageUrl: "/demo/ref3.jpg",
      thumbnailUrl: "/demo/ref3.jpg",
      hintText: "見本画像をあとで差し替えてください",
      energyGain: 33,
      active: true,
    },
  ];

  spots.push(...defaultNewSpots);
  await writeJsonFile("spots.json", spots);

  return {
    event,
    spots: defaultNewSpots,
  };
}

export async function deleteEvent(eventId: string): Promise<void> {
  const events = await listEvents();
  const nextEvents = events.filter((event) => event.id !== eventId);
  await writeJsonFile("events.json", nextEvents);

  const spots = await getAllSpots();
  const nextSpots = spots.filter((spot) => spot.eventId !== eventId);
  await writeJsonFile("spots.json", nextSpots);
}

export async function getPublicEventPayload(
  eventSlug: string
): Promise<PublicEventPayload | null> {
  const event = await getEventBySlug(eventSlug);
  if (!event) return null;

  const spots = await getSpotsByEventId(event.id);

  return {
    event,
    spots: spots.filter((s) => s.active),
  };
}