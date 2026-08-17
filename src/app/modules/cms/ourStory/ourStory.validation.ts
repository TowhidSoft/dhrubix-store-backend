import { z } from "zod";

const updateOurStoryValidationSchema = z.object({
    data: z.preprocess(
        (val) => {
            if (typeof val === "string") {
                try {
                    return JSON.parse(val);
                } catch {
                    return val;
                }
            }
            console.log("zod executed", val)
            return val;
        },
        z.object({
            title: z.string().optional(),
            subTitle: z.string().optional(),
        })
    ),
});

export const OurStoryValidation = {
    updateOurStoryValidationSchema,
};
