// controllers/visitor.controller.ts
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import ApiError from "../../../errors/apiError";
import { VisitorService } from './visitor.service';

// Track a visitor (call this from frontend or middleware)
export const trackVisitor = catchAsync(async (req: Request, res: Response) => {
  const { sessionId } = req.body;
  const userId = req.headers.id as string;
  // Validate required fields
  if (!sessionId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Session ID is required');
  }

  const visitor = await VisitorService.trackVisitor({
    sessionId,
    userId
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    status: true,
    message: "Visitor tracked successfully",
    data: visitor,
  });
});

// Get total visitors by date range (default: current month)
export const getTotalVisitors = catchAsync(async (req: Request, res: Response) => {
  // Extract only what we need
  const params = {
    startDate: req.query.startDate as string | undefined,
    endDate: req.query.endDate as string | undefined
  };

  const result = await VisitorService.getTotalVisitors(params);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    status: true,
    message: "Total visitors retrieved successfully",
    data: result,
  });
});

export default {
  trackVisitor,
  getTotalVisitors
};