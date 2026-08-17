import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status";
import { Request, Response } from "express";
import { SubscriberService } from "./subscriber.service";


export const create = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await SubscriberService.create(email);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        status: true,
        message: "Subscribed successfully",
        data: result,
    });
});

export const All = catchAsync(async (req: Request, res: Response) => {
    const result = await SubscriberService.All(req);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "All subscribers",
        meta: result.pagination,
        data: result.data,
    });
});