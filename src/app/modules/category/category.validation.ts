import { Gender } from "@prisma/client";
import { z } from "zod";

export const createCategoryValidationSchema = z.object({
    name: z.string(),
    des: z.string().optional(),
});

const updateCategoryValidationSchema = z.object({
    name: z.string().optional(),
    des: z.string().optional(),
});

export const CategoryValidation = {
    createCategoryValidationSchema,
    updateCategoryValidationSchema,
    // updateUserSettingsSchema,
};
