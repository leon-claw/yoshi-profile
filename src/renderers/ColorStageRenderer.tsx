import { Heart, Sparkles } from "lucide-react";
import type { CSSProperties } from "react";
import type { ProfileRendererProps } from "./types";
import { DollImage } from "./DollImage";
import { MarkdownBlock } from "./MarkdownBlock";

export function ColorStageRenderer({ profiles, selected, onSelectProfile }: ProfileRendererProps) {
  return (
    <main
      className="profile-renderer renderer-color-stage"
      style={
        {
          "--page-color": selected.pageColor,
          "--accent-color": selected.accentColor,
        } as CSSProperties
      }
    >
      <nav className="character-rail" aria-label="角色列表">
        {profiles.map((profile) => (
          <button
            className="character-tab"
            data-active={profile.id === selected.id}
            key={profile.id}
            onClick={() => onSelectProfile(profile.id)}
            style={
              {
                "--tab-color": profile.pageColor,
                "--tab-accent": profile.accentColor,
              } as CSSProperties
            }
            type="button"
          >
            <DollImage image={profile.heroImage} label={profile.name} className="character-tab__image" />
            <span>{profile.name}</span>
          </button>
        ))}
      </nav>

      <section className="character-stage" aria-labelledby="selected-profile-title">
        <div className="stage-ribbon" />
        <div className="stage-copy">
          <span className="stage-kana">Profile</span>
          <h1 id="selected-profile-title">{selected.name}</h1>
          <p>{selected.displayName}</p>
          <div className="tag-row" aria-label="角色标签">
            {selected.tags.map((tag) => (
              <span className="profile-tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="spotlight" aria-hidden="true">
          <DollImage image={selected.heroImage} label={selected.name} className="spotlight-image" loading="eager" />
        </div>

        <div className="fact-strip" aria-label="基础信息">
          {selected.facts.slice(0, 6).map((fact) => (
            <div className="fact-item" key={fact.label}>
              <span>{fact.label}</span>
              <strong>{fact.value}</strong>
            </div>
          ))}
        </div>

        <div className="gallery-strip" aria-label="角色相册">
          {selected.gallery.map((image, index) => (
            <button className="gallery-tile" key={`${image}-${index}`} type="button">
              <DollImage image={image} label={`${selected.name} 相册 ${index + 1}`} />
            </button>
          ))}
        </div>
      </section>

      <aside className="profile-panel" aria-label={`${selected.name} 档案`}>
        <div className="panel-heading">
          <Sparkles aria-hidden="true" size={18} />
          <span>角色档案</span>
          <button aria-label={`收藏 ${selected.name}`} className="icon-action" type="button">
            <Heart aria-hidden="true" size={18} />
          </button>
        </div>

        {selected.sections.map((section) => (
          <section className="markdown-section" key={section.title}>
            <h2>{section.title}</h2>
            <MarkdownBlock markdown={section.markdown} />
          </section>
        ))}
      </aside>
    </main>
  );
}
