import { z } from "zod";

export const createBlogValidationSchema = z.object({
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
            title: z.string(),
            subTitle: z.string().optional(),
            des: z.string(),
            active: z.boolean().optional()
        })
    ),
});

const updateBlogValidationSchema = z.object({
    data: z.preprocess(
        (val) => {
            if (typeof val === "string") {
                try {
                    return JSON.parse(val);
                } catch {
                    return val;
                }
            }
            console.log("zod executed")
            return val;
        },
        z.object({
            title: z.string().optional(),
            subTitle: z.string().optional(),
            des: z.string().optional(),
            active: z.boolean().optional(),
            removeImages: z.string().optional()
        })
    ),
});

export const BlogValidation = {
    createBlogValidationSchema,
    updateBlogValidationSchema,
};
