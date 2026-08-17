import { Prisma } from "@prisma/client";
import prisma from "../../../config/db.prisma";
import ApiError from "../../../errors/apiError";
import httpStatus from "http-status";
import { filenamesToUrls, filenameToUrl } from "../../../helpers/files/utils/file-url.utils";

const create = async (
    userId: string,
    payload: {
        rating: number;
        des?: string;
        orderId: string;
        productId: string;
    },
) => {
    const orderExist = await prisma.order.findUnique({
        where: { id: payload.orderId },
    });
    if (!orderExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "Order not found!");
    }

    const productExist = await prisma.product.findUnique({
        where: { id: payload.productId },
    });
    if (!productExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "Product not found or not available!");
    }
    const orderProductExist = await prisma.orderProduct.findFirst({
        where: {
            orderId: payload.orderId
        },
    });
    if (!orderProductExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "This product is not in your order!");
    }
    if (orderProductExist.isReviewed) {
        throw new ApiError(httpStatus.BAD_REQUEST, "You have already reviewed this product!");
    }


    const createReview = await prisma.review.create({
        data: {
            ...payload,
            userId
        }
    })

    await prisma.orderProduct.update({
        where: {
            id: orderProductExist.id
        },
        data: {
            isReviewed: true,
        }
    })
    return createReview;
};

const approveReview = async (
    id: string,
    adminId: string
) => {
    if (!adminId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "User ID is missing!");
    }

    // Check if user exists
    const userExist = await prisma.user.findUnique({
        where: { id: adminId },
    });
    if (!userExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
    }

    const reviewExist = await prisma.review.findUnique({
        where: { id },
    });
    if (!reviewExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "Review not found!");
    }
    if (reviewExist.isApproved) {
        throw new ApiError(httpStatus.OK, "Review already approved!");
    }

    const approve = await prisma.review.update({
        where: {
            id
        },
        data: {
            isApproved: true,
        }
    })
    return { approve };
};

const isReviewed = async (
    productId: string,
    userId: string
) => {
    const reviewExist = await prisma.review.findFirst({
        where: { productId, userId },
    });
    if (!reviewExist) {
        return { isReviewed: false };
    }

    return { isReviewed: true };
};

const getAllApproved = async (productId) => {
    const productReview = await prisma.review.findMany({
        where: {
            productId,
            isApproved: true
        },
        include: {
            user: {
                select: {
                    name: true,
                    photo: true,
                }
            }
        }
    });
    const productReviewWithPhotoUrl = productReview.map((review) => {
        return {
            ...review,
            user: {
                ...review.user,
                photo: review.user.photo ? filenameToUrl(review.user.photo) : null
            }
        }
    });
    if (!productReviewWithPhotoUrl.length) {
        throw new ApiError(httpStatus.NOT_FOUND, "No review is available for this product");
    }
    return { total: productReviewWithPhotoUrl.length, productReview: productReviewWithPhotoUrl };
};

const getAll = async (query) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const approved = query.isApproved;
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {};

    let isApproved: boolean | undefined;
    if (approved && approved !== undefined) {
        isApproved = approved === "true" ? true : false;
        where.isApproved = isApproved;
    }
    const productReview = await prisma.review.findMany({
        where,
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    images: true,
                }
            }
        },
        skip,
        take: limit,
    });
    if (!productReview.length) {
        throw new ApiError(httpStatus.NOT_FOUND, "No review is available right now");
    }
    const reviewWithProductImage = productReview.map((review) => {
        return {
            ...review,
            product: {
                ...review.product,
                images: filenamesToUrls(review.product.images)
            }

        }
    })
    return { total: productReview.length, productReview: reviewWithProductImage };
};

// const getReview = async (id: string) => {
//     if (!id) throw new ApiError(httpStatus.BAD_REQUEST, "Review Id is required!")
//     const review = await prisma.review.findUnique({
//         where: {
//             id
//         }
//     });
//     if (!review) {
//         throw new ApiError(httpStatus.NOT_FOUND, "No review found with this id");
//     }
//     return review;
// };

const deleteReview = async (id: string, adminId: string) => {

    if (!id) throw new ApiError(httpStatus.BAD_REQUEST, "Review Id is required!")
    const reviewExist = await prisma.review.findUnique({
        where: { id },
    });

    if (!reviewExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "No review found with this id");
    }


    const removeReview = await prisma.review.delete({
        where: {
            id
        }
    })
    return removeReview;
};




export const ReviewService = {
    create,
    getAllApproved,
    getAll,
    approveReview,
    isReviewed,
    // getReview,
    deleteReview
};
