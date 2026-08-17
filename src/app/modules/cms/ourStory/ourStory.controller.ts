import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { OurStoryService } from "./ourStory.service";
import { filenameToUrl } from "../../../../helpers/files/utils/file-url.utils";




export const updateStory = catchAsync(async (req: Request, res: Response) => {

    const parsedBody = JSON.parse(req.body.data);
    let imageFile;
    if (req.file) {
        imageFile = req.file.filename as string;
    }

    const result = await OurStoryService.updateStory({ ...parsedBody, image: filenameToUrl(imageFile) });
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Our story updated successfully",
        data: result,
    });
});

export const getStory = catchAsync(async (req: Request, res: Response) => {

    const result = await OurStoryService.getStory();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Our story details fetched successfully",
        data: result,
    });
});

export const deleteStory = catchAsync(async (req: Request, res: Response) => {

    const result = await OurStoryService.deleteStory();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Our story deleted successfully",
        data: result,
    });
});