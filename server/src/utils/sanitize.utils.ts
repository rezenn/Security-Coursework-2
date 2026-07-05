export const escapeRegex = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Builds a safe, length-capped, case-insensitive RegExp from user input. */
export const safeSearchRegex = (input: string, maxLength = 100): RegExp =>
  new RegExp(escapeRegex(input.slice(0, maxLength)), "i");
