import { useEffect, useRef } from "react";

export const useRecaptcha = () => {
  const recaptchaRef = useRef<string | null>(null);

  useEffect(() => {
    const loadRecaptcha = () => {
      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    };

    if (!window.grecaptcha) {
      loadRecaptcha();
    }
  }, []);

  const getToken = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (window.grecaptcha) {
        window.grecaptcha.ready(() => {
          const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
          if (!siteKey) {
            reject(new Error("reCAPTCHA site key not configured"));
            return;
          }
          window.grecaptcha
            .execute(siteKey, { action: "submit" })
            .then(resolve);
        });
      } else {
        reject(new Error("reCAPTCHA not loaded"));
      }
    });
  };

  return { getToken };
};
