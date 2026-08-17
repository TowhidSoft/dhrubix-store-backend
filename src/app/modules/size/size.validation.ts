import { z } from "zod";

export const createSizeValidationSchema = z.object({
    name: z.string(),
    des: z.string().optional(),

});

export const updateSizeValidationSchema = z.object({
    name: z.string().optional(),
    des: z.string().optional(),
});

export const SizeValidation = {
    createSizeValidationSchema,
    updateSizeValidationSchema,
};
