
import sendResponse from "../../shared/sendResponse";
import catchAsync from "../../shared/catchAsync";
import { AuthServices } from "./auth.service";
import httpStatus from "http-status";
import { Request, Response } from "express";


export const register = catchAsync(async (req: Request, res: Response) => {
	const result = await AuthServices.register(req.body);
	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		status: true,
		message: "Signed Up Successfully.",
		data: result,
	});
});

// export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
// 	const result = await AuthServices.verifyEmail(req);
// 	sendResponse(res, {
// 		statusCode: httpStatus.OK,
// 		status: true,
// 		message: "Email verified successfully",
// 		data: result,
// 	});
// });

export const login = catchAsync(async (req: Request, res: Response) => {
	const result = await AuthServices.login(req.body);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		status: true,
		message: "Login successful",
		data: result,
	});
});

export const contactFormSubmit = catchAsync(async (req: Request, res: Response) => {
	const result = await AuthServices.contactFormSubmit(req.body);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		status: true,
		message: "Form submitted successfully",
		data: result,
	});
});

export const recoverVerifyEmail = catchAsync(async (req: Request, res: Response) => {
	const { email } = req.body;
	const result = await AuthServices.recoverVerifyEmail(email);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		status: true,
		message: "OTP sent to your email",
		data: result,
	});
});

export const recoverVerifyOTP = catchAsync(async (req: Request, res: Response) => {
	const { email, otp } = req.body;
	const result = await AuthServices.recoverVerifyOTP(email, otp);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		status: true,
		message: "OTP verified successfully",
		data: result,
	});
});

export const recoverResetPass = catchAsync(async (req: Request, res: Response) => {
	const { email, newPassword } = req.body;
	const result = await AuthServices.recoverResetPass(email, newPassword);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		status: true,
		message: "Password reset successfully",
		data: result,
	});
});

export const resendOtp = catchAsync(async (req: Request, res: Response) => {
	const result = await AuthServices.resendOtp(req);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		status: true,
		message: "A new OTP has been sent to your email.",
		data: result,
	});
});
