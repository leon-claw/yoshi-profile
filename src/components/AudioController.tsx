import { Music2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { bgmTracks, soundEffectTracks } from "../lib/audioAssets";
import { INTERACTION_SOUND_EVENT } from "../lib/audioEvents";

const SOUND_EFFECT_COOLDOWN_MS = 2000;
const SOUND_EFFECT_VOLUME = 0.34;
const BGM_VOLUME = 0.48;
const BGM_HINT_DELAY_MS = 30000;
const BGM_HINT_VISIBLE_MS = 6200;
const BGM_HINT_STORAGE_KEY = "yoshi-profile:bgm-hint-shown";

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
        (event.repeat || event.altKey || event.ctrlKey || event.metaKey)
      ) {
        return;
      }

      if (event.target instanceof Element && event.target.closest("[data-audio-control]")) {
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
    window.addEventListener(INTERACTION_SOUND_EVENT, maybePlaySound);

    return () => {
      window.removeEventListener("pointerdown", maybePlaySound, { capture: true });
      window.removeEventListener(INTERACTION_SOUND_EVENT, maybePlaySound);
    };
  }, []);
}

export function AudioController() {
  useRandomInteractionSounds();

  const [isPlaying, setIsPlaying] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedBgmRef = useRef(false);
  const isPlayingRef = useRef(false);
  const hintHideTimerRef = useRef<number | null>(null);
  const currentTrack = bgmTracks[trackIndex] ?? null;

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = BGM_VOLUME;
    audio.preload = "metadata";
    audioRef.current = audio;

    function handleEnded() {
      if (!bgmTracks.length) {
        return;
      }

      if (bgmTracks.length === 1) {
        audio.currentTime = 0;
        void audio.play().catch(() => setIsPlaying(false));
        return;
      }

      setTrackIndex((current) => (current + 1) % bgmTracks.length);
    }

    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.removeEventListener("ended", handleEnded);
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !currentTrack) {
      return;
    }

    audio.src = currentTrack.src;
    audio.load();

    if (isPlayingRef.current) {
      void audio
        .play()
        .then(() => {
          hasPlayedBgmRef.current = true;
          setIsPlaying(true);
        })
        .catch(() => setIsPlaying(false));
    }
  }, [currentTrack]);

  useEffect(() => {
    if (!bgmTracks.length || window.localStorage.getItem(BGM_HINT_STORAGE_KEY)) {
      return;
    }

    const hintTimer = window.setTimeout(() => {
      if (hasPlayedBgmRef.current) {
        return;
      }

      setShowHint(true);
      window.localStorage.setItem(BGM_HINT_STORAGE_KEY, "true");
      hintHideTimerRef.current = window.setTimeout(() => {
        setShowHint(false);
        hintHideTimerRef.current = null;
      }, BGM_HINT_VISIBLE_MS);
    }, BGM_HINT_DELAY_MS);

    return () => {
      window.clearTimeout(hintTimer);

      if (hintHideTimerRef.current) {
        window.clearTimeout(hintHideTimerRef.current);
        hintHideTimerRef.current = null;
      }
    };
  }, []);

  const handleToggleBgm = useCallback(async () => {
    const audio = audioRef.current;

    if (!audio || !currentTrack) {
      return;
    }

    if (isPlayingRef.current) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      audio.volume = BGM_VOLUME;
      await audio.play();
      hasPlayedBgmRef.current = true;
      setShowHint(false);
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }, [currentTrack]);

  if (!bgmTracks.length) {
    return null;
  }

  return (
    <div className="audio-dock" data-audio-control>
      <button
        aria-label={isPlaying ? "暂停背景音乐" : "播放背景音乐"}
        className="audio-toggle"
        data-playing={isPlaying}
        onClick={handleToggleBgm}
        title={currentTrack ? `BGM: ${currentTrack.name}` : "背景音乐"}
        type="button"
      >
        <Music2 aria-hidden="true" size={21} strokeWidth={2.4} />
      </button>
      {showHint ? (
        <div className="audio-hint" role="status">
          点一下音符，可以打开背景音乐。
        </div>
      ) : null}
    </div>
  );
}
