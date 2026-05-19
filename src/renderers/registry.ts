import { PresentationDeckRenderer } from "./PresentationDeckRenderer";
import type { ProfileRenderer } from "./types";

export const renderers = [
  {
    id: "presentation-deck",
    label: "幻灯片",
    component: PresentationDeckRenderer,
  },
] satisfies ProfileRenderer[];

export type RendererId = (typeof renderers)[number]["id"];

export function isRendererId(value: string): value is RendererId {
  return renderers.some((renderer) => renderer.id === value);
}

export function getRenderer(id: RendererId) {
  return renderers.find((renderer) => renderer.id === id) ?? renderers[0];
}
