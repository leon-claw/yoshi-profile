import { ChevronRight } from "lucide-react";
import type { CSSProperties } from "react";
import type { ProfileRendererProps } from "./types";
import { DollImage } from "./DollImage";
import { MarkdownBlock } from "./MarkdownBlock";

export function CompactRibbonRenderer({ profiles, selected, onSelectProfile }: ProfileRendererProps) {
  return (
    <main
      className="profile-renderer renderer-ribbon"
      style={
        {
          "--page-color": selected.pageColor,
          "--accent-color": selected.accentColor,
        } as CSSProperties
      }
    >
      <nav className="ribbon-tabs" aria-label="角色列表">
        {profiles.map((profile) => (
          <button
            className="ribbon-tab"
            data-active={profile.id === selected.id}
            key={profile.id}
            onClick={() => onSelectProfile(profile.id)}
            style={{ "--tab-color": profile.pageColor } as CSSProperties}
            type="button"
          >
            <span>{profile.name}</span>
            <ChevronRight aria-hidden="true" size={16} />
          </button>
        ))}
      </nav>

      <section className="ribbon-hero" aria-labelledby="ribbon-profile-title">
        <div>
          <span className="stage-kana">Ribbon</span>
          <h1 id="ribbon-profile-title">{selected.name}</h1>
          <p>{selected.displayName}</p>
        </div>
        <DollImage image={selected.heroImage} label={selected.name} className="ribbon-image" loading="eager" />
      </section>

      <section className="ribbon-content" aria-label={`${selected.name} 信息`}>
        <div className="ribbon-facts">
          {selected.facts.map((fact) => (
            <div className="fact-item" key={fact.label}>
              <span>{fact.label}</span>
              <strong>{fact.value}</strong>
            </div>
          ))}
        </div>
        <div className="ribbon-story">
          {selected.sections.map((section) => (
            <section className="markdown-section" key={section.title}>
              <h2>{section.title}</h2>
              <MarkdownBlock markdown={section.markdown} />
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
