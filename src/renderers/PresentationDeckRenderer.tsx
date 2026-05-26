import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type TouchEvent,
  type WheelEvent,
} from "react";
import { requestInteractionSound } from "../lib/audioEvents";
import { DollImage } from "./DollImage";
import { MarkdownBlock } from "./MarkdownBlock";
import type { ProfileRendererProps } from "./types";

type SlideDirection = "next" | "prev";
type SlidePosition = "active" | "next" | "prev" | "far";
const NAVIGATION_LOCK_MS = 680;
const EXIT_STATE_RESET_MS = 1100;
const TRANSITION_STYLES = ["backInDown", "backInLeft", "backInRight", "backInUp"] as const;
type TransitionStyle = (typeof TRANSITION_STYLES)[number];
type SlideMotion = "entering" | "exiting" | "idle";

type GalleryPreview = {
  profileId: string;
  index: number;
};

function getNextTransitionStyle(current: TransitionStyle): TransitionStyle {
  const currentIndex = TRANSITION_STYLES.indexOf(current);
  return TRANSITION_STYLES[(currentIndex + 1) % TRANSITION_STYLES.length];
}

export function PresentationDeckRenderer({ profiles, selected, onSelectProfile }: ProfileRendererProps) {
  const selectedIndex = useMemo(
    () => Math.max(0, profiles.findIndex((profile) => profile.id === selected.id)),
    [profiles, selected.id],
  );
  const [direction, setDirection] = useState<SlideDirection>("next");
  const [transitionStyle, setTransitionStyle] = useState<TransitionStyle>("backInRight");
  const [exitingProfileId, setExitingProfileId] = useState<string | null>(null);
  const [preview, setPreview] = useState<GalleryPreview | null>(null);
  const previousIndexRef = useRef(selectedIndex);
  const pendingNavigationRef = useRef<{ direction: SlideDirection; targetId: string } | null>(null);
  const exitTimerRef = useRef<number | null>(null);
  const wheelLockRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const previewProfile = useMemo(
    () => profiles.find((profile) => profile.id === preview?.profileId),
    [preview?.profileId, profiles],
  );
  const previewImages = previewProfile?.gallery ?? [];
  const previewImage = previewImages.length && preview ? previewImages[preview.index % previewImages.length] : null;

  const markExitingProfile = useCallback((profileId: string) => {
    if (exitTimerRef.current) {
      window.clearTimeout(exitTimerRef.current);
    }

    setExitingProfileId(profileId);
    exitTimerRef.current = window.setTimeout(() => {
      setExitingProfileId(null);
      exitTimerRef.current = null;
    }, EXIT_STATE_RESET_MS);
  }, []);

  const goToIndex = useCallback(
    (targetIndex: number, nextDirection: SlideDirection) => {
      const normalizedIndex = (targetIndex + profiles.length) % profiles.length;
      const target = profiles[normalizedIndex];

      if (!target || target.id === selected.id) {
        return;
      }

      requestInteractionSound();
      markExitingProfile(selected.id);
      pendingNavigationRef.current = { direction: nextDirection, targetId: target.id };
      setDirection(nextDirection);
      setTransitionStyle(getNextTransitionStyle);
      onSelectProfile(target.id);
    },
    [markExitingProfile, onSelectProfile, profiles, selected.id],
  );

  const goNext = useCallback(() => goToIndex(selectedIndex + 1, "next"), [goToIndex, selectedIndex]);
  const goPrev = useCallback(() => goToIndex(selectedIndex - 1, "prev"), [goToIndex, selectedIndex]);
  const openPreview = useCallback((profileId: string, index: number) => {
    setPreview({ profileId, index });
  }, []);
  const closePreview = useCallback(() => setPreview(null), []);
  const movePreview = useCallback(
    (offset: number) => {
      setPreview((current) => {
        if (!current) {
          return current;
        }

        const profile = profiles.find((item) => item.id === current.profileId);
        const imageCount = profile?.gallery.length ?? 0;

        if (!imageCount) {
          return current;
        }

        return {
          ...current,
          index: (current.index + offset + imageCount) % imageCount,
        };
      });
    },
    [profiles],
  );

  useEffect(() => {
    if (selectedIndex === previousIndexRef.current) {
      return;
    }

    const lastIndex = previousIndexRef.current;
    const pendingNavigation = pendingNavigationRef.current;

    if (pendingNavigation?.targetId === selected.id) {
      setDirection(pendingNavigation.direction);
      pendingNavigationRef.current = null;
      previousIndexRef.current = selectedIndex;
      return;
    }

    const movedForward =
      selectedIndex > lastIndex || (lastIndex === profiles.length - 1 && selectedIndex === 0);
    const exitingProfile = profiles[lastIndex];

    if (exitingProfile) {
      markExitingProfile(exitingProfile.id);
    }

    setDirection(movedForward ? "next" : "prev");
    setTransitionStyle(getNextTransitionStyle);
    previousIndexRef.current = selectedIndex;
  }, [markExitingProfile, profiles, selected.id, selectedIndex]);

  useEffect(
    () => () => {
      if (exitTimerRef.current) {
        window.clearTimeout(exitTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      if (preview) {
        if (event.key === "Escape") {
          event.preventDefault();
          closePreview();
        }

        if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(event.key)) {
          event.preventDefault();
          requestInteractionSound();
          movePreview(1);
        }

        if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) {
          event.preventDefault();
          requestInteractionSound();
          movePreview(-1);
        }

        return;
      }

      if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        goNext();
      }

      if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) {
        event.preventDefault();
        goPrev();
      }

      if (event.key === "Home") {
        event.preventDefault();
        goToIndex(0, "prev");
      }

      if (event.key === "End") {
        event.preventDefault();
        goToIndex(profiles.length - 1, "next");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closePreview, goNext, goPrev, goToIndex, movePreview, preview, profiles.length]);

  function handleWheel(event: WheelEvent<HTMLElement>) {
    const dominantDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;

    if (Math.abs(dominantDelta) < 34) {
      return;
    }

    event.preventDefault();

    const now = window.performance.now();
    if (now < wheelLockRef.current) {
      return;
    }

    wheelLockRef.current = now + NAVIGATION_LOCK_MS;

    if (preview) {
      requestInteractionSound();
      movePreview(dominantDelta > 0 ? 1 : -1);
      return;
    }

    if (dominantDelta > 0) {
      goNext();
      return;
    }

    goPrev();
  }

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    const touch = event.changedTouches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>) {
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];
    touchStartRef.current = null;

    if (!start || !touch) {
      return;
    }

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const dominantDelta = Math.abs(deltaY) >= Math.abs(deltaX) ? deltaY : deltaX;

    if (Math.abs(dominantDelta) < 46) {
      return;
    }

    if (preview) {
      movePreview(dominantDelta < 0 ? 1 : -1);
      return;
    }

    if (dominantDelta < 0) {
      goNext();
      return;
    }

    goPrev();
  }

  return (
    <main
      className="profile-renderer presentation-deck"
      data-direction={direction}
      data-transition={transitionStyle}
      onTouchEnd={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onWheel={handleWheel}
    >
      <div className="deck-viewport" aria-live="polite">
        {profiles.map((profile, index) => (
          <Slide
            index={index}
            key={profile.id}
            motion={
              profile.id === selected.id ? "entering" : profile.id === exitingProfileId ? "exiting" : "idle"
            }
            position={getSlidePosition(index, selectedIndex, profiles.length)}
            profile={profile}
            selected={profile.id === selected.id}
            total={profiles.length}
            onPreview={openPreview}
          />
        ))}
      </div>

      <nav className="deck-controls" aria-label="角色翻页">
        <button className="deck-arrow" onClick={goPrev} type="button" aria-label="上一页">
          <ChevronLeft aria-hidden="true" size={20} />
        </button>
        <div className="deck-progress" aria-label={`第 ${selectedIndex + 1} 页，共 ${profiles.length} 页`}>
          <span>{String(selectedIndex + 1).padStart(2, "0")}</span>
          <div className="deck-dots">
            {profiles.map((profile, index) => (
              <button
                aria-label={`切换到 ${profile.name}`}
                aria-pressed={index === selectedIndex}
                className="deck-dot"
                data-active={index === selectedIndex}
                key={profile.id}
                onClick={() => goToIndex(index, index > selectedIndex ? "next" : "prev")}
                type="button"
              />
            ))}
          </div>
          <span>{String(profiles.length).padStart(2, "0")}</span>
        </div>
        <button className="deck-arrow" onClick={goNext} type="button" aria-label="下一页">
          <ChevronRight aria-hidden="true" size={20} />
        </button>
      </nav>

      {previewProfile && previewImage ? (
        <div
          className="gallery-preview"
          role="dialog"
          aria-modal="true"
          aria-label={`${previewProfile.name} 相册预览`}
          onClick={closePreview}
        >
          <div className="gallery-preview__surface" onClick={(event) => event.stopPropagation()}>
            <div className="gallery-preview__top">
              <strong>{previewProfile.name}</strong>
              <span>
                {String((preview?.index ?? 0) + 1).padStart(2, "0")} /{" "}
                {String(previewImages.length).padStart(2, "0")}
              </span>
              <button className="gallery-preview__close" type="button" aria-label="关闭预览" onClick={closePreview}>
                <X aria-hidden="true" size={20} />
              </button>
            </div>
            <div className="gallery-preview__stage">
              <button
                className="gallery-preview__nav gallery-preview__nav--prev"
                type="button"
                aria-label="上一张图片"
                onClick={() => movePreview(-1)}
              >
                <ChevronLeft aria-hidden="true" size={24} />
              </button>
              <DollImage
                image={previewImage}
                label={`${previewProfile.name} 相册预览`}
                className="gallery-preview__image"
                loading="eager"
              />
              <button
                className="gallery-preview__nav gallery-preview__nav--next"
                type="button"
                aria-label="下一张图片"
                onClick={() => movePreview(1)}
              >
                <ChevronRight aria-hidden="true" size={24} />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

type SlideProps = {
  index: number;
  motion: SlideMotion;
  position: SlidePosition;
  onPreview: (profileId: string, index: number) => void;
  profile: ProfileRendererProps["selected"];
  selected: boolean;
  total: number;
};

function Slide({ index, motion, position, onPreview, profile, selected, total }: SlideProps) {
  const featuredSection = profile.sections[0];
  const slideNumber = String(index + 1).padStart(2, "0");
  const totalNumber = String(total).padStart(2, "0");

  return (
    <section
      aria-hidden={!selected}
      aria-labelledby={`deck-slide-title-${profile.id}`}
      className="deck-slide"
      data-motion={motion}
      data-position={position}
      style={
        {
          "--page-color": profile.pageColor,
          "--accent-color": profile.accentColor,
        } as CSSProperties
      }
    >
      <div className="slide-bg-grid" aria-hidden="true" />
      <div className="slide-paper-grain" aria-hidden="true" />
      <div className="slide-inner">
        <div className="slide-copy">
          <div className="slide-kicker">
            <span>Yoshi Profile</span>
            <span>
              {slideNumber} / {totalNumber}
            </span>
          </div>
          <h1 id={`deck-slide-title-${profile.id}`}>{profile.name}</h1>
          <p className="slide-subtitle">{profile.displayName}</p>

          <div className="tag-row deck-tag-row" aria-label="角色标签">
            {profile.tags.map((tag) => (
              <span className="profile-tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>

          <div className="deck-facts" aria-label={`${profile.name} 基础信息`}>
            {profile.facts.slice(0, 5).map((fact) => (
              <div className="deck-fact" key={fact.label}>
                <span>{fact.label}</span>
                <strong>{fact.value}</strong>
              </div>
            ))}
          </div>

          {featuredSection ? (
            <section className="slide-story" aria-label={`${profile.name} ${featuredSection.title}`}>
              <h2>{featuredSection.title}</h2>
              <MarkdownBlock markdown={featuredSection.markdown} />
            </section>
          ) : null}
        </div>

        <div className="slide-visual">
          <div className="image-stage">
            <span className="image-stage__mat" aria-hidden="true" />
            <DollImage image={profile.heroImage} label={profile.name} loading={selected ? "eager" : "lazy"} />
            <span className="image-stage__caption" aria-hidden="true">
              No. {slideNumber}
            </span>
          </div>
          <div className="deck-gallery-shell">
            <span className="deck-gallery-label">Gallery</span>
            <div className="deck-gallery" aria-label={`${profile.name} 相册`}>
              {profile.gallery.slice(0, 3).map((image, galleryIndex) => (
                <button
                  className="deck-gallery-item"
                  key={`${profile.id}-${image}-${galleryIndex}`}
                  type="button"
                  aria-label={`预览 ${profile.name} 相册 ${galleryIndex + 1}`}
                  onClick={() => onPreview(profile.id, galleryIndex)}
                >
                  <DollImage image={image} label={`${profile.name} 相册 ${galleryIndex + 1}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function getSlidePosition(index: number, selectedIndex: number, total: number): SlidePosition {
  if (index === selectedIndex) {
    return "active";
  }

  if (index === (selectedIndex + 1) % total) {
    return "next";
  }

  if (index === (selectedIndex - 1 + total) % total) {
    return "prev";
  }

  return "far";
}
