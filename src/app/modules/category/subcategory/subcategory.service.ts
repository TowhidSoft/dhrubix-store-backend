import prisma from "../../../../config/db.prisma";
import ApiError from "../../../../errors/apiError";
import httpStatus from "http-status";

import { deleteFiles } from "../../../../helpers/files/fileDelete";
import { filenameToUrl, urlToFilename } from "../../../../helpers/files/utils/file-url.utils";

const create = async (
    payload: {
        categoryId: string;
        name: string;
        des?: string;
        img?: string | any
    },
) => {
    const categoryExist = await prisma.category.findUnique({
        where: {
            id: payload.categoryId
        }
    })
    if (!categoryExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "Category not found")
    }
    const existSubcategory = await prisma.subcategory.findFirst({
        where: { name: payload.name }
    })
    if (existSubcategory) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Subcategory already exist")
    }
    const createSubCategory = await prisma.subcategory.create({
        data: payload
    })
    const createSubCategoryWithPhotoUrl = { ...createSubCategory, img: filenameToUrl(createSubCategory.img) }
    return createSubCategoryWithPhotoUrl;
};

const updateSubCategory = async (
    id: string,
    payload: {
        name?: string;
        des?: string;
        img?: string | any
    },
) => {

    // Check if user exists
    const subCategoryExist = await prisma.subcategory.findUnique({
        where: { id }
    });
    if (!subCategoryExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "SubCategory not found!");
    }
    const existSubcategory = await prisma.subcategory.findFirst({
        where: { name: payload.name }
    })
    if (existSubcategory && existSubcategory.name !== payload.name) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Subcategory with this name already exist")
    }

    // Handle image upload
    if (payload.img && subCategoryExist.img) {
        deleteFiles([urlToFilename(subCategoryExist.img)])
    }

    const update = await prisma.subcategory.update({
        where: {
            id
        },
        data: payload
    })
    const updateSubCategoryWithPhotoUrl = { ...update, img: filenameToUrl(update.img) }
    return { update: updateSubCategoryWithPhotoUrl };
};

const getAll = async () => {
    const subCategory = await prisma.subcategory.findMany({
        select: {
            id: true,
            name: true,
            des: true,
            img: true,
            category: true
        }
    });
    if (!subCategory.length) {
        throw new ApiError(httpStatus.NOT_FOUND, "No subcategory found");
    }
    const subCategoryWithPhotoUrl = subCategory.map((subCat) => ({
        ...subCat,
        img: filenameToUrl(subCat.img),
    }))
    return { total: subCategoryWithPhotoUrl.length, subCategory: subCategoryWithPhotoUrl };
};

const getAllByCategory = async (categoryId: string) => {

    const category = await prisma.category.findUnique({
        where: {
            id: categoryId
        }
    })
    if (!category) {
        throw new ApiError(httpStatus.NOT_FOUND, "Category not found")
    }

    const subCategory = await prisma.subcategory.findMany({
        where: {
            categoryId
        },
        select: {
            id: true,
            name: true,
            img: true,
        }
    });
    if (!subCategory.length) {
        throw new ApiError(httpStatus.NOT_FOUND, "No subcategory found for this category");
    }
    const subCategoryWithPhotoUrl = subCategory.map((subCat) => ({
        ...subCat,
        img: filenameToUrl(subCat.img),
    }))
    return { total: subCategoryWithPhotoUrl.length, subCategory: subCategoryWithPhotoUrl };
};

const getSubCategory = async (id: string) => {
    if (!id) throw new ApiError(httpStatus.BAD_REQUEST, "Subcategory Id is required!")
    const subCategory = await prisma.subcategory.findUnique({
        where: {
            id
        },
        include: {
            category: true,
        }
    });
    if (!subCategory) {
        throw new ApiError(httpStatus.NOT_FOUND, "No subcategory found with this id");
    }
    const subCategoryWithPhotoUrl = { ...subCategory, img: filenameToUrl(subCategory.img) }
    return subCategoryWithPhotoUrl;
};

const deleteSubCategory = async (id: string, adminId: string) => {
    const subCategory = await prisma.subcategory.findUnique({
        where: { id },
        include: {
            products: true
        }
    });
    if (!subCategory) {
        throw new ApiError(httpStatus.NOT_FOUND, "No category found with this id");
    }
    if (subCategory.products.length) {
        throw new ApiError(httpStatus.NOT_FOUND, "Cannot delete subcategory with existing products.");
    }

    if (subCategory.img) {
        deleteFiles([subCategory.img]);
    }

    const removeSubCategory = await prisma.subcategory.delete({
        where: {
            id
        }
    })
    return removeSubCategory;
};


export const SubCategoryService = {
    create,
    getAll,
    getAllByCategory,
    updateSubCategory,
    getSubCategory,
    deleteSubCategory
};
