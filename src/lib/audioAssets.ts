export type AudioAsset = {
  name: string;
  src: string;
};

const soundEffectModules = import.meta.glob("../assets/sound-effect/*.{mp3,wav,ogg,m4a}", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

function normalizeAssetName(path: string): string {
  return path
    .split("/")
    .pop()
    ?.replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ") ?? "audio";
}

function toSortedAudioAssets(modules: Record<string, string>): AudioAsset[] {
  return Object.entries(modules)
    .map(([path, src]) => ({
      name: normalizeAssetName(path),
      src,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
}

export const soundEffectTracks = toSortedAudioAssets(soundEffectModules);
