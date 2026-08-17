import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status";
import { Request, Response } from "express";
import { CartService } from "./cart.service";

export const create = catchAsync(async (req: Request, res: Response) => {
    const userId = req.headers.id as string;
    const result = await CartService.create(userId, req.body);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        status: true,
        message: "New product added to cart!",
        data: result,
    });
});

export const update = catchAsync(async (req: Request, res: Response) => {
    const userId = req.headers.id as string;
    const result = await CartService.update(userId, req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Cart updated!",
        data: result,
    });
});

export const getAll = catchAsync(async (req: Request, res: Response) => {
    const userId = req.headers.id as string;

    const result = await CartService.getAll(userId, req);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Cart list found",
        meta: result.pagination,
        data: result.data,
    });
});



export const get = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.headers.id as string;
    const result = await CartService.get(id, userId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Cart Found",
        data: result,
    });
});


export const remove = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.headers.id as string;
    const result = await CartService.remove(id, userId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Cart deleted..",
        data: result,
    });
});