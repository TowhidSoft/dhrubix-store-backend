import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status";
import { Request, Response } from "express";
import { SizeService } from "./size.service";

export const create = catchAsync(async (req: Request, res: Response) => {
    const parsedBody = req.body;

    const result = await SizeService.create(parsedBody);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        status: true,
        message: "New size added.",
        data: result,
    });
});

export const update = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const parsedbody = req.body;

    const result = await SizeService.update(id, { ...parsedbody });
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Size updated successfully!",
        data: result,
    });
});

export const getAll = catchAsync(async (req: Request, res: Response) => {
    const result = await SizeService.getAll();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Size List Found",
        data: result,
    });
});

export const getSize = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await SizeService.getSize(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Size Found",
        data: result,
    });
});


export const deleteSize = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const adminId = req.headers.id as string;
    const result = await SizeService.deleteSize(id, adminId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Size deleted success.",
        data: result,
    });
});

