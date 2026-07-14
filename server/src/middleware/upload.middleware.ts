import multer, { FileFilterCallback } from "multer";
import { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import {
  matchesImageSignature,
  readFileHeader,
} from "../utils/fileSignature.utils";
import { logSecurityEvent } from "../utils/logger.utils";

// ── Storage roots ───────────────────────────────────────────────────────────
// Files are served statically from /uploads (see server.ts). Kept outside
// src/ so a `tsc` build doesn't touch them, and gitignored so no user
// uploads or credentials ever land in version control.
const UPLOAD_ROOT = path.join(__dirname, "../../uploads");
const AVATAR_DIR = path.join(UPLOAD_ROOT, "avatars");
const COURSE_DIR = path.join(UPLOAD_ROOT, "courses");

[UPLOAD_ROOT, AVATAR_DIR, COURSE_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ── Only allow real image types, checked by extension AND mimetype ─────────
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const safeFilename = (originalName: string): string => {
  const ext = path.extname(originalName).toLowerCase();
  const random = crypto.randomBytes(16).toString("hex");
  return `${Date.now()}-${random}${ext}`;
};

const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_MIME.has(file.mimetype) || !ALLOWED_EXT.has(ext)) {
    cb(new Error("Only JPG, PNG, WEBP, or GIF images are allowed"));
    return;
  }
  cb(null, true);
};

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename: (_req, file, cb) => cb(null, safeFilename(file.originalname)),
});

const courseStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, COURSE_DIR),
  filename: (_req, file, cb) => cb(null, safeFilename(file.originalname)),
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
  fileFilter: imageFileFilter,
}).single("avatar");

export const uploadCourseThumbnail = multer({
  storage: courseStorage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
  fileFilter: imageFileFilter,
}).single("thumbnail");

/**
 * Runs AFTER multer has written the file to disk (fileFilter above only
 * sees the declared mimetype/filename, never the actual bytes) and BEFORE
 * the route's controller touches it. Reads just the file's header and
 * checks it against the real binary signature for the type it claims to
 * be — see fileSignature.utils.ts. A mismatch means the client-declared
 * mimetype/extension was spoofed (accidentally or, more likely here,
 * deliberately), so the file is deleted immediately rather than ever
 * being linked from a course/profile.
 */
export const verifyImageMagicBytes = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.file) {
    next();
    return;
  }

  const header = readFileHeader(req.file.path, 16);
  if (!matchesImageSignature(header, req.file.mimetype)) {
    const userId = req.user?.sub ?? null;
    fs.unlink(req.file.path, () => {
      /* best-effort cleanup */
    });
    logSecurityEvent("upload_content_mismatch", userId, req.ip || "unknown", {
      declaredMimetype: req.file.mimetype,
      originalName: req.file.originalname,
      headerHex: header.toString("hex"),
    });
    res.status(400).json({
      error:
        "File content does not match its declared image type and was rejected",
    });
    return;
  }

  next();
};

// Public URL builders (relative — client prefixes with API origin if needed)
export const avatarUrl = (filename: string): string =>
  `/uploads/avatars/${filename}`;
export const courseThumbnailUrl = (filename: string): string =>
  `/uploads/courses/${filename}`;

export const deleteUploadedFile = (
  publicUrl: string | null | undefined,
): void => {
  if (!publicUrl || !publicUrl.startsWith("/uploads/")) return;
  const filePath = path.join(UPLOAD_ROOT, publicUrl.replace("/uploads/", ""));
  // Guard against path traversal — resolved path must stay inside UPLOAD_ROOT
  if (!filePath.startsWith(UPLOAD_ROOT)) return;
  fs.unlink(filePath, () => {
    /* ignore missing file */
  });
};

const CONTENT_TYPE_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export const saveCourseThumbnailBuffer = (
  buffer: Buffer,
  contentType: string,
): string => {
  const ext = CONTENT_TYPE_EXT[contentType];
  if (!ext) throw new Error("Unsupported content type");
  const filename = safeFilename(`upload${ext}`);
  fs.writeFileSync(path.join(COURSE_DIR, filename), buffer);
  return filename;
};
