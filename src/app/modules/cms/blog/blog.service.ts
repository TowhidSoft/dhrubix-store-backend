
import httpStatus from "http-status";
import prisma from "../../../../config/db.prisma";
import { deleteFiles } from "../../../../helpers/files/fileDelete";
import { urlsToFilenames } from "../../../../helpers/files/utils/file-url.utils";
import ApiError from "../../../../errors/apiError";


const create = async (
    adminId: string,
    payload: {
        title: string;
        subTitle?: string;
        des: string;
        images: string | any;
        active?: boolean
    },
) => {
    if (!adminId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Admin ID is missing!");
    }
    const adminExist = await prisma.user.findUnique({
        where: { id: adminId },
    });
    if (!adminExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "Admin not found!");
    }
    const blog = await prisma.blog.create({
        data: {
            title: payload.title,
            subTitle: payload.subTitle,
            des: payload.des,
            images: payload.images,
            active: payload.active ?? true,
            adminId
        },
    });
    return blog;
};


const update = async (
    id: string,
    adminId: string,
    payload: {
        title: string;
        subTitle?: string;
        des: string;
        images: string | any;
        active?: boolean;
        removeImages?: string[];
    },
) => {
    if (!adminId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Admin ID is missing!");
    }

    const adminExist = await prisma.user.findUnique({
        where: { id: adminId },
    });

    if (!adminExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "Admin not found!");
    }

    const blogExist = await prisma.blog.findUnique({
        where: { id },
    });

    if (!blogExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "Blog not found!");
    }

    const updateData: any = { ...payload };

    if (payload.removeImages && Array.isArray(payload.removeImages) && payload.removeImages.length > 0) {
        try {
            await deleteFiles(urlsToFilenames(payload.removeImages));

            if (blogExist.images && blogExist.images.length > 0) {
                updateData.images = blogExist.images.filter(
                    image => !payload.removeImages?.includes(image)
                );
            }
        } catch (error) {
            console.error("Error deleting files:", error);
        }
        delete updateData.removeImages;
    }

    if (payload.images) {
        if (Array.isArray(payload.images)) {
            const existingImages = blogExist.images || [];
            updateData.images = [...existingImages, ...payload.images];
        } else {
            updateData.images = Array.isArray(blogExist.images)
                ? [...blogExist.images, payload.images]
                : [payload.images];
        }
    }

    const blog = await prisma.blog.update({
        where: { id },
        data: updateData,
    });

    return blog;
};

const updateViewCount = async (
    id: string,
) => {

    const blogExist = await prisma.blog.findUnique({
        where: { id },
    });

    if (!blogExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "Blog not found!");
    }

    const blog = await prisma.blog.update({
        where: { id },
        data: {
            views: blogExist.views + 1
        },
        select: {
            views: true
        }
    });

    return blog;
};



interface GetAllOptions {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
    search?: string;
}

const getAll = async (req) => {
    const queryLoad: GetAllOptions = req.query;

    // Parse with defaults
    const page = parseInt(queryLoad.page || "1");
    const limit = parseInt(queryLoad.limit || "10");

    // Set defaults for sorting
    const sortBy = queryLoad.sortBy || 'createdAt';
    const sortOrder = queryLoad.sortOrder || 'desc';
    const search = queryLoad.search;

    console.log('Query params:', req.query);

    // Handle boolean conversions
    const skip = (page - 1) * limit;

    // Build where clause dynamically
    const where: any = { active: true };

    // Search functionality
    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { subTitle: { contains: search, mode: 'insensitive' } },
            { des: { contains: search, mode: 'insensitive' } }
        ];
    }

    console.log('Where clause:', JSON.stringify(where, null, 2));

    // Get total count with filters
    const total = await prisma.blog.count({ where });

    if (total === 0) {
        throw new ApiError(httpStatus.NOT_FOUND, "No blogs found matching your criteria");
    }

    // Get paginated products
    const blogs = await prisma.blog.findMany({
        where,
        select: {
            id: true,
            title: true,
            subTitle: true,
            des: true,
            images: true,
            views: true,
            createdAt: true,
            updatedAt: true,
            admin: {
                select: {
                    id: true,
                    name: true,
                    photo: true
                }
            },
        },
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder
        }
    });

    const totalPages = Math.ceil(total / limit);

    return {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        blogs
    };
};

const getAllByAdmin = async (req) => {
    const queryLoad: GetAllOptions = req.query;

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
            { name: { contains: search, mode: 'insensitive' } },
            { des: { contains: search, mode: 'insensitive' } },
            { shortDes: { contains: search, mode: 'insensitive' } }
        ];
    }

    console.log('Where clause:', JSON.stringify(where, null, 2));

    // Get total count with filters
    const total = await prisma.blog.count({ where });

    if (total === 0) {
        throw new ApiError(httpStatus.NOT_FOUND, "No blogs found matching your criteria");
    }

    // Get paginated products
    const blogs = await prisma.blog.findMany({
        where,
        select: {
            id: true,
            title: true,
            subTitle: true,
            des: true,
            images: true,
            views: true,
            active: true,
            createdAt: true,
            updatedAt: true,
            admin: {
                select: {
                    id: true,
                    name: true,
                    photo: true
                }
            },
        },
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder
        }
    });


    const totalPages = Math.ceil(total / limit);

    return {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        blogs
    };
};

const get = async (id: string) => {
    if (!id) throw new ApiError(httpStatus.BAD_REQUEST, "Blog Id is required!")
    const blog = await prisma.blog.findUnique({
        where: {
            id
        },
        select: {
            id: true,
            title: true,
            subTitle: true,
            des: true,
            images: true,
            active: true,
            views: true,
            admin: {
                select: {
                    id: true,
                    name: true,
                    photo: true,
                }
            }
        }
    });
    if (!blog) {
        throw new ApiError(httpStatus.NOT_FOUND, "No blog found with this id");
    }
    return blog;
};

const remove = async (id: string, adminId: string) => {

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

    if (!id) throw new ApiError(httpStatus.BAD_REQUEST, "Blog Id is required!")
    const blogExist = await prisma.blog.findUnique({
        where: { id }
    });
    if (!blogExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "No blog found with this id");
    }

    const result = await prisma.$transaction(async (tx) => {

        await deleteFiles(urlsToFilenames(blogExist.images));

        const deletedProduct = await tx.blog.delete({
            where: {
                id
            }
        });

        return deletedProduct;
    });

    return result;
};


export const BlogService = {
    create,
    update,
    updateViewCount,
    getAll,
    getAllByAdmin,
    get,
    remove
};
