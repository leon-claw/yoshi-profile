import { useEffect, useMemo, useState } from "react";
import markdownSource from "./content/dolls.md?raw";
import { parseDollsMarkdown } from "./lib/markdownProfile";
import { buildProfileHash, parseProfileIdFromHash, resolveProfileId } from "./lib/routing";
import { getRenderer } from "./renderers/registry";
import { PROFILE_DESIGN_THEME } from "./themeSettings";

const collection = parseDollsMarkdown(markdownSource);

export function App() {
  const [selectedId, setSelectedId] = useState(() =>
    resolveProfileId(collection.profiles, parseProfileIdFromHash(window.location.hash)),
  );

  useEffect(() => {
    const syncFromHash = () => {
      setSelectedId(resolveProfileId(collection.profiles, parseProfileIdFromHash(window.location.hash)));
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const selected = useMemo(
    () => collection.profiles.find((profile) => profile.id === selectedId) ?? collection.profiles[0],
    [selectedId],
  );
  const ActiveRenderer = getRenderer("presentation-deck").component;

  useEffect(() => {
    document.title = `${selected.name} - ${collection.title}`;
  }, [selected.name]);

  function handleSelectProfile(id: string) {
    window.location.hash = buildProfileHash(id);
  }

  return (
    <div className={`app-shell theme-soft-gallery profile-style-${PROFILE_DESIGN_THEME}`}>
      <ActiveRenderer
        onSelectProfile={handleSelectProfile}
        profiles={collection.profiles}
        selected={selected}
      />
    </div>
  );
}
