import prisma from "../../../config/db.prisma";
import ApiError from "../../../errors/apiError";
import httpStatus from "http-status";
import SendEmailUtility from "../../../helpers/utility/sendEmailUtility";
import { emailToAdmin } from "../../../config/config";

const create = async (
    email: string,
) => {
    const emailTo = emailToAdmin;
    const EmailSubject = "New Subscriber";
    const HtmlContent = `<p>A new subscriber has been added with email: ${email}</p>`;

    const existingSubscriber = await prisma.subscriber.findUnique({
        where: { email }
    });
    if (existingSubscriber) {
        throw new ApiError(httpStatus.BAD_REQUEST, "This email is already subscribed!");
    }
    const createSubscriber = await prisma.subscriber.create({
        data: { email }
    })
    await SendEmailUtility(emailTo, EmailSubject, HtmlContent);

    return createSubscriber;
};

const All = async (req) => {
    const queryLoad: any = req.query;

    // Parse with defaults
    const page = parseInt(queryLoad.page || "1");
    const limit = parseInt(queryLoad.limit || "10");

    // Set defaults for sorting
    const sortBy = queryLoad.sortBy || 'createdAt';
    const sortOrder = queryLoad.sortOrder || 'desc';
    const search = queryLoad.search;

    console.log('Query params:', req.query);


    const skip = (page - 1) * limit;

    // Build where clause dynamically
    const where: any = {};

    // Search functionality
    if (search) {
        where.OR = [
            { email: { contains: search, mode: 'insensitive' } },
        ];
    }

    // Get total count with filters
    const total = await prisma.subscriber.count({ where });

    if (total === 0) {
        throw new ApiError(httpStatus.NOT_FOUND, "No subscribers found matching your criteria");
    }

    // Get paginated products
    const subscriber = await prisma.subscriber.findMany({
        where,
        select: {
            id: true,
            email: true,
            createdAt: true,
        },
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder
        }
    });

    return {
        pagination: {
            total,
            page,
            limit,
        },
        data: subscriber
    };
};

export const SubscriberService = {
    create,
    All
};
