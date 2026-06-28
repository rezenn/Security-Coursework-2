import { NextFunction, Request, Response } from "express";
import config from "../config/env.config";

export const verifyRecaptcha = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // Skip in development or if not configured
  if (!config.recaptcha.enabled) return next();

  const token =
    req.body?.captchaToken ||
    req.headers["x-captcha-token"] ||
    req.headers["x-recaptcha-token"];

  if (!token || typeof token !== "string") {
    res.status(400).json({ error: "Captcha verification required" });
    return;
  }

  try {
    const payload = new URLSearchParams();
    payload.append("secret", config.recaptcha.secret);
    payload.append("response", token);
    payload.append("remoteip", req.ip || "");

    const r = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      body: payload,
    });
    const result = (await r.json()) as { success: boolean; score?: number };

    if (!result.success || (typeof result.score === "number" && result.score < 0.5)) {
      res.status(400).json({ error: "Captcha verification failed" });
      return;
    }
    next();
  } catch {
    res.status(500).json({ error: "Captcha service unavailable" });
  }
};
