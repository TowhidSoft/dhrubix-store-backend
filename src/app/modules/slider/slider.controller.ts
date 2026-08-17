import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status";
import { SliderService } from "./slider.service";
import { filenameToUrl } from "../../../helpers/files/utils/file-url.utils";

export const create = catchAsync(async (req: Request, res: Response) => {
    const adminId = req.headers.id as string;
    const parsedBody = JSON.parse(req.body.data);

    let imageFile: string | undefined;
    if (req.file) {
        imageFile = filenameToUrl(req.file.filename);
    }

    const result = await SliderService.create(adminId, { ...parsedBody, image: imageFile });
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        status: true,
        message: "Slider created successfully!",
        data: result,
    });
});

export const update = catchAsync(async (req: Request, res: Response) => {
    const adminId = req.headers.id as string;
    const { id } = req.params;
    const parsedBody = JSON.parse(req.body.data);

    let imageFile: string | undefined;
    if (req.file) {
        imageFile = filenameToUrl(req.file.filename);
    }

    const result = await SliderService.update(id, adminId, { ...parsedBody, image: imageFile });
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Slider updated successfully!",
        data: result,
    });
});

export const getAll = catchAsync(async (req: Request, res: Response) => {
    const result = await SliderService.getAll();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Slider list found",
        data: result,
    });
});

export const getAllByAdmin = catchAsync(async (req: Request, res: Response) => {
    const result = await SliderService.getAllByAdmin();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Slider list found for admin",
        data: result,
    });
});

export const get = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await SliderService.get(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Slider found",
        data: result,
    });
});

export const remove = catchAsync(async (req: Request, res: Response) => {
    const adminId = req.headers.id as string;
    const { id } = req.params;
    const result = await SliderService.remove(id, adminId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Slider deleted successfully",
        data: result,
    });
});
