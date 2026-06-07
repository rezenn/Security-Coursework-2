declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (
        siteKey: string,
        options: { action: string },
      ) => Promise<string>;
      render: (containerId: string, options: any) => void;
      reset: () => void;
      getResponse: () => string;
    };
  }
}

export {};
