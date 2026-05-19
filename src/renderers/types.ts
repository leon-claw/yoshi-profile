import type { ComponentType } from "react";
import type { DollProfile } from "../lib/types";

export type ProfileRendererProps = {
  profiles: DollProfile[];
  selected: DollProfile;
  onSelectProfile: (id: string) => void;
};

export type ProfileRenderer = {
  id: string;
  label: string;
  component: ComponentType<ProfileRendererProps>;
};
