import { z } from "zod";

export const createBrandValidationSchema = z.object({
    name: z.string(),
    des: z.string().optional(),
});

export const updateBrandValidationSchema = z.object({
    name: z.string().optional(),
    des: z.string().optional(),
});

export const BrandValidation = {
    createBrandValidationSchema,
    updateBrandValidationSchema,
    // updateUserSettingsSchema,
};
