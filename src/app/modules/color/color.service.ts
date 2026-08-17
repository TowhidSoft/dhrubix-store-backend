import prisma from "../../../config/db.prisma";
import ApiError from "../../../errors/apiError";
import httpStatus from "http-status";

const create = async (
    adminId: string,
    payload: {
        name: string;
    }
) => {
    if (!adminId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Admin ID is missing!");
    }
    const adminExist = await prisma.user.findUnique({
        where: { id: adminId },
        include: { profile: true },
    });
    if (!adminExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "Admin not found!");
    }
    const createColor = await prisma.color.create({
        data: {
            ...payload
        }
    })
    return createColor;
};

const update = async (
    id: string,
    adminId: string,
    payload: {
        name?: string;
    },
) => {
    if (!adminId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "User ID is missing!");
    }

    // Check if user exists
    const userExist = await prisma.user.findUnique({
        where: { id: adminId },
        include: { profile: true },
    });
    if (!userExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
    }

    // Check if user exists
    const colorExist = await prisma.color.findUnique({
        where: { id }
    });
    if (!colorExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "color not found!");
    }

    const updateColor = await prisma.color.update({
        where: {
            id
        },
        data: payload,
        select: {
            id: true,
            name: true,
        }
    })
    return updateColor;
};

const getAll = async () => {
    const colors = await prisma.color.findMany({
        select: {
            id: true,
            name: true,

        }
    });
    if (!colors.length) {
        throw new ApiError(httpStatus.NOT_FOUND, "No color is available");
    }
    return { total: colors.length, colors };
};

const getColor = async (id: string) => {
    if (!id) throw new ApiError(httpStatus.BAD_REQUEST, "Color Id is required!")
    const color = await prisma.color.findUnique({
        where: {
            id
        }
    });
    if (!color) {
        throw new ApiError(httpStatus.NOT_FOUND, "No color found with this id");
    }
    return color;
};

const deleteColor = async (id: string, adminId: string) => {

    if (!adminId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Admin ID is missing!");
    }
    const adminExist = await prisma.user.findUnique({
        where: { id: adminId },
        include: { profile: true },
    });
    if (!adminExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "Admin not found!");
    }

    const colorExist = await prisma.color.findUnique({
        where: { id },
        include: {
            products: true
        }
    });
    if (!colorExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "No color found with this id");
    }
    if (colorExist.products.length) {
        throw new ApiError(httpStatus.NOT_FOUND, "Cannot delete color with existing products.");
    }

    const removeColor = await prisma.color.delete({
        where: {
            id
        }
    })
    return removeColor;
};


export const ColorService = {
    create,
    getAll,
    update,
    getColor,
    deleteColor
};
