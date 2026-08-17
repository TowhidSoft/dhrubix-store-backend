import { NextFunction, Request, Response } from "express";

export const parseBodyData = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    // Find the 'data' key even if there are accidental spaces from Postman
    const dataKey = Object.keys(req.body).find(key => key.trim() === 'data');

    if (dataKey) {
        try {
            const data = JSON.parse(req.body[dataKey]);
            Object.assign(req.body, data);
            delete req.body[dataKey];
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: "Invalid JSON format in data",
            });
        }
    } else {
        // If data key is completely missing, log it to help debugging
        console.warn("parseBodyData: 'data' key was not found in req.body. Keys received:", Object.keys(req.body));
    }
    next();
};
