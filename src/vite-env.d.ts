/// <reference types="vite/client" />

declare module "*.md?raw" {
  const content: string;
  export default content;
}

declare module "impress.js";

type ImpressStepTarget = number | string | HTMLElement;

type ImpressApi = {
  init: () => void;
  tear: () => void;
  next: (event?: Event) => HTMLElement | false | undefined;
  prev: (event?: Event) => HTMLElement | false | undefined;
  goto: (step: ImpressStepTarget, duration?: number) => HTMLElement | false | undefined;
  swipe?: (amount: number) => HTMLElement | false | undefined;
};

interface Window {
  impress?: (rootId?: string) => ImpressApi;
}
