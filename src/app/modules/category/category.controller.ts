import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status";
import { Request, Response } from "express";
import { CategoryService } from "./category.service";

export const create = catchAsync(async (req: Request, res: Response) => {
    const adminId = req.body.userId || req.headers.id;
    const parsedBody = req.body;
    let img;
    if (req.file) {
        img = req.file.filename as string;
    }
    const result = await CategoryService.create(adminId, { ...parsedBody, img });
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        status: true,
        message: "New category added in the list",
        data: result,
    });
});

export const updateCategory = catchAsync(async (req: Request, res: Response) => {
    const adminId = req.headers.id as string;
    const id = req.params.id as string;
    const parsedbody = req.body
    let img;
    if (req.file) {
        img = req.file.filename as string;
    }
    const result = await CategoryService.updateCategory(id, adminId, { ...parsedbody, img });
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Category updated successfully!",
        data: result,
    });
});

export const getAll = catchAsync(async (req: Request, res: Response) => {
    const result = await CategoryService.getAll();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Category List Found",
        data: result,
    });
});

export const getCategory = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await CategoryService.getCategory(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Category Found",
        data: result,
    });
});


export const deleteCategory = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const adminId = req.headers.id as string;
    const result = await CategoryService.deleteCategory(id, adminId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Category deleted success.",
        data: result,
    });
});

