"use client";

import { useState, useEffect } from "react";

export function useSessionStorage<T>(key: string, initialValue?: T) {
  const [storedValue, setStoredValue] = useState<T | null>(() => {
    if (typeof window === "undefined") {
      return initialValue || null;
    }
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue || null;
    } catch (error) {
      console.error("Error reading from session storage:", error);
      return initialValue || null;
    }
  });

  const setValue = (value: T | ((val: T | null) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      setStoredValue(valueToStore);

      if (typeof window !== "undefined") {
        sessionStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error("Error saving to sessionStorage:", error);
    }
  };

  const removeValue = () => {
    try {
      setStoredValue(null);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(key);
      }
    } catch (error) {
      console.error("Error removing to sessionStorage:", error);
    }
  };
  return [storedValue, setValue, removeValue] as const;
}
