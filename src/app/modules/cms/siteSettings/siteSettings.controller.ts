import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { SiteSettingsService } from "./siteSettings.service";

export const updateSiteSettings = catchAsync(async (req: Request, res: Response) => {
    const parsedBody = req.body;

    const logoFile = req.files && (req.files as any)["logo"]?.[0];
    const faviconFile = req.files && (req.files as any)["favicon"]?.[0];

    const result = await SiteSettingsService.updateSiteSettings({
        ...parsedBody,
        ...(logoFile && { logo: logoFile.filename }),
        ...(faviconFile && { favicon: faviconFile.filename }),
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Site settings updated successfully",
        data: result,
    });
});

export const getSiteSettings = catchAsync(async (req: Request, res: Response) => {
    const result = await SiteSettingsService.getSiteSettings();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Site settings fetched successfully",
        data: result,
    });
});
