import { Response } from "express"

const sendResponse = <T>(res: Response, jsonData: {
    statusCode: number,
    status: boolean,
    message: string,
    meta?: {
        page: number,
        limit: number,
        total: number
    },
    data: T | null | undefined
}) => {
    res.status(jsonData.statusCode).json({
        status: jsonData.status,
        message: jsonData.message,
        meta: jsonData.meta || null || undefined,
        data: jsonData.data || null || undefined
    })
}

export default sendResponse;