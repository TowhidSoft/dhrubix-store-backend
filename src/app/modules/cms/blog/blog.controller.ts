import httpStatus from "http-status";
import { Request, Response } from "express";
import { BlogService } from "./blog.service";
import sendResponse from "../../../shared/sendResponse";
import catchAsync from "../../../shared/catchAsync";
import { filenamesToUrls } from "../../../../helpers/files/utils/file-url.utils";

export const create = catchAsync(async (req: Request, res: Response) => {
    const adminId = req.headers.id as string;
    const parsedBody = JSON.parse(req.body.data);

    const imageFiles = req.files && (req.files as any)["images"];
    const images = imageFiles ? imageFiles.map((file: any) => file.filename) : [];

    const result = await BlogService.create(adminId, { ...parsedBody, images: filenamesToUrls(images) });
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        status: true,
        message: "New blog added!",
        data: result,
    });
});

export const update = catchAsync(async (req: Request, res: Response) => {
    const adminId = req.headers.id as string;
    const id = req.params.id as string;
    const parsedBody = JSON.parse(req.body.data);

    const imageFiles = req.files && (req.files as any)["images"];
    const images = imageFiles ? imageFiles.map((file: any) => file.filename) : [];

    const result = await BlogService.update(id, adminId, { ...parsedBody, images: filenamesToUrls(images) });
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Blog updated successfully!",
        data: result,
    });
});

export const updateViewCount = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await BlogService.updateViewCount(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Blog view count successfully!",
        data: result,
    });
});

export const getAll = catchAsync(async (req: Request, res: Response) => {
    const result = await BlogService.getAll(req);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Blog List Found",
        data: result,
    });
});

export const getAllByAdmin = catchAsync(async (req: Request, res: Response) => {
    const result = await BlogService.getAllByAdmin(req);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Blog List Found for admin",
        data: result,
    });
});

export const get = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await BlogService.get(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Blog Found",
        data: result,
    });
});


export const remove = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const adminId = req.headers.id as string;
    const result = await BlogService.remove(id, adminId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Blog deleted success.",
        data: result,
    });
});

