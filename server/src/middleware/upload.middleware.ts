import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";

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
