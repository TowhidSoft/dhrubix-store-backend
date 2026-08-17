import { Gender } from "@prisma/client";
import { z } from "zod";

const updateProfileValidationSchema = z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    intro: z.string().optional(),
    bloodGroup: z.string().optional(),
    gender: z.enum(Gender).optional(),
    dob: z.string().optional(),
    zip: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    address: z.string().optional(),
    country: z.string().optional(),
});
export type UpdateProfileDto = z.infer<typeof updateProfileValidationSchema>;

const changePasswordValidationSchema = z.object({
    oldPassword: z.string().min(6),
    newPassword: z.string().min(6),
});

const refreshTokenValidationSchema = z.object({
    cookies: z.object({
        refreshToken: z.string().nonempty({ message: "Refresh token is required!" }),
    }),
});


const updateUserSettingsSchema = z.object({
    defaultEmergencyMessage: z.string().max(500).optional(),
    isLocationTrackingEnabled: z.boolean().optional(),
    notificationSound: z.string().optional(),
    vibrationEnabled: z.boolean().optional(),
});

export const UserValidation = {
    refreshTokenValidationSchema,
    updateProfileValidationSchema,
    changePasswordValidationSchema,
    updateUserSettingsSchema,
};
