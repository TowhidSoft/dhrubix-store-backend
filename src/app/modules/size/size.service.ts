import prisma from "../../../config/db.prisma";
import ApiError from "../../../errors/apiError";
import httpStatus from "http-status";

const create = async (
    payload: {
        name: string;
    }
) => {
    const createSize = await prisma.size.create({
        data: {
            ...payload
        }
    })
    return createSize;
};

const update = async (
    id: string,
    payload: {
        name?: string;
    },
) => {
    // Check if user exists
    const sizeExist = await prisma.size.findUnique({
        where: { id }
    });
    if (!sizeExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "Size not found!");
    }

    const updateSize = await prisma.size.update({
        where: {
            id
        },
        data: payload,
        select: {
            id: true,
            name: true,
        }
    })
    return updateSize;
};

const getAll = async () => {
    const sizes = await prisma.size.findMany({
        select: {
            id: true,
            name: true,
        }
    });
    if (!sizes.length) {
        throw new ApiError(httpStatus.NOT_FOUND, "No size is available");
    }
    return { total: sizes.length, sizes };
};

const getSize = async (id: string) => {
    if (!id) throw new ApiError(httpStatus.BAD_REQUEST, "Size Id is required!")
    const size = await prisma.size.findUnique({
        where: {
            id
        },
        select: {
            id: true,
            name: true,
        }
    });
    if (!size) {
        throw new ApiError(httpStatus.NOT_FOUND, "No size found with this id");
    }
    return size;
};

const deleteSize = async (id: string, adminId: string) => {

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

    if (!id) throw new ApiError(httpStatus.BAD_REQUEST, "Size Id is required!")
    const sizeExist = await prisma.size.findUnique({
        where: { id },
        include: {
            products: true
        }
    });
    if (!sizeExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "No size found with this id");
    }
    if (sizeExist.products.length) {
        throw new ApiError(httpStatus.NOT_FOUND, "Cannot delete size with existing products.");
    }

    const removeSize = await prisma.size.delete({
        where: {
            id
        }
    })
    return removeSize;
};


export const SizeService = {
    create,
    getAll,
    update,
    getSize,
    deleteSize
};
