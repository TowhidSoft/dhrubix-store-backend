import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status";
import { Request, Response } from "express";
import { BrandService } from "./brand.service";

export const create = catchAsync(async (req: Request, res: Response) => {
    const adminId = req.body.userId || req.headers.id;
    const parsedBody = req.body;
    let img;
    if (req.file) {
        img = req.file.filename as string;
    }
    const result = await BrandService.create(adminId, { ...parsedBody, img });
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        status: true,
        message: "New brand added in the list",
        data: result,
    });
});

export const updateBrand = catchAsync(async (req: Request, res: Response) => {
    const adminId = req.headers.id as string;
    const id = req.params.id as string;
    const parsedbody = req.body
    let img;
    if (req.file) {
        img = req.file.filename as string;
    }
    const result = await BrandService.updateBrand(id, adminId, { ...parsedbody, img });
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Brand updated successfully!",
        data: result,
    });
});

export const getAll = catchAsync(async (req: Request, res: Response) => {
    const result = await BrandService.getAll();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Brand List Found",
        data: result,
    });
});

export const getbrand = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await BrandService.getbrand(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Brand Found",
        data: result,
    });
});


export const deleteBrand = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const adminId = req.headers.id as string;
    const result = await BrandService.deleteBrand(id, adminId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Brand deleted success.",
        data: result,
    });
});

