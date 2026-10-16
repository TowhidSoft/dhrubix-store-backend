import { z } from "zod";

export const createProductValidationSchema = z.object({
    name: z.string(),
    shortDes: z.string(),
    des: z.string().optional(),
    aff_link: z.string().url().optional(),
    specification: z.string().optional(),
    sizeId: z.string().nullable().optional(),
    colorId: z.string().nullable().optional(),
    categoryId: z.string(),
    subcategoryId: z.string().nullable().optional(),
    brandId: z.string().nullable().optional(),
    tag: z.string().optional(),
    price: z.string(),
    shippingFee: z.string().optional(),
    discount: z.boolean().optional(),
    discountPercent: z.string().optional(),
    stock: z.boolean(),
    quantity: z.string(),
    videoUrls: z.array(z.string().url()).max(3).optional(),
})

const updateProductValidationSchema = z.object({
    name: z.string().optional(),
    shortDes: z.string().optional(),
    des: z.string().optional(),
    aff_link: z.string().url().optional(),
    specification: z.string().optional(),
    sizeId: z.string().nullable().optional(),
    colorId: z.string().nullable().optional(),
    categoryId: z.string().optional(),
    subcategoryId: z.string().nullable().optional(),
    brandId: z.string().nullable().optional(),
    tag: z.string().optional(),
    price: z.string().optional(),
    shippingFee: z.string().optional(),
    discount: z.boolean().optional(),
    discountPercent: z.string().optional(),
    stock: z.boolean().optional(),
    quantity: z.string().optional(),
    removeImages: z.array(z.string()).optional(),
    removeVideos: z.array(z.string()).optional(),
    videoUrls: z.array(z.string().url()).max(3).optional(),
    removeVideoUrls: z.array(z.string()).optional(),
})


export const ProductValidation = {
    createProductValidationSchema,
    updateProductValidationSchema,
};
