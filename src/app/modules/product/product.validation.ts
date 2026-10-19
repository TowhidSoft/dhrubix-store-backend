import { z } from "zod";

const affiliateLinkSchema = z.string().url().refine(
    (value) => /^https?:\/\//i.test(value),
    "Affiliate link must use HTTP or HTTPS",
);

export const createProductValidationSchema = z.object({
    name: z.string(),
    shortDes: z.string(),
    des: z.string().optional(),
    specification: z.string().optional(),
    sizeId: z.string().nullable().optional(),
    colorId: z.string().nullable().optional(),
    categoryId: z.string(),
    subcategoryId: z.string().nullable().optional(),
    brandId: z.string().nullable().optional(),
    tag: z.string().optional(),
    price: z.string().optional(),
    shippingFee: z.string().optional(),
    discount: z.boolean().optional(),
    discountPercent: z.string().optional(),
    stock: z.boolean(),
    quantity: z.string().optional(),
    videoUrls: z.array(z.string().url()).max(3).optional(),
    affiliateItem: z.boolean().optional(),
    affiliateLink: affiliateLinkSchema.nullable().optional(),
}).superRefine((product, context) => {
    if (!product.affiliateItem && !product.price?.trim()) {
        context.addIssue({
            code: "custom",
            path: ["price"],
            message: "Price is required for non-affiliate products",
        });
    }
    if (!product.affiliateItem && !product.quantity?.trim()) {
        context.addIssue({
            code: "custom",
            path: ["quantity"],
            message: "Quantity is required for non-affiliate products",
        });
    }
    if (product.affiliateItem && !product.affiliateLink) {
        context.addIssue({
            code: "custom",
            path: ["affiliateLink"],
            message: "Affiliate products require an affiliate link",
        });
    }
});

const updateProductValidationSchema = z.object({
    name: z.string().optional(),
    shortDes: z.string().optional(),
    des: z.string().optional(),
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
    affiliateItem: z.boolean().optional(),
    affiliateLink: affiliateLinkSchema.nullable().optional(),
})


export const ProductValidation = {
    createProductValidationSchema,
    updateProductValidationSchema,
};
