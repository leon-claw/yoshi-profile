import type { RendererId } from "./renderers/registry";

export type ProfileDesignTheme = "dossier" | "playful";

// Global visual theme switch for the whole profile page.
// Keep "dossier" to preserve the current toy archive theme, or change it to
// "playful" to use the colorful childlike theme.
export const PROFILE_DESIGN_THEME: ProfileDesignTheme = "dossier";

// Renderer/theme switch. The previous PPT-style renderer is still registered
// as "presentation-deck"; set this v2 localStorage key or this default to switch.
export const PROFILE_RENDERER_STORAGE_KEY = "yoshi-profile:renderer:impress";
export const PROFILE_RENDERER_THEME: RendererId = "impress-deck";
