import { Request, Response } from "express";
import { logSecurityEvent } from "../utils/logger.utils";

export const reportCspViolation = (req: Request, res: Response): void => {
  const body = (req.body || {}) as Record<string, unknown>;
  const report =
    (body["csp-report"] as Record<string, unknown> | undefined) || body;

  logSecurityEvent("csp_violation", null, req.ip || "unknown", {
    blockedUri: report["blocked-uri"],
    violatedDirective:
      report["violated-directive"] || report["effective-directive"],
    documentUri: report["document-uri"],
    sourceFile: report["source-file"],
    lineNumber: report["line-number"],
  });

  res.status(204).end();
};
