import { z } from "zod";

export const subscriberValidationSchema = z.object({
    email: z.string().email(),
});