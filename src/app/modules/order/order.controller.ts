import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import httpStatus from "http-status"
import { OrderService } from "./order.service";
import sendResponse from "../../shared/sendResponse";
import path from "path";
import fs from "fs";
import ApiError from "../../../errors/apiError";

export const createOrder = catchAsync(async (req: Request, res: Response) => {
    const userId = req.headers.id as string;
    const { frontendCartItems, shippingDetails } = req.body;


    const result = await OrderService.createOrderFromCart(userId, shippingDetails, frontendCartItems);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        status: true,
        message: "Order created successfully",
        data: result,
    });
});

export const allOrder = catchAsync(async (req: Request, res: Response) => {
    const userId = req.headers.id as string;

    const result = await OrderService.allOrder(userId, req);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        status: true,
        message: "All Order Found successfully",
        meta: result.pagination,
        data: result.data,
    });
});

export const allOrderAdmin = catchAsync(async (req: Request, res: Response) => {
    const result = await OrderService.allOrderAdmin(req);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        status: true,
        message: "All Order Found successfully",
        meta: result.pagination,
        data: result.data,
    });
});

export const orderDetails = catchAsync(async (req: Request, res: Response) => {
    const adminId = req.headers.id as string;
    const { id } = req.params;
    const result = await OrderService.orderDetails(adminId, id);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        status: true,
        message: "Order details found",
        data: result,
    });
});

// Customer-facing: fetch a single order (their own only) — powers the
// "My Orders / Tracking" page on the storefront.
export const customerOrderDetails = catchAsync(async (req: Request, res: Response) => {
    const userId = req.headers.id as string;
    const { id } = req.params;
    const result = await OrderService.customerOrderDetails(userId, id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Order details found",
        data: result,
    });
});

export const updateStatus = catchAsync(async (req: Request, res: Response) => {
    const adminId = req.headers.id as string;
    const { id } = req.params;
    const parseBody = req.body;
    const result = await OrderService.updateStatus(adminId, id, parseBody);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        status: true,
        message: "Order status updated",
        data: result,
    });
});

// Tells the admin dashboard which statuses are legal to move this order to
// next, so the UI can't even present an invalid/reversed transition.
export const getNextStatuses = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await OrderService.getNextStatuses(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Allowed next statuses found",
        data: result,
    });
});

// Streams the generated invoice PDF for download. Customers can only fetch
// their own order's invoice; admins can fetch any.
export const downloadInvoice = catchAsync(async (req: Request, res: Response) => {
    const userId = req.headers.id as string;
    const role = req.headers.role as string;
    const { id } = req.params;

    const order = role === "ADMIN"
        ? await OrderService.orderDetails(userId, id)
        : await OrderService.customerOrderDetails(userId, id);

    if (!order.invoiceUrl) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            "No invoice available for this order yet — it's generated once the order is marked Delivered."
        );
    }

    const filename = `invoice-${order.orderNo}.pdf`;
    const filePath = path.join(process.cwd(), "uploads", filename);

    if (!fs.existsSync(filePath)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Invoice file not found on server.");
    }

    res.download(filePath, filename);
});
