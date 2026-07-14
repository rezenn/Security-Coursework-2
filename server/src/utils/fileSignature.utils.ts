import fs from "fs";

/**
 * Magic-byte (file signature) verification — CWE-434 (Unrestricted Upload
 * of File with Dangerous Type).
 *
 * The existing multer `fileFilter` (upload.middleware.ts) checks the
 * client-declared `mimetype` and the filename's extension. Both of those
 * are attacker-controlled: `mimetype` comes straight from the
 * `Content-Type` part of the multipart form field, and the extension is
 * just a string in the filename — neither says anything about what bytes
 * are actually inside the file. A PHP web shell renamed to `shell.jpg`
 * with the form field's Content-Type manually set to `image/jpeg` in
 * Burp sails straight through a filter that only looks at those two
 * things.
 *
 * This module checks the file's actual first bytes against the known
 * binary signature ("magic number") of each allowed image format, which
 * is the same technique tools like `file(1)`/`libmagic` use, and is
 * independent of anything the client claims.
 */

export type AllowedImageMime = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

type SignatureCheck = (buf: Buffer) => boolean;

const SIGNATURES: Record<AllowedImageMime, SignatureCheck> = {
  // JPEG: starts with FF D8 FF
  "image/jpeg": (buf) =>
    buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,

  // PNG: fixed 8-byte signature
  "image/png": (buf) =>
    buf.length >= 8 &&
    buf
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),

  // GIF: "GIF87a" or "GIF89a"
  "image/gif": (buf) =>
    buf.length >= 6 &&
    (buf.subarray(0, 6).toString("ascii") === "GIF87a" ||
      buf.subarray(0, 6).toString("ascii") === "GIF89a"),

  // WEBP: "RIFF" .... "WEBP" (bytes 0-3 and 8-11)
  "image/webp": (buf) =>
    buf.length >= 12 &&
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP",
};

/** True only if `buffer` actually starts with the binary signature for
 * `declaredMime`. Returns false (fail closed) for any unrecognised mime. */
export const matchesImageSignature = (
  buffer: Buffer,
  declaredMime: string,
): boolean => {
  const check = SIGNATURES[declaredMime as AllowedImageMime];
  if (!check) return false;
  return check(buffer);
};

/** Reads just the first `bytes` of a file from disk — we only need a
 * handful of header bytes to check a signature, never the whole file. */
export const readFileHeader = (filePath: string, bytes = 16): Buffer => {
  const fd = fs.openSync(filePath, "r");
  try {
    const buffer = Buffer.alloc(bytes);
    const bytesRead = fs.readSync(fd, buffer, 0, bytes, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    fs.closeSync(fd);
  }
};
