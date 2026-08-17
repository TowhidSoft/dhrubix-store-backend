import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { HeroService } from "./hero.service";
import { filenameToUrl } from "../../../../helpers/files/utils/file-url.utils";




export const updateHero = catchAsync(async (req: Request, res: Response) => {

    const parsedBody = JSON.parse(req.body.data);
    let imageFile;
    if (req.file) {
        imageFile = req.file.filename as string;
    }

    const result = await HeroService.updateHero({ ...parsedBody, image: filenameToUrl(imageFile) });
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Hero updated successfully",
        data: result,
    });
});

export const getHero = catchAsync(async (req: Request, res: Response) => {

    const result = await HeroService.getHero();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Hero details fetched successfully",
        data: result,
    });
});

export const deleteHero = catchAsync(async (req: Request, res: Response) => {

    const result = await HeroService.deleteHero();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Hero deleted successfully",
        data: result,
    });
});