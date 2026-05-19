export type DollFact = {
  label: string;
  value: string;
};

export type DollSection = {
  title: string;
  markdown: string;
};

export type DollProfile = {
  id: string;
  name: string;
  displayName: string;
  pageColor: string;
  accentColor: string;
  heroImage: string;
  gallery: string[];
  tags: string[];
  facts: DollFact[];
  sections: DollSection[];
};

export type ProfileCollection = {
  title: string;
  profiles: DollProfile[];
};
