// controller/AuthController.ts
import { Request, Response } from "express";
import { GenerateTokens, VerifyRefreshToken } from "./tokenHelper";
import ApiError from "../../errors/apiError";
import httpStatus from "http-status";
import catchAsync from "../../app/shared/catchAsync";
import sendResponse from "../../app/shared/sendResponse";

export const refreshAccessToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Refresh token required");
  }

  const decoded = await VerifyRefreshToken(refreshToken);

  if (!decoded) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired refresh token");
  }

  const { accessToken, refreshToken: newRefreshToken } = GenerateTokens(
    decoded.id,
    decoded.email,
    decoded.role
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    status: true,
    message: "Token refreshed successfully",
    data: { accessToken, refreshToken: newRefreshToken },
  });
});
