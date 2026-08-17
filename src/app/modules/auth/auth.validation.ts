import { Gender, Role } from "@prisma/client";
import { z } from "zod";

const userRegisterSchema = z
  .object({
    name: z.string(),
    email: z.string().email(),
    password: z.string(),
    dob: z.string().optional(),
    gender: z.enum(Gender).optional(),
    role: z.enum([Role.ADMIN, Role.CUSTOMER]).default("CUSTOMER").optional(),
  })
  .strict();

const userEmailVerifySchema = z
  .object({
    email: z.string().email(),
    otp: z.string().length(6),
  })
  .strict();

const userLoginSchema = z
  .object({
    email: z.string().email(),
    password: z.string(),
  })
  .strict();

const changePasswordValidationSchema = z.object({
  oldPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

const refreshTokenValidationSchema = z.object({
  cookies: z.object({
    refreshToken: z.string().nonempty({ message: "Refresh token is required!" }),
  }),
});

const contactFormSubmitValidationSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string(),
});

export const AuthValidation = {
  userRegisterSchema,
  userEmailVerifySchema,
  userLoginSchema,
  refreshTokenValidationSchema,
  changePasswordValidationSchema,
  contactFormSubmitValidationSchema
};
