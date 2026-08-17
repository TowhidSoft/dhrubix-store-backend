import { z } from "zod";

const createWishlistValidationSchema = z.object({
    productId: z.string(),
})
    .strict();


export const WishlistValidation = {
    createWishlistValidationSchema,
};
