import { z } from "zod";

export const createColorValidationSchema = z.object({
    name: z.string(),
});

export const ColorValidation = {
    createColorValidationSchema,
    updateColorValidationSchema: createColorValidationSchema,
};
