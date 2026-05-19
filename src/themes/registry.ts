export const themes = [
  {
    id: "macaron-pop",
    label: "马卡龙",
  },
  {
    id: "soft-gallery",
    label: "轻柔馆",
  },
] as const;

export type ThemeId = (typeof themes)[number]["id"];

export function isThemeId(value: string): value is ThemeId {
  return themes.some((theme) => theme.id === value);
}
