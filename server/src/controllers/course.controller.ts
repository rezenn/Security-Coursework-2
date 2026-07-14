import { Request, Response } from "express";
import Course from "../models/course.model";
import User from "../models/user.model";
import { logSecurityEvent } from "../utils/logger.utils";
import {
  courseThumbnailUrl,
  deleteUploadedFile,
  saveCourseThumbnailBuffer,
} from "../middleware/upload.middleware";
import {
  fetchImageSafely,
  SsrfBlockedError,
} from "../services/ssrfSafeFetch.service";
import { safeSearchRegex } from "../utils/sanitize.utils";

const ip = (req: Request) => req.ip || "unknown";

// ── GET /api/courses ─────────────────────────────────────────────────────────
export const listCourses = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { category, level, search, page = "1", limit = "12" } = req.query;
  const filter: Record<string, unknown> = { isPublished: true };

  if (category) filter.category = category;
  if (level) filter.level = level;
  if (search && typeof search === "string") {
    const searchRegex = safeSearchRegex(search);
    filter.$or = [
      { title: { $regex: searchRegex } },
      { description: { $regex: searchRegex } },
      { tags: { $in: [searchRegex] } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .select("-lessons")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Course.countDocuments(filter),
  ]);

  res.status(200).json({
    courses,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
  });
};

// ── GET /api/courses/:slug ───────────────────────────────────────────────────
export const getCourse = async (req: Request, res: Response): Promise<void> => {
  const course = await Course.findOne({
    slug: req.params.slug,
    isPublished: true,
  });

  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  // Check if requesting user is enrolled
  let isEnrolled = false;
  if (req.user) {
    const user = await User.findById(req.user.sub).select("enrolledCourses");
    isEnrolled =
      user?.enrolledCourses.some(
        (id) => id.toString() === course._id.toString(),
      ) ?? false;
  }

  // Non-enrolled users only see free preview lessons — but the whole point
  // of a "free preview" is that its video IS playable, so unlike paid
  // lessons (which are excluded entirely by the filter below) we must NOT
  // strip the videoUrl here. Stripping it made every free lesson look
  // available but silently unwatchable.
  const lessons = isEnrolled
    ? course.lessons.map((l) => l.toObject())
    : course.lessons.filter((l) => l.isFree).map((l) => l.toObject());

  const courseData = course.toObject();
  courseData.lessons = lessons as any;

  res.status(200).json({ course: courseData, isEnrolled });
};

// ── POST /api/admin/courses ──────────────────────────────────────────────────
export const createCourse = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const { title, description, instructor, category, level, priceCents, tags } =
    req.body;

  if (!title || !description || !category) {
    res
      .status(400)
      .json({ error: "title, description, and category are required" });
    return;
  }

  // Deterministic slug from title + timestamp suffix to guarantee uniqueness
  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80)
      .replace(/^-|-$/g, "") + `-${Date.now()}`;

  const course = await Course.create({
    title,
    slug,
    description,
    instructor: instructor || "GyanKosh",
    category,
    level: level || "beginner",
    priceCents: parseInt(String(priceCents), 10) || 0,
    // GyanKosh is NPR-only (see course.model.ts enum). The old default of
    // "USD" here was never a valid enum value, which is why saving a course
    // (or re-validating it when a lesson was added) crashed with a
    // Mongoose ValidationError. Always default to NPR; never trust a
    // client-supplied currency on an NPR-only platform.
    currency: "NPR",
    tags: Array.isArray(tags) ? tags : [],
    createdBy: req.user.sub,
  });

  logSecurityEvent("course_created", req.user.sub, ip(req), {
    courseId: course._id.toString(),
    title,
  });

  res.status(201).json({ message: "Course created", course });
};

// ── PATCH /api/admin/courses/:id ─────────────────────────────────────────────
export const updateCourse = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  // Whitelist to prevent mass-assignment attacks. currency is intentionally
  // excluded — GyanKosh only ever settles in NPR (see course.model.ts).
  const ALLOWED_FIELDS = [
    "title",
    "description",
    "instructor",
    "category",
    "level",
    "priceCents",
    "tags",
    "thumbnail",
    "isPublished",
  ];

  const updates: Record<string, unknown> = {};
  ALLOWED_FIELDS.forEach((k) => {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  });

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  const course = await Course.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true },
  );

  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  logSecurityEvent("course_updated", req.user.sub, ip(req), {
    courseId: req.params.id,
    updatedFields: Object.keys(updates),
  });

  res.status(200).json({ message: "Course updated", course });
};

// ── DELETE /api/admin/courses/:id ────────────────────────────────────────────
export const deleteCourse = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  if (course.thumbnail) deleteUploadedFile(course.thumbnail);

  logSecurityEvent("course_deleted", req.user.sub, ip(req), {
    courseId: req.params.id,
    title: course.title,
  });

  res.status(200).json({ message: "Course deleted" });
};

// ── POST /api/admin/courses/:id/thumbnail ────────────────────────────────────
export const uploadThumbnail = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: "No image file uploaded" });
    return;
  }

  const course = await Course.findById(req.params.id);
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  const oldThumbnail = course.thumbnail;
  course.thumbnail = courseThumbnailUrl(req.file.filename);
  await course.save();

  if (oldThumbnail) deleteUploadedFile(oldThumbnail);

  logSecurityEvent("course_thumbnail_updated", req.user.sub, ip(req), {
    courseId: req.params.id,
  });

  res.status(200).json({ message: "Thumbnail updated", course });
};

// ── POST /api/admin/courses/:id/thumbnail-url ────────────────────────────────
// Alternative to the file-upload path above: admin pastes an image URL
// instead of uploading a file. This is the classic SSRF-prone shape
// ("server fetches a URL the client supplies") — see
// ssrfSafeFetch.service.ts for the full set of mitigations applied before
// any outbound request is made.
export const importThumbnailFromUrl = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const { url } = req.body;
  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "url is required" });
    return;
  }

  const course = await Course.findById(req.params.id);
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  let fetched;
  try {
    fetched = await fetchImageSafely(url, {
      userId: req.user.sub,
      ip: ip(req),
    });
  } catch (err) {
    if (err instanceof SsrfBlockedError) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(400).json({ error: "Failed to fetch image from that URL" });
    return;
  }

  const filename = saveCourseThumbnailBuffer(
    fetched.buffer,
    fetched.contentType,
  );
  const oldThumbnail = course.thumbnail;
  course.thumbnail = courseThumbnailUrl(filename);
  await course.save();

  if (oldThumbnail) deleteUploadedFile(oldThumbnail);

  logSecurityEvent(
    "course_thumbnail_imported_from_url",
    req.user.sub,
    ip(req),
    {
      courseId: req.params.id,
      sourceUrl: url,
    },
  );

  res.status(200).json({ message: "Thumbnail imported", course });
};

// ── POST /api/admin/courses/:id/lessons ──────────────────────────────────────
export const addLesson = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const course = await Course.findById(req.params.id);
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  const { title, description, videoUrl, duration, isFree } = req.body;

  if (!title) {
    res.status(400).json({ error: "Lesson title is required" });
    return;
  }

  const order = course.lessons.length + 1;

  course.lessons.push({
    title: String(title).trim(),
    description: description ? String(description).trim() : "",
    videoUrl: videoUrl ? String(videoUrl).trim() : "",
    duration: parseInt(String(duration), 10) || 0,
    order,
    isFree: Boolean(isFree),
  } as any);

  await course.save();

  logSecurityEvent("lesson_added", req.user.sub, ip(req), {
    courseId: req.params.id,
    lessonTitle: title,
  });

  res.status(201).json({ message: "Lesson added", course });
};

// ── PATCH /api/admin/courses/:id/lessons/:lessonId ───────────────────────────
export const updateLesson = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const course = await Course.findById(req.params.id);
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  const lesson = course.lessons.id(req.params.lessonId);
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  const { title, description, videoUrl, duration, isFree } = req.body;
  if (title !== undefined) lesson.title = String(title).trim();
  if (description !== undefined)
    lesson.description = String(description).trim();
  if (videoUrl !== undefined) lesson.videoUrl = String(videoUrl).trim();
  if (duration !== undefined)
    lesson.duration = parseInt(String(duration), 10) || 0;
  if (isFree !== undefined) lesson.isFree = Boolean(isFree);

  await course.save();

  logSecurityEvent("lesson_updated", req.user.sub, ip(req), {
    courseId: req.params.id,
    lessonId: req.params.lessonId,
  });

  res.status(200).json({ message: "Lesson updated", course });
};

// ── DELETE /api/admin/courses/:id/lessons/:lessonId ──────────────────────────
export const deleteLesson = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const course = await Course.findById(req.params.id);
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  const lesson = course.lessons.id(req.params.lessonId);
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  lesson.deleteOne();

  // Re-number remaining lessons so `order` stays contiguous
  course.lessons
    .sort((a, b) => a.order - b.order)
    .forEach((l, i) => {
      l.order = i + 1;
    });

  await course.save();

  logSecurityEvent("lesson_deleted", req.user.sub, ip(req), {
    courseId: req.params.id,
    lessonId: req.params.lessonId,
  });

  res.status(200).json({ message: "Lesson deleted", course });
};

// ── PATCH /api/admin/courses/:id/lessons/reorder ─────────────────────────────
export const reorderLessons = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const { lessonIds } = req.body;
  if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
    res.status(400).json({ error: "lessonIds array is required" });
    return;
  }

  const course = await Course.findById(req.params.id);
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  // Every id in the incoming order must belong to this course — otherwise
  // reject rather than silently dropping/duplicating lessons.
  const existingIds = new Set(course.lessons.map((l) => l._id.toString()));
  const incomingIds = new Set(lessonIds);
  const validRequest =
    lessonIds.length === existingIds.size &&
    lessonIds.every((id: string) => existingIds.has(id)) &&
    incomingIds.size === lessonIds.length;

  if (!validRequest) {
    res.status(400).json({
      error: "lessonIds must match the course's existing lessons exactly",
    });
    return;
  }

  lessonIds.forEach((id: string, index: number) => {
    const lesson = course.lessons.id(id);
    if (lesson) lesson.order = index + 1;
  });

  await course.save();

  logSecurityEvent("lessons_reordered", req.user.sub, ip(req), {
    courseId: req.params.id,
  });

  res.status(200).json({ message: "Lessons reordered", course });
};

// ── GET /api/admin/courses ───────────────────────────────────────────────────
export const adminListCourses = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const courses = await Course.find()
    .sort({ createdAt: -1 })
    .populate("createdBy", "username email");

  res.status(200).json({ courses });
};
