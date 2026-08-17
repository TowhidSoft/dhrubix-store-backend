import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { Request, Response } from "express";
import { SubCategoryService } from "./subcategory.service";
import { filenameToUrl } from "../../../../helpers/files/utils/file-url.utils";

export const create = catchAsync(async (req: Request, res: Response) => {
    const parsedBody = req.body;
    let img;
    if (req.file) {
        img = req.file.filename as string;
    }
    const result = await SubCategoryService.create({ ...parsedBody, img: filenameToUrl(img) });
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        status: true,
        message: "New subcategory added in the list",
        data: result,
    });
});

export const updateSubCategory = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const parsedbody = req.body;
    let img;
    if (req.file) {
        img = req.file.filename as string;
    }
    const result = await SubCategoryService.updateSubCategory(id, { ...parsedbody, img: filenameToUrl(img) });
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "SubCategory updated successfully!",
        data: result,
    });
});

export const getAll = catchAsync(async (req: Request, res: Response) => {
    const result = await SubCategoryService.getAll();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "SubCategory List Found",
        data: result,
    });
});

export const getAllByCategory = catchAsync(async (req: Request, res: Response) => {
    const { categoryId } = req.params;
    const result = await SubCategoryService.getAllByCategory(categoryId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Category Wise SubCategory List Found",
        data: result,
    });
});

export const getSubCategory = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await SubCategoryService.getSubCategory(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "SubCategory Found",
        data: result,
    });
});


export const deleteSubCategory = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const adminId = req.headers.id as string;
    const result = await SubCategoryService.deleteSubCategory(id, adminId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "SubCategory deleted success.",
        data: result,
    });
});

