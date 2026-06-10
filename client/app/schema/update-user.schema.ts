import { z } from "zod";

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const updateUserSchema = z.object({
  fullName: z.string().min(2, "Minimum 2 characters"),
  email: z.string().email("Invalid email"),
  phoneNumber: z.string().min(3, "Minimum 3 characters"),
  profileImage: z
    .instanceof(File)
    .optional()
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, {
      message: "Max file size is 5MB",
    })
    .refine((file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type), {
      message: "Only jpg, jpeg, png, webp allowed",
    }),
});

export type UpdateUserData = z.infer<typeof updateUserSchema>;

export const createUserSchema = z
  .object({
    fullName: z.string().min(2, "Minimum 2 characters"),
    email: z.string().email("Invalid email"),
    phoneNumber: z.string().min(7, "Minimum 7 characters"),
    profileImage: z
      .instanceof(File)
      .optional()
      .refine((file) => !file || file.size <= MAX_FILE_SIZE, {
        message: "Max file size is 5MB",
      })
      .refine((file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type), {
        message: "Only jpg, jpeg, png, webp allowed",
      }),
    password: z.string().min(8, { message: "Enter atleast 8 chracters" }),
    confirmPassword: z
      .string()
      .min(6, { message: "Enter atleast 8 chracters" }),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Password do not match",
  });

export type CreateUserData = z.infer<typeof createUserSchema>;
