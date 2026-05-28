import { ChevronLeft, ChevronRight } from "lucide-react";
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

const IMPRESS_ROOT_ID = "impress";
const IMPRESS_TRANSITION_MS = 1250;
const WHEEL_LOCK_MS = 900;

type StepTransform = {
  x: number;
  y: number;
  z: number;
  rotate: number;
  rotateX: number;
  rotateY: number;
  scale: number;
};

type ImpressFrame = {
  width: number;
  height: number;
};

const transformPresets: StepTransform[] = [
  { x: 0, y: 0, z: 0, rotate: 0, rotateX: 0, rotateY: 0, scale: 1 },
  { x: 1320, y: -260, z: -640, rotate: 10, rotateX: 0, rotateY: -18, scale: 0.84 },
  { x: 2390, y: 430, z: -1320, rotate: -12, rotateX: 8, rotateY: 16, scale: 0.78 },
  { x: 1220, y: 1350, z: -2050, rotate: 18, rotateX: -10, rotateY: 8, scale: 0.88 },
  { x: -260, y: 1100, z: -1500, rotate: -18, rotateX: 7, rotateY: -18, scale: 0.82 },
  { x: -1280, y: 160, z: -820, rotate: 12, rotateX: -7, rotateY: 20, scale: 0.86 },
];

export function ImpressDeckRenderer({ profiles, selected, onSelectProfile }: ProfileRendererProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<ImpressApi | null>(null);
  const stepRefs = useRef<Map<string, HTMLElement>>(new Map());
  const wheelLockRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const selectedIdRef = useLatestRef(selected.id);
  const onSelectProfileRef = useLatestRef(onSelectProfile);
  const frame = useImpressFrame();
  const profileKey = useMemo(() => profiles.map((profile) => profile.id).join("|"), [profiles]);
  const selectedIndex = useMemo(
    () => Math.max(0, profiles.findIndex((profile) => profile.id === selected.id)),
    [profiles, selected.id],
  );
  const registerStep = useCallback(
    (id: string) => (element: HTMLElement | null) => {
      if (element) {
        stepRefs.current.set(id, element);
        return;
      }

      stepRefs.current.delete(id);
    },
    [],
  );

  const focusProfile = useCallback(
    (id: string) => {
      if (!profiles.some((profile) => profile.id === id)) {
        return;
      }

      focusStep(getProfileStepId(id), id, apiRef.current, stepRefs.current, onSelectProfileRef.current);
    },
    [onSelectProfileRef, profiles, selectedIdRef],
  );

  const goRelative = useCallback(
    (offset: number) => {
      if (!profiles.length) {
        return;
      }

      const currentIndex = Math.max(0, profiles.findIndex((profile) => profile.id === selectedIdRef.current));
      const nextIndex = (currentIndex + offset + profiles.length) % profiles.length;
      const target = profiles[nextIndex];

      if (target) {
        focusProfile(target.id);
      }
    },
    [focusProfile, profiles, selectedIdRef],
  );

  const focusGalleryStep = useCallback((profileId: string, galleryIndex: number) => {
    focusStep(
      getGalleryStepId(profileId, galleryIndex),
      profileId,
      apiRef.current,
      stepRefs.current,
      onSelectProfileRef.current,
    );
  }, [onSelectProfileRef]);

  useEffect(() => {
    const rootElement = rootRef.current;

    if (!rootElement) {
      return;
    }

    const activeRoot: HTMLDivElement = rootElement;
    let disposed = false;
    let api: ImpressApi | null = null;

    const handleStepEnter = (event: Event) => {
      const target = event.target;

      if (!(target instanceof HTMLElement)) {
        return;
      }

      const profileId = target.dataset.profileId;

      if (!profileId || !profiles.some((profile) => profile.id === profileId)) {
        return;
      }

      if (profileId !== selectedIdRef.current && target.dataset.stepKind === "profile") {
        requestInteractionSound();
        onSelectProfileRef.current(profileId);
      }
    };

    async function initializeImpress() {
      await import("impress.js");

      if (disposed || !window.impress) {
        return;
      }

      api = window.impress(IMPRESS_ROOT_ID);
      apiRef.current = api;
      activeRoot.addEventListener("impress:stepenter", handleStepEnter);
      api.init();

      const selectedStep =
        stepRefs.current.get(getStepIdFromHash(window.location.hash)) ??
        stepRefs.current.get(getProfileStepId(selectedIdRef.current));

      if (selectedStep) {
        api.goto(selectedStep, 0);
      }
    }

    void initializeImpress();

    return () => {
      disposed = true;
      activeRoot.removeEventListener("impress:stepenter", handleStepEnter);

      if (api) {
        api.tear();
      }

      if (apiRef.current === api) {
        apiRef.current = null;
      }
    };
  }, [frame.height, frame.width, onSelectProfileRef, profileKey, profiles, selectedIdRef]);

  useEffect(() => {
    const api = apiRef.current;
    const hashStepId = getStepIdFromHash(window.location.hash);
    const hashStep = stepRefs.current.get(hashStepId);
    const step =
      hashStep?.dataset.profileId === selected.id ? hashStep : stepRefs.current.get(getProfileStepId(selected.id));

    if (!api || !step || step.classList.contains("present") || step.classList.contains("active")) {
      return;
    }

    api.goto(step, IMPRESS_TRANSITION_MS);
  }, [selected.id]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        focusProfile(profiles[0]?.id ?? selected.id);
      }

      if (event.key === "End") {
        event.preventDefault();
        focusProfile(profiles[profiles.length - 1]?.id ?? selected.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [focusProfile, profiles, selected.id]);

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

    wheelLockRef.current = now + WHEEL_LOCK_MS;

    goRelative(dominantDelta > 0 ? 1 : -1);
  }

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    const touch = event.changedTouches[0];
    touchStartRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
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

    if (Math.abs(dominantDelta) < 48) {
      return;
    }

    if (Math.abs(deltaY) >= Math.abs(deltaX)) {
      goRelative(dominantDelta < 0 ? 1 : -1);
    }
  }

  return (
    <main
      className="profile-renderer impress-deck"
      data-selected-index={selectedIndex}
      onTouchEnd={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onWheel={handleWheel}
    >
      <div className="impress-backdrop" aria-hidden="true">
        <span className="impress-backdrop__beam impress-backdrop__beam--a" />
        <span className="impress-backdrop__beam impress-backdrop__beam--b" />
        <span className="impress-backdrop__grid" />
      </div>

      <div
        id={IMPRESS_ROOT_ID}
        className="impress-canvas"
        data-transition-duration={IMPRESS_TRANSITION_MS}
        data-width={frame.width}
        data-height={frame.height}
        data-perspective="880"
        data-max-scale="1.08"
        data-min-scale="0.28"
        ref={rootRef}
      >
        {profiles.flatMap((profile, profileIndex) => {
          const profileTransform = getImpressTransform(profileIndex);
          const profileStep = (
            <article
              aria-labelledby={`impress-title-${profile.id}`}
              className="step impress-doll-step"
              data-profile-id={profile.id}
              data-x={profileTransform.x}
              data-y={profileTransform.y}
              data-z={profileTransform.z}
              data-rotate={profileTransform.rotate}
              data-rotate-x={profileTransform.rotateX}
              data-rotate-y={profileTransform.rotateY}
              data-scale={profileTransform.scale}
              data-step-kind="profile"
              id={getProfileStepId(profile.id)}
              key={profile.id}
              ref={registerStep(getProfileStepId(profile.id))}
              style={
                {
                  "--page-color": profile.pageColor,
                  "--accent-color": profile.accentColor,
                } as CSSProperties
              }
            >
              <DollStepCard
                isSelected={profile.id === selected.id}
                onSelectGallery={focusGalleryStep}
                profile={profile}
              />
            </article>
          );

          const gallerySteps = profile.gallery.map((image, galleryIndex) => {
            const transform = getGalleryTransform(profileIndex, galleryIndex, profile.gallery.length);

            return (
              <article
                aria-label={`${profile.name} gallery ${galleryIndex + 1}`}
                className="step impress-gallery-step"
                data-profile-id={profile.id}
                data-step-kind="gallery"
                data-x={transform.x}
                data-y={transform.y}
                data-z={transform.z}
                data-rotate={transform.rotate}
                data-rotate-x={transform.rotateX}
                data-rotate-y={transform.rotateY}
                data-scale={transform.scale}
                id={getGalleryStepId(profile.id, galleryIndex)}
                key={`${profile.id}-gallery-${image}-${galleryIndex}`}
                ref={registerStep(getGalleryStepId(profile.id, galleryIndex))}
                style={
                  {
                    "--page-color": profile.pageColor,
                    "--accent-color": profile.accentColor,
                  } as CSSProperties
                }
              >
                <GalleryStepCard
                  image={image}
                  index={galleryIndex}
                  onBackToProfile={focusProfile}
                  onSelectGallery={focusGalleryStep}
                  profile={profile}
                />
              </article>
            );
          });

          return [profileStep, ...gallerySteps];
        })}
      </div>

      <nav className="impress-deck-controls" aria-label="Deck navigation">
        <button className="impress-deck-arrow" type="button" aria-label="Previous profile" onClick={() => goRelative(-1)}>
          <ChevronLeft aria-hidden="true" size={22} />
        </button>
        <div className="impress-deck-dots" aria-label="Profiles">
          {profiles.map((profile, index) => (
            <button
              aria-label={`Show ${profile.name}`}
              aria-pressed={index === selectedIndex}
              className="impress-deck-dot"
              data-active={index === selectedIndex}
              key={profile.id}
              onClick={() => focusProfile(profile.id)}
              type="button"
            />
          ))}
        </div>
        <button className="impress-deck-arrow" type="button" aria-label="Next profile" onClick={() => goRelative(1)}>
          <ChevronRight aria-hidden="true" size={22} />
        </button>
      </nav>

    </main>
  );
}

type DollStepCardProps = {
  isSelected: boolean;
  onSelectGallery: (profileId: string, galleryIndex: number) => void;
  profile: ProfileRendererProps["selected"];
};

function DollStepCard({ isSelected, onSelectGallery, profile }: DollStepCardProps) {
  const featuredSection = profile.sections[0];
  const featuredFacts = profile.facts.slice(0, 4);
  const gallery = profile.gallery.slice(0, 4);

  return (
    <div className="impress-doll-card">
      <div className="impress-doll-card__wash" aria-hidden="true" />
      <div className="impress-copy-stack">
        <p className="impress-eyebrow">Yoshi dossier</p>
        <h1 id={`impress-title-${profile.id}`}>{profile.name}</h1>
        <p className="impress-nickname">{profile.displayName}</p>

        <div className="impress-tags" aria-label="Tags">
          {profile.tags.map((tag) => (
            <span className="impress-tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="impress-hero-stack">
        <div className="impress-hero-frame">
          <span className="impress-hero-frame__plate" aria-hidden="true" />
          <DollImage image={profile.heroImage} label={profile.name} loading={isSelected ? "eager" : "lazy"} />
        </div>

        {gallery.length ? (
          <div className="impress-gallery" aria-label={`${profile.name} gallery`}>
            {gallery.map((image, index) => (
              <button
                className="impress-gallery-thumb"
                key={`${profile.id}-${image}-${index}`}
                type="button"
                aria-label={`Open gallery image ${index + 1}`}
                onClick={() => onSelectGallery(profile.id, index)}
              >
                <DollImage image={image} label={`${profile.name} gallery ${index + 1}`} />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <aside className="impress-profile-panel">
        <div className="impress-fact-grid">
          {featuredFacts.map((fact) => (
            <div className="impress-fact" key={fact.label}>
              <span>{fact.label}</span>
              <strong>{fact.value}</strong>
            </div>
          ))}
        </div>

        {featuredSection ? (
          <section className="impress-story" aria-label={`${profile.name} ${featuredSection.title}`}>
            <h2>{featuredSection.title}</h2>
            <MarkdownBlock markdown={featuredSection.markdown} />
          </section>
        ) : null}
      </aside>
    </div>
  );
}

type GalleryStepCardProps = {
  image: string;
  index: number;
  onBackToProfile: (profileId: string) => void;
  onSelectGallery: (profileId: string, galleryIndex: number) => void;
  profile: ProfileRendererProps["selected"];
};

function GalleryStepCard({ image, index, onBackToProfile, onSelectGallery, profile }: GalleryStepCardProps) {
  const total = profile.gallery.length;

  return (
    <div className="impress-gallery-card">
      <div className="impress-gallery-card__wash" aria-hidden="true" />
      <div className="impress-gallery-meta">
        <button className="impress-gallery-back" type="button" onClick={() => onBackToProfile(profile.id)}>
          <ChevronLeft aria-hidden="true" size={18} />
          <span>Profile</span>
        </button>
        <p>{profile.name}</p>
        <strong>
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </strong>
      </div>

      <div className="impress-gallery-photo-frame">
        <span className="impress-gallery-photo-frame__mat" aria-hidden="true" />
        <DollImage image={image} label={`${profile.name} gallery ${index + 1}`} loading="eager" />
      </div>

      <div className="impress-gallery-filmstrip" aria-label={`${profile.name} gallery navigation`}>
        {profile.gallery.map((galleryImage, galleryIndex) => (
          <button
            aria-label={`Show gallery image ${galleryIndex + 1}`}
            aria-pressed={galleryIndex === index}
            className="impress-gallery-filmstrip__item"
            data-active={galleryIndex === index}
            key={`${profile.id}-filmstrip-${galleryImage}-${galleryIndex}`}
            onClick={() => onSelectGallery(profile.id, galleryIndex)}
            type="button"
          >
            <DollImage image={galleryImage} label={`${profile.name} gallery thumbnail ${galleryIndex + 1}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

function getImpressTransform(index: number): StepTransform {
  const preset = transformPresets[index];

  if (preset) {
    return preset;
  }

  const angle = index * 54;
  const radians = (angle * Math.PI) / 180;
  const radius = 1500 + (index % 3) * 260;

  return {
    x: Math.round(Math.cos(radians) * radius),
    y: Math.round(Math.sin(radians) * radius * 0.62),
    z: -900 - index * 340,
    rotate: Math.round(angle - 90),
    rotateX: ((index % 3) - 1) * 8,
    rotateY: ((index % 4) - 1.5) * 12,
    scale: 0.76 + (index % 2) * 0.08,
  };
}

function getGalleryTransform(profileIndex: number, galleryIndex: number, total: number): StepTransform {
  const base = getImpressTransform(profileIndex);
  const spread = galleryIndex - (total - 1) / 2;

  return {
    x: base.x + 560 + galleryIndex * 330,
    y: base.y + 360 + spread * 180,
    z: base.z - 620 - galleryIndex * 150,
    rotate: base.rotate + 10 + spread * 4,
    rotateX: base.rotateX + (galleryIndex % 2 === 0 ? -7 : 6),
    rotateY: base.rotateY - 20 - spread * 4,
    scale: 0.72,
  };
}

function getProfileStepId(profileId: string) {
  return `dolls/${profileId}`;
}

function getGalleryStepId(profileId: string, galleryIndex: number) {
  return `dolls/${profileId}/gallery/${galleryIndex + 1}`;
}

function getStepIdFromHash(hash: string) {
  const normalized = hash.replace(/^#\/?/, "");
  return /^dolls\/[a-z0-9-]+(?:\/gallery\/\d+)?$/i.test(normalized) ? normalized : "";
}

function focusStep(
  stepId: string,
  profileId: string,
  api: ImpressApi | null,
  steps: Map<string, HTMLElement>,
  onSelectProfile: (id: string) => void,
) {
  const step = steps.get(stepId);

  requestInteractionSound();

  if (api && step) {
    api.goto(step, IMPRESS_TRANSITION_MS);
    return;
  }

  onSelectProfile(profileId);
}

function useLatestRef<T>(value: T) {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}

function useImpressFrame(): ImpressFrame {
  const [frame, setFrame] = useState(getImpressFrame);

  useEffect(() => {
    let animationFrame = 0;

    const updateFrame = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => setFrame(getImpressFrame()));
    };

    window.addEventListener("resize", updateFrame);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", updateFrame);
    };
  }, []);

  return frame;
}

function getImpressFrame(): ImpressFrame {
  const width = window.innerWidth;
  const height = window.innerHeight;

  if (width <= 640) {
    return {
      width: Math.max(320, Math.round(width)),
      height: Math.max(560, Math.round(height)),
    };
  }

  if (width <= 980) {
    return {
      width: 900,
      height: 760,
    };
  }

  return {
    width: 1200,
    height: 760,
  };
}
