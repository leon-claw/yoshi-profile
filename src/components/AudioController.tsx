import { useEffect, useRef } from "react";
import { soundEffectTracks } from "../lib/audioAssets";
import { INTERACTION_SOUND_EVENT } from "../lib/audioEvents";

const SOUND_EFFECT_COOLDOWN_MS = 2000;
const SOUND_EFFECT_VOLUME = 0.34;
const INTERACTION_KEYS = new Set([
  " ",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "End",
  "Home",
  "PageDown",
  "PageUp",
]);

function playOneShot(src: string) {
  const audio = new Audio(src);
  audio.volume = SOUND_EFFECT_VOLUME;
  audio.preload = "auto";
  void audio.play().catch(() => {
    // Some browsers may still block audio until a trusted gesture settles.
  });
}

function useRandomInteractionSounds() {
  const lastPlayedAtRef = useRef(0);

  useEffect(() => {
    if (!soundEffectTracks.length) {
      return;
    }

    function maybePlaySound(event: Event) {
      if (
        event instanceof KeyboardEvent &&
        (event.repeat ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          !INTERACTION_KEYS.has(event.key))
      ) {
        return;
      }

      const now = window.performance.now();

      if (now - lastPlayedAtRef.current < SOUND_EFFECT_COOLDOWN_MS) {
        return;
      }

      lastPlayedAtRef.current = now;
      const randomIndex = Math.floor(Math.random() * soundEffectTracks.length);
      playOneShot(soundEffectTracks[randomIndex].src);
    }

    window.addEventListener("pointerdown", maybePlaySound, { capture: true, passive: true });
    window.addEventListener("keydown", maybePlaySound, { capture: true });
    window.addEventListener(INTERACTION_SOUND_EVENT, maybePlaySound);

    return () => {
      window.removeEventListener("pointerdown", maybePlaySound, { capture: true });
      window.removeEventListener("keydown", maybePlaySound, { capture: true });
      window.removeEventListener(INTERACTION_SOUND_EVENT, maybePlaySound);
    };
  }, []);
}

export function AudioController() {
  useRandomInteractionSounds();
  return null;
}
