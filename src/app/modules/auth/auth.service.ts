import { Request, response } from "express";
import prisma from "../../../config/db.prisma";
import ApiError from "../../../errors/apiError";
import httpStatus from "http-status";
import {
  comparePassword,
  hashPassword,
} from "../../../helpers/passwordCompare";
import { GenerateTokens } from "../../../helpers/utility/tokenHelper";
import { otpVerificationTemplate } from "./auth.template";
import SendEmailUtility from "../../../helpers/utility/sendEmailUtility";
import { Gender, Role } from "@prisma/client";
import { contactFormTemplate } from "./contactFormTemplate";
import { emailToAdmin } from "../../../config/config";
// import { verifyEmailSMTP } from "../../middleware/verifyEmailSMTP";

const register = async (
  payload: {
    name: string,
    email: string,
    password: string,
    dob: string,
    gender: Gender,
    role?: Role | "CUSTOMER",
  }
) => {
  const isUserExists = await prisma.user.findUnique({
    where: {
      email: payload.email
    }
  });
  if (isUserExists)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Someone already exists with this email. Try another email."
    );

  if (payload.password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }
  // Hash password
  const hashedPassword = await hashPassword(payload.password);

  let user;
  // Create user + OTP record
  await prisma.$transaction(async (tx) => {
    user = await tx.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
        dob: payload.dob,
        ...(payload.role && { role: payload.role })
      },
    });

    if (payload.role === Role.ADMIN) {
      await tx.profile.create({
        data: {
          userId: user.id,
          fullName: user.name,
          gender: payload.gender
        }
      })
    }

    if (!payload.role || payload.role === Role.CUSTOMER) {
      await tx.profile.create({
        data: {
          userId: user.id,
          fullName: user.name,
          gender: payload.gender
        }
      })
    }
  });
  const { accessToken, refreshToken } = GenerateTokens(
    user.id,
    user.email,
    user.role
  );

  return { accessToken, refreshToken };
};


const login = async (payload: {
  email: string;
  password: string;
}) => {
  // 1️⃣ Find user
  const userData = await prisma.user.findUnique({
    where: { email: payload.email },
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      isEmailVerified: true,
      role: true,
    },
  });

  if (!userData) throw new ApiError(400, "User not found");

  if (!payload.password) throw new Error("Password is required");

  const isCorrectPassword = await comparePassword(
    payload.password,
    userData.password
  );
  if (!isCorrectPassword) throw new ApiError(400, "Incorrect credentials!");


  const { accessToken, refreshToken } = GenerateTokens(
    userData.id,
    userData.email,
    userData.role
  );

  return { ...userData, accessToken, refreshToken };
};

const contactFormSubmit = async (payload: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}) => {

  const emailTo = emailToAdmin as string;
  const mailSubject = "Ops.Wine Contact form via customer";
  const contactEmailHTML = contactFormTemplate(payload.name, payload.email, payload.message);

  const mailSent = await SendEmailUtility(
    emailTo,
    mailSubject,
    contactEmailHTML
  );
  if (mailSent.accepted.length > 0) {
    return mailSent.accepted;
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, "Failed to send contact form. Please try again.");
  }
}

const recoverVerifyEmail = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(404, "No user found with this email");

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  const expiry = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.otp.upsert({
    where: { email },
    update: { code: otpCode, expiresAt: expiry, verified: false },
    create: { email, code: otpCode, expiresAt: expiry },
  });

  const EmailTo = email;
  const EmailSubject = "Your password reset code";
  const HtmlContent = `<p>Your OTP code is <b>${otpCode}</b>. It will expire in 2 minutes.</p>`;
  await SendEmailUtility(EmailTo, EmailSubject, HtmlContent);

  return { email, expiresAt: expiry };
};

const recoverVerifyOTP = async (email: string, otp: string) => {
  const otpRecord = await prisma.otp.findUnique({ where: { email } });
  if (!otpRecord) throw new ApiError(400, "OTP not found. Please request again.");

  if (otpRecord.verified) throw new ApiError(400, "OTP already used");

  if (otpRecord.code !== otp) throw new ApiError(400, "Invalid OTP");

  if (new Date() > otpRecord.expiresAt) throw new ApiError(400, "OTP expired. Please resend.");

  const verifyOtp = await prisma.otp.update({
    where: { email },
    data: { verified: true },
    select: {
      email: true,
      verified: true
    }
  });

  return verifyOtp;
};

const recoverResetPass = async (email: string, newPassword: string) => {
  const otpRecord = await prisma.otp.findUnique({ where: { email } });
  if (!otpRecord || !otpRecord.verified)
    throw new ApiError(400, "OTP not verified. Please verify first.");
  if (newPassword.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }
  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  await prisma.otp.delete({ where: { email } });

  return { email, reset: true };
};

const resendOtp = async (req: Request) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email is required");
  }

  // 1️⃣ Check user existence
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // 2️⃣ Generate new OTP
  const OTPCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

  // 3️⃣ Save or update OTP record
  await prisma.otp.upsert({
    where: { email },
    update: { code: OTPCode, expiresAt, verified: false },
    create: { email, code: OTPCode, expiresAt },
  });

  // 4️⃣ Send email
  const emailTo = email;
  const mailSubject = "Dot Learning App - New Verification Code";
  const EmailHTMLTemplate = otpVerificationTemplate(OTPCode);

  const sendEmail = await SendEmailUtility(emailTo, mailSubject, EmailHTMLTemplate);

  if (!sendEmail.accepted?.length) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Failed to send OTP. Please try again."
    );
  }

  // 5️⃣ Return response
  return { email, otpSent: true };
};


export const AuthServices = {
  register,
  login,
  // verifyEmail,
  contactFormSubmit,
  recoverVerifyEmail,
  recoverVerifyOTP,
  recoverResetPass,
  resendOtp,
};
