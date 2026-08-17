import catchAsync from "../../shared/catchAsync";
import httpStatus from "http-status"
import sendResponse from "../../shared/sendResponse";
import { PaymentService } from "./payment.service";
import { Request, Response } from "express";


export const history = catchAsync(async (req: Request, res: Response) => {
    const userId = req.body.userId || req.headers.id as string;
    const result = await PaymentService.history(userId, req);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "User payment history found",
        meta: result.pagination,
        data: result.data,
    });
});

export const adminHistory = catchAsync(async (req: Request, res: Response) => {
    const adminId = req.body.userId || req.headers.id as string;
    const result = await PaymentService.adminHistory(adminId, req);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "All payment history found",
        meta: result.pagination,
        data: result.data,
    });
});

export const detais = catchAsync(async (req: Request, res: Response) => {
    const adminId = req.body.userId || req.headers.id as string;
    const { id } = req.params;
    const result = await PaymentService.detais(adminId, id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Payment details found",
        data: result,
    });
});
