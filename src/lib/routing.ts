import type { DollProfile } from "./types";

const profileRoutePattern = /^#?\/dolls\/([a-z0-9-]+)(?:\/gallery\/\d+)?$/i;

export function parseProfileIdFromHash(hash: string): string | null {
  const normalized = hash.startsWith("#") ? hash.slice(1) : hash;
  const match = normalized.match(profileRoutePattern);
  return match?.[1]?.toLowerCase() ?? null;
}

export function buildProfileHash(id: string): string {
  return `/dolls/${id}`;
}

export function resolveProfileId(profiles: DollProfile[], requestedId: string | null): string {
  if (requestedId && profiles.some((profile) => profile.id === requestedId)) {
    return requestedId;
  }

  return profiles[0]?.id ?? "";
}
