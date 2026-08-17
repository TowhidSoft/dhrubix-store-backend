import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import httpStatus from "http-status";
import prisma from "../../config/db.prisma";


import { access_Key } from "../../config/config";

const Auth = (...roles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {

        const token = req.headers['token'] as string | undefined;
        const KEY = access_Key;

        if (!KEY) return res.status(httpStatus.NOT_FOUND).json({ status: false, message: "Access secret key not defined" });
        if (!token) return res.status(httpStatus.UNAUTHORIZED).json({ status: false, message: "Access token required" });

        jwt.verify(token, KEY, async (err: jwt.VerifyErrors | null, decoded: any) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(httpStatus.UNAUTHORIZED).json({ status: false, message: "Token expired" });
                }
                return res.status(httpStatus.UNAUTHORIZED).json({ status: false, message: "Unauthorized" });
            }

            const user = await prisma.user.findUnique({
                where: {
                    email: decoded.email,
                },
            });

            if (!user) {
                return res.status(httpStatus.NOT_FOUND).json({ status: false, message: "This user is not found !" });
            }

            if (roles.length && !roles.includes(decoded.role)) {
                return res.status(httpStatus.FORBIDDEN).json({ status: false, message: "Forbidden" });
            }

            req.headers.id = decoded.id;
            req.headers.email = decoded.email;
            req.headers.role = decoded.role;
            next();
        });
    };
}

export default Auth;
