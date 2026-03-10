export function storageKeys(eventSlug: string) {
  return {
    participantId: `participant_id:${eventSlug}`,
    progress: `progress_v1:${eventSlug}`,
    introSeen: `intro_seen_v1:${eventSlug}`,
    treasureShown: `treasure_shown_v1:${eventSlug}`,
  };
}

export function getOrCreateParticipantId(eventSlug: string): string {
  const key = storageKeys(eventSlug).participantId;
  const existing =
    typeof window !== "undefined" ? localStorage.getItem(key) : null;

  if (existing) return existing;

  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

export function loadProgress(eventSlug: string) {
  const key = storageKeys(eventSlug).progress;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return {
        completedSpotIds: [],
        energy: 0,
        couponIssued: false,
      };
    }
    const parsed = JSON.parse(raw);
    return {
      completedSpotIds: Array.isArray(parsed.completedSpotIds)
        ? parsed.completedSpotIds
        : [],
      energy: typeof parsed.energy === "number" ? parsed.energy : 0,
      couponIssued: !!parsed.couponIssued,
    };
  } catch {
    return {
      completedSpotIds: [],
      energy: 0,
      couponIssued: false,
    };
  }
}

export function saveProgress(
  eventSlug: string,
  progress: {
    completedSpotIds: string[];
    energy: number;
    couponIssued: boolean;
  }
) {
  const key = storageKeys(eventSlug).progress;
  localStorage.setItem(key, JSON.stringify(progress));
}

export function markIntroSeen(eventSlug: string) {
  localStorage.setItem(storageKeys(eventSlug).introSeen, "1");
}

export function hasSeenIntro(eventSlug: string) {
  return localStorage.getItem(storageKeys(eventSlug).introSeen) === "1";
}

export function markTreasureShown(eventSlug: string) {
  localStorage.setItem(storageKeys(eventSlug).treasureShown, "1");
}

export function hasShownTreasure(eventSlug: string) {
  return localStorage.getItem(storageKeys(eventSlug).treasureShown) === "1";
}