import mongoose, { Document, Schema, Model, Types } from "mongoose";

// ILesson must extend Document so Mongoose subdoc methods (.toObject etc.) are available
export interface ILesson extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  order: number;
  isFree: boolean;
}

export interface ICourse extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  instructor: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced";
  priceCents: number;
  currency: string;
  isPublished: boolean;
  lessons: Types.DocumentArray<ILesson>;
  enrolledCount: number;
  rating: number;
  tags: string[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new Schema<ILesson>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    videoUrl: { type: String, default: "" },
    duration: { type: Number, default: 0 },
    order: { type: Number, required: true },
    isFree: { type: Boolean, default: false },
  },
  { _id: true },
);

const courseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    thumbnail: { type: String, default: null },
    instructor: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    priceCents: { type: Number, required: true, min: 0 },
    currency: {
      type: String,
      default: "NPR",
      enum: ["NPR", "USD"],
      uppercase: true,
      maxlength: 3,
    },
    isPublished: { type: Boolean, default: false },
    lessons: { type: [lessonSchema], default: [] },
    enrolledCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    tags: { type: [String], default: [] },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, versionKey: false },
);

courseSchema.index({ category: 1 });
courseSchema.index({ isPublished: 1 });
courseSchema.index({ createdAt: -1 });

const Course: Model<ICourse> = mongoose.model<ICourse>("Course", courseSchema);
export default Course;
