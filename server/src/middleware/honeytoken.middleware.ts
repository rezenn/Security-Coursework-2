import { Request, Response, Router } from "express";
import { logSecurityEvent } from "../utils/logger.utils";
import { sendAdminAlertEmail } from "../services/email.service";

const CANARY_PATHS = [
  "/api/admin/backup-export",
  "/api/admin/db-dump",
  "/api/internal/debug",
  "/api/.env",
  "/.env.bak",
  "/.git/config",
  "/api/v1/debug/console",
  "/wp-admin/admin-ajax.php",
];

interface BlockEntry {
  reason: string;
  blockedAt: number;
}

// In-memory IP block store. This is a single-process Express app behind a
// single Docker container (per docker-compose.yml), so process memory is a
// correct and honest choice here — a multi-instance deployment would move
// this to Redis, which is noted rather than silently glossed over.
const blockedIPs = new Map<string, BlockEntry>();
const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export const isBlocked = (ip: string): boolean => {
  const entry = blockedIPs.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.blockedAt > BLOCK_DURATION_MS) {
    blockedIPs.delete(ip);
    return false;
  }
  return true;
};

/**
 * Mounted first in the middleware chain (before Helmet, body parsing, rate
 * limiting) so a previously-flagged IP is rejected as cheaply as possible —
 * no point spending DB/CPU budget on a request we're already going to drop.
 */
export const canaryBlockGuard = (
  req: Request,
  res: Response,
  next: () => void,
): void => {
  const clientIp = req.ip || "unknown";
  if (isBlocked(clientIp)) {
    logSecurityEvent("blocked_ip_request", null, clientIp, {
      path: req.path,
    });
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
};

export const honeytokenRouter = Router();

CANARY_PATHS.forEach((canaryPath) => {
  honeytokenRouter.all(canaryPath, (req: Request, res: Response) => {
    const clientIp = req.ip || "unknown";
    blockedIPs.set(clientIp, { reason: canaryPath, blockedAt: Date.now() });

    logSecurityEvent("honeytoken_triggered", null, clientIp, {
      path: canaryPath,
      method: req.method,
      userAgent: req.headers["user-agent"] || "unknown",
    });

    sendAdminAlertEmail(
      "Honeytoken triggered — possible attack in progress",
      `A canary endpoint was accessed: <code>${req.method} ${canaryPath}</code> from IP
       <code>${clientIp}</code>.</p><p>This path is never linked or called by the
       application, so this is almost certainly automated reconnaissance or an active
       exploitation attempt. The source IP has been temporarily blocked at the
       application layer for 30 minutes.`,
    ).catch(() => {});

    // Identical response shape to the real 404 handler — an attacker
    // scanning for content cannot distinguish a canary hit from a genuine
    // missing route.
    res.status(404).json({ error: "Route not found" });
  });
});
