import { describe, expect, it } from "vitest";
import { buildProfileHash, parseProfileIdFromHash, resolveProfileId } from "../lib/routing";
import type { DollProfile } from "../lib/types";

const profiles = [
  { id: "mochi" },
  { id: "pipi" },
] as DollProfile[];

describe("routing helpers", () => {
  it("parses profile ids from hash routes", () => {
    expect(parseProfileIdFromHash("#/dolls/mochi")).toBe("mochi");
    expect(parseProfileIdFromHash("/dolls/pipi")).toBe("pipi");
    expect(parseProfileIdFromHash("#/unknown/mochi")).toBeNull();
  });

  it("builds profile hash routes", () => {
    expect(buildProfileHash("mochi")).toBe("/dolls/mochi");
  });

  it("falls back to the first profile for invalid ids", () => {
    expect(resolveProfileId(profiles, "pipi")).toBe("pipi");
    expect(resolveProfileId(profiles, "ghost")).toBe("mochi");
    expect(resolveProfileId(profiles, null)).toBe("mochi");
  });
});
