import { Request, Response } from "express";
import Course from "../models/course.model";
import User from "../models/user.model";
import { logSecurityEvent } from "../utils/logger.utils";

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
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search, "i")] } },
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

  // ILesson now extends Document so .toObject() is valid
  // Non-enrolled users only see free preview lessons (video URL stripped)
  const lessons = isEnrolled
    ? course.lessons.map((l) => l.toObject())
    : course.lessons
        .filter((l) => l.isFree)
        .map((l) => {
          const obj = l.toObject();
          obj.videoUrl = ""; // strip video URL for previews
          return obj;
        });

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

  const {
    title,
    description,
    instructor,
    category,
    level,
    priceCents,
    currency,
    tags,
  } = req.body;

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
    currency: currency || "USD",
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

  // Whitelist to prevent mass-assignment attacks
  const ALLOWED_FIELDS = [
    "title",
    "description",
    "instructor",
    "category",
    "level",
    "priceCents",
    "currency",
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

  logSecurityEvent("course_deleted", req.user.sub, ip(req), {
    courseId: req.params.id,
    title: course.title,
  });

  res.status(200).json({ message: "Course deleted" });
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

  const ALLOWED_FIELDS = [
    "title",
    "description",
    "videoUrl",
    "duration",
    "order",
    "isFree",
  ] as const;

  ALLOWED_FIELDS.forEach((k) => {
    if (req.body[k] !== undefined) {
      if (k === "duration" || k === "order") {
        (lesson as any)[k] = parseInt(String(req.body[k]), 10) || 0;
      } else if (k === "isFree") {
        lesson.isFree = Boolean(req.body[k]);
      } else {
        (lesson as any)[k] = String(req.body[k]).trim();
      }
    }
  });

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

  // Re-sequence remaining lessons' `order` so there are no gaps
  course.lessons
    .sort((a, b) => a.order - b.order)
    .forEach((l, idx) => {
      l.order = idx + 1;
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

  const { lessonIds } = req.body as { lessonIds: string[] };
  if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
    res.status(400).json({ error: "lessonIds array is required" });
    return;
  }

  const course = await Course.findById(req.params.id);
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  // Only reorder lessons that actually belong to this course
  const validIds = new Set(course.lessons.map((l) => l._id.toString()));
  const filtered = lessonIds.filter((id) => validIds.has(id));

  filtered.forEach((id, idx) => {
    const lesson = course.lessons.id(id);
    if (lesson) lesson.order = idx + 1;
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
