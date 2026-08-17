import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status";
import { Request, Response } from "express";
import { DashboardService } from "./dashboard.service";
import { RangeType } from "./utils/dateRange";



export const DashboardStats = catchAsync(async (req: Request, res: Response) => {
    const { month, year } = req.query as { month?: string; year?: string };

    const result = await DashboardService.DashboardStats({ month, year });
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Dashboard statistics retrieved successfully",
        data: result,
    });
});


export const RecentActivity = catchAsync(async (req: Request, res: Response) => {
    const adminId = req.headers.id as string;
    const result = await DashboardService.RecentActivity(adminId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Recent activity retrieved successfully",
        data: result,
    });
});


export const OrdersChart = catchAsync(async (req: Request, res: Response) => {
    const type = (req.query.type || "daily") as RangeType;
    const result = await DashboardService.OrdersChart(type);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Orders chart retrieved successfully",
        data: result,
    });
});

export const RecentOrders = catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardService.RecentOrders();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: "Recent orders retrieved successfully",
        data: result,
    });
});
