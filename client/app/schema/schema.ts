import z from "zod";

export const registrationSchema = z
  .object({
    fullName: z.string().min(1, { message: "Enter your full name" }),
    email: z.email({ message: "Enter a vaild email" }),
    phoneNumber: z.string().min(7, { message: "Enter your phone number" }),
    password: z.string().min(8, { message: "Enter atleast 8 chracters" }),
    confirmPassword: z
      .string()
      .min(6, { message: "Enter atleast 8 chracters" }),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Password do not match",
  });

export type RegistrationData = z.infer<typeof registrationSchema>;

export const loginSchema = z.object({
  email: z.email({ message: "Enter a vaild email" }),
  password: z.string().min(8, { message: "Enter atleast 8 chracters" }),
});

export type LoginData = z.infer<typeof loginSchema>;
