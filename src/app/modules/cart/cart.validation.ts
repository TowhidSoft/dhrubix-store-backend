import { z } from "zod";

const createCartValidationSchema = z.object({
    productId: z.string(),
    quantity: z.string(),
})
    .strict();

const updateCartValidationSchema = z.object({
    productId: z.string(),
    quantity: z.string(),
})
    .strict();


export const CartValidation = {
    createCartValidationSchema,
    updateCartValidationSchema
};
