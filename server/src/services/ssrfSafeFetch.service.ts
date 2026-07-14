import http from "http";
import https from "https";
import dns from "dns/promises";
import net from "net";
import { URL } from "url";
import { logSecurityEvent } from "../utils/logger.utils";

/**
 * SSRF-safe outbound fetcher (CWE-918: Server-Side Request Forgery).
 *
 * This exists to support ONE real feature: an admin importing a course
 * thumbnail by pasting an image URL instead of uploading a file (see
 * course.controller.ts `importThumbnailFromUrl`). Any endpoint where the
 * server fetches a URL the client supplies is a textbook SSRF vector —
 * without these checks, an attacker could point the server at:
 *   - http://169.254.169.254/  (cloud instance metadata — AWS/GCP/Azure
 *     credential theft, the single most common real-world SSRF payoff)
 *   - http://localhost:5000/api/admin/...  (bypass network-level access
 *     controls by making the *trusted* server call its own internal API)
 *   - http://10.x.x.x / 192.168.x.x  (pivot into internal-only services)
 *
 * Mitigations implemented here, in order:
 *   1. Protocol allowlist — only http/https (blocks file://, gopher://,
 *      dict://, ftp:// payloads used in classic SSRF-to-RCE chains).
 *   2. DNS resolved ourselves, BEFORE connecting, and the resolved IP is
 *      checked against private/reserved ranges. Off-the-shelf HTTP clients
 *      (axios/fetch) do their own internal DNS lookup at connect time,
 *      which opens a DNS-rebinding gap: validate a hostname that currently
 *      resolves to a public IP, then the attacker's DNS server changes the
 *      answer to an internal IP by the time the "real" request fires.
 *   3. The actual TCP connection is made directly to the validated IP
 *      (not the hostname) — the hostname is only reused for the Host
 *      header and TLS SNI. This closes the rebinding gap completely,
 *      because there is no second DNS lookup to tamper with.
 *   4. Redirects are never followed automatically — a 3xx to an internal
 *      URL is one of the most common SSRF-filter bypasses.
 *   5. Response Content-Type is checked against an image allowlist and
 *      the body is size-capped while streaming, so this can't be abused
 *      to exfiltrate arbitrary internal file contents or as a DoS vector.
 */

const PRIVATE_IPV4_RANGES: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local — includes 169.254.169.254 cloud metadata
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved
];

const ipToLong = (ip: string): number =>
  ip
    .split(".")
    .reduce((acc, octet) => (acc << 8) + (parseInt(octet, 10) & 0xff), 0) >>> 0;

const isPrivateIPv4 = (ip: string): boolean => {
  const target = ipToLong(ip);
  return PRIVATE_IPV4_RANGES.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (target & mask) === (ipToLong(base) & mask);
  });
};

const isPrivateIPv6 = (ip: string): boolean => {
  const lower = ip.toLowerCase();
  return (
    lower === "::1" || // loopback
    lower === "::" ||
    lower.startsWith("fc") || // unique local
    lower.startsWith("fd") ||
    lower.startsWith("fe80") || // link-local
    lower.startsWith("::ffff:127.") || // IPv4-mapped loopback
    lower.startsWith("::ffff:10.") ||
    lower.startsWith("::ffff:192.168.") ||
    lower.startsWith("::ffff:169.254.")
  );
};

export const isBlockedAddress = (ip: string): boolean => {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  if (net.isIPv6(ip)) return isPrivateIPv6(ip);
  return true; // couldn't classify it — fail closed, not open
};

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_BYTES = 5 * 1024 * 1024; // 5MB, matches the multer upload limit
const FETCH_TIMEOUT_MS = 5000;

export class SsrfBlockedError extends Error {}

export const fetchImageSafely = async (
  rawUrl: string,
  context: { userId: string; ip: string },
): Promise<{ buffer: Buffer; contentType: string }> => {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SsrfBlockedError("That doesn't look like a valid URL");
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new SsrfBlockedError("Only http:// and https:// URLs are allowed");
  }

  let addresses: { address: string }[];
  try {
    addresses = await dns.lookup(url.hostname, { all: true });
  } catch {
    throw new SsrfBlockedError("Could not resolve that hostname");
  }
  if (addresses.length === 0) {
    throw new SsrfBlockedError("Could not resolve that hostname");
  }

  for (const { address } of addresses) {
    if (isBlockedAddress(address)) {
      logSecurityEvent("ssrf_attempt_blocked", context.userId, context.ip, {
        requestedUrl: rawUrl,
        resolvedIp: address,
      });
      throw new SsrfBlockedError(
        "This URL resolves to a private/internal address and cannot be fetched",
      );
    }
  }

  const resolvedIp = addresses[0].address;
  const client = url.protocol === "https:" ? https : http;
  const port = url.port
    ? parseInt(url.port, 10)
    : url.protocol === "https:"
      ? 443
      : 80;

  return new Promise((resolve, reject) => {
    const req = client.request(
      {
        host: resolvedIp, // connect to the IP we validated, not the hostname
        servername: url.protocol === "https:" ? url.hostname : undefined,
        port,
        path: url.pathname + url.search,
        headers: {
          Host: url.hostname,
          "User-Agent": "GyanKosh-ThumbnailFetcher/1.0",
        },
        timeout: FETCH_TIMEOUT_MS,
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400) {
          res.resume();
          reject(
            new SsrfBlockedError(
              "Redirects are not followed for security reasons",
            ),
          );
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          reject(
            new SsrfBlockedError(
              `Remote server returned status ${res.statusCode}`,
            ),
          );
          return;
        }

        const contentType = (res.headers["content-type"] || "")
          .split(";")[0]
          .trim();
        if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
          res.resume();
          reject(
            new SsrfBlockedError("URL did not return a supported image type"),
          );
          return;
        }

        const chunks: Buffer[] = [];
        let total = 0;
        res.on("data", (chunk: Buffer) => {
          total += chunk.length;
          if (total > MAX_BYTES) {
            req.destroy();
            reject(new SsrfBlockedError("Image exceeds the 5MB size limit"));
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () =>
          resolve({ buffer: Buffer.concat(chunks), contentType }),
        );
        res.on("error", () =>
          reject(new SsrfBlockedError("Failed while downloading the image")),
        );
      },
    );

    req.on("timeout", () => {
      req.destroy();
      reject(new SsrfBlockedError("Request to that URL timed out"));
    });
    req.on("error", () =>
      reject(new SsrfBlockedError("Failed to fetch that URL")),
    );
    req.end();
  });
};
