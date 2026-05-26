export const INTERACTION_SOUND_EVENT = "yoshi-profile:interaction-sound";

export function requestInteractionSound() {
  window.dispatchEvent(new Event(INTERACTION_SOUND_EVENT));
}
