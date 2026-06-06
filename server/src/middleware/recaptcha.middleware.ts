import { NextFunction, Request, Response } from "express";
import config from "../config/env.config";

export const verifyRecaptcha = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!config.recaptcha.enabled) {
    return next();
  }

  const token =
    (req.body && req.body.captchaToken) ||
    req.headers["x-captcha-token"] ||
    req.headers["x-recaptcha-token"];

  if (!token || typeof token !== "string") {
    res.status(400).json({ error: "Captcha token is required" });
    return;
  }

  try {
    const payload = new URLSearchParams();
    payload.append("secret", config.recaptcha.secret);
    payload.append("response", token);
    payload.append("remoteip", req.ip || "");

    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        body: payload,
      },
    );

    const result = (await response.json()) as {
      success: boolean;
      score?: number;
      [key: string]: unknown;
    };

    if (!result.success) {
      res.status(400).json({ error: "Captcha verification failed" });
      return;
    }

    if (typeof result.score === "number" && result.score < 0.5) {
      res.status(400).json({ error: "Captcha score too low" });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: "Captcha verification failed" });
  }
};
