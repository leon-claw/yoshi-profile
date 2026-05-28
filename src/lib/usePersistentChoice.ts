import { useEffect, useState } from "react";

export function usePersistentChoice<T extends string>(
  key: string,
  fallback: T,
  isValid: (value: string) => value is T,
) {
  const [state, setState] = useState(() => {
    if (typeof window === "undefined") {
      return { key, value: fallback };
    }

    const stored = window.localStorage.getItem(key);
    return { key, value: stored && isValid(stored) ? stored : fallback };
  });
  const value = state.key === key ? state.value : readChoice(key, fallback, isValid);

  useEffect(() => {
    if (state.key !== key || state.value !== value) {
      setState({ key, value });
    }
  }, [key, state.key, state.value, value]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(key, value);
  }, [key, value]);

  const setValue = (nextValue: T) => setState({ key, value: nextValue });

  return [value, setValue] as const;
}

function readChoice<T extends string>(
  key: string,
  fallback: T,
  isValid: (value: string) => value is T,
) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const stored = window.localStorage.getItem(key);
  return stored && isValid(stored) ? stored : fallback;
}
