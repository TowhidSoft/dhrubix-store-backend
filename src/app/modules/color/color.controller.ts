import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status";
import { Request, Response } from "express";
import { ColorService } from "./color.service";

export const create = catchAsync(async (req: Request, res: Response) => {
    const adminId = req.body.userId || req.headers.id;
    const parsedBody = req.body;

    const result = await ColorService.create(adminId, parsedBody);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        status: true,
        message: "New color added.",
        data: result,
    });
});

export const update = catchAsync(async (req: Request, res: Response) => {
    const adminId = req.headers.id as string;
    const id = req.params.id as string;
    const parsedbody = req.body;

    const result = await ColorService.update(id, adminId, { ...parsedbody });
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Color updated successfully!",
        data: result,
    });
});

export const getAll = catchAsync(async (req: Request, res: Response) => {
    const result = await ColorService.getAll();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Color List Found",
        data: result,
    });
});

export const getColor = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ColorService.getColor(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Color Found",
        data: result,
    });
});


export const deleteColor = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const adminId = req.headers.id as string;
    const result = await ColorService.deleteColor(id, adminId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Color deleted success.",
        data: result,
    });
});

