import { z } from "zod";

export const createSubcategoryValidationSchema = z.object({
    categoryId: z.string(),
    name: z.string(),
    des: z.string().optional(),
});

const updateSubcategoryValidationSchema = z.object({
    name: z.string().optional(),
    des: z.string().optional(),
});

export const SubcategoryValidation = {
    createSubcategoryValidationSchema,
    updateSubcategoryValidationSchema,
};
