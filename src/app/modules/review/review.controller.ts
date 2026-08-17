import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status";
import { Request, Response } from "express";
import { ReviewService } from "./review.service";

export const create = catchAsync(async (req: Request, res: Response) => {
    const userId = req.body.userId || req.headers.id;
    const result = await ReviewService.create(userId, req.body);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        status: true,
        message: "Review created successfully",
        data: result,
    });
});

export const approveReview = catchAsync(async (req: Request, res: Response) => {
    const adminId = req.headers.id as string;
    const id = req.params.id as string;
    const result = await ReviewService.approveReview(id, adminId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Review approved !",
        data: result,
    });
});
export const isReviewed = catchAsync(async (req: Request, res: Response) => {
    const userId = req.headers.id as string;
    const { productId } = req.params;
    const result = await ReviewService.isReviewed(productId, userId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Review checked !",
        data: result,
    });
});

export const getAllApproved = catchAsync(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const result = await ReviewService.getAllApproved(productId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Product Review List Found",
        data: result,
    });
});

export const getAll = catchAsync(async (req: Request, res: Response) => {
    const result = await ReviewService.getAll(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Product Review List Found",
        data: result,
    });
});

// export const getReview = catchAsync(async (req: Request, res: Response) => {
//     const { id } = req.params;
//     const result = await ReviewService.getReview(id);
//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         status: true,
//         message: "Review Found",
//         data: result,
//     });
// });


export const deleteReview = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const adminId = req.headers.id as string;
    const result = await ReviewService.deleteReview(id, adminId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Brand deleted success.",
        data: result,
    });
});

