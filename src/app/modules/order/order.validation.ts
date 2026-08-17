import { Currency, OrderStatus, PaymentMethod } from "@prisma/client";
import { z } from "zod";

export const createColorValidationSchema = z.object({
    frontendCartItems: z.array(
        z.object({
            productId: z.string(),
            quantity: z.number(),
        })
    ).optional(),
    shippingDetails: z.object({
        name: z.string(),
        email: z.string(),
        phone: z.string(),
        address: z.string(),
        city: z.string(),
        state: z.string(),
        country: z.string(),
        zipCode: z.string(),
        currency: z.enum(Currency),
        paymentMethod: z.enum(PaymentMethod),
    }).optional(),
});

export const updateOrderStatusValidationSchema = z.object({
    status: z.enum(OrderStatus),
    trackingNumber: z.string().optional(),
    shippingCarrier: z.string().optional(),
    estimatedDelivery: z.string().optional(), // ISO date string, parsed to Date in the service
});

export const OrderValidation = {
    createOrderValidationSchema: createColorValidationSchema,
    updateOrderStatusValidationSchema,
};
