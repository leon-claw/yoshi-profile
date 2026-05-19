import { useEffect, useState } from "react";

export function usePersistentChoice<T extends string>(
  key: string,
  fallback: T,
  isValid: (value: string) => value is T,
) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return fallback;
    }

    const stored = window.localStorage.getItem(key);
    return stored && isValid(stored) ? stored : fallback;
  });

  useEffect(() => {
    window.localStorage.setItem(key, value);
  }, [key, value]);

  return [value, setValue] as const;
}
