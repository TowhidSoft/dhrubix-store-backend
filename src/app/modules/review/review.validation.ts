import { z } from "zod";

export const createReviewValidationSchema = z.object({
    data: z.preprocess(
        (val) => {
            if (typeof val === "string") {
                try {
                    return JSON.parse(val);
                } catch {
                    return val;
                }
            }
            return val;
        },
        z.object({
            rating: z.string(),
            des: z.string().optional(),
            productId: z.string(),
            orderId: z.string()
        })
    ),
});

export const ReviewValidation = {
    createReviewValidationSchema,
    // updateUpdateValidationSchema,
    // updateUserSettingsSchema,
};
