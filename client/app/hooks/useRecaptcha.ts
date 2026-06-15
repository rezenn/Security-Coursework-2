"use client";
import { useCallback } from "react";

declare global {
  interface Window {
    grecaptcha: {
      ready: (cb: () => void) => void;
      execute: (
        siteKey: string,
        options: { action: string },
      ) => Promise<string>;
    };
  }
}

export function useRecaptcha() {
  const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

  const getToken = useCallback(
    (action: string): Promise<string> => {
      // In dev without a real key, return the bypass token after a short
      // simulated delay so the UI can briefly show a "verifying" state.
      if (!SITE_KEY || SITE_KEY === "") {
        console.warn("[reCAPTCHA] No site key – using dev bypass token");
        return new Promise((resolve) =>
          setTimeout(() => resolve("test-token"), 600),
        );
      }

      return new Promise((resolve, reject) => {
        if (typeof window === "undefined" || !window.grecaptcha) {
          console.warn(
            "[reCAPTCHA] grecaptcha not loaded – using dev bypass token",
          );
          resolve("test-token");
          return;
        }
        window.grecaptcha.ready(() => {
          window.grecaptcha
            .execute(SITE_KEY, { action })
            .then(resolve)
            .catch(reject);
        });
      });
    },
    [SITE_KEY],
  );

  return { getToken, siteKey: SITE_KEY };
}
