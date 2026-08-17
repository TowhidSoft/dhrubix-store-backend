import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { SocialService } from "./social.service";




export const updateSocial = catchAsync(async (req: Request, res: Response) => {

    const parsedBody = req.body;
    const result = await SocialService.updateSocial({ ...parsedBody });
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Socials updated successfully",
        data: result,
    });
});

export const getSocial = catchAsync(async (req: Request, res: Response) => {

    const result = await SocialService.getSocial();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "socials found.",
        data: result,
    });
});
