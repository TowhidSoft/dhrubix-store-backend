import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status";
import { Request, Response } from "express";
import { WishListService } from "./wishList.service";

export const create = catchAsync(async (req: Request, res: Response) => {
    const userId = req.headers.id as string;
    const { productId } = req.body;
    console.log(productId)
    const result = await WishListService.create(userId, productId);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        status: true,
        message: "New wish list added!",
        data: result,
    });
});

export const getAll = catchAsync(async (req: Request, res: Response) => {
    const userId = req.headers.id as string;

    const result = await WishListService.getAll(userId, req);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Wish list found",
        meta: result.pagination,
        data: result.data,
    });
});



export const get = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.headers.id as string;
    const result = await WishListService.get(id, userId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Wish Found",
        data: result,
    });
});


export const remove = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.headers.id as string;
    const result = await WishListService.remove(id, userId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Wish List deleted success.",
        data: result,
    });
});