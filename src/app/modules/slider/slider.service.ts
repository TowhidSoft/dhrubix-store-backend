import prisma from "../../../config/db.prisma";
import ApiError from "../../../errors/apiError";
import httpStatus from "http-status";
import { SliderType } from "@prisma/client";
import { deleteFiles } from "../../../helpers/files/fileDelete";
import { filenameToUrl, filenamesToUrls, urlToFilename } from "../../../helpers/files/utils/file-url.utils";

const create = async (
    adminId: string,
    payload: {
        title: string;
        type: SliderType;
        productIds?: string[];
        categoryId?: string;
        brandId?: string;
        image?: string;
        active?: boolean;
        sortOrder?: number;
    }
) => {
    if (!adminId) throw new ApiError(httpStatus.BAD_REQUEST, "Admin ID is missing!");

    const adminExist = await prisma.user.findUnique({ where: { id: adminId } });
    if (!adminExist) throw new ApiError(httpStatus.NOT_FOUND, "Admin not found!");

    // Validate based on type
    if (payload.type === "PRODUCT") {
        if (!payload.productIds || payload.productIds.length === 0) {
            throw new ApiError(httpStatus.BAD_REQUEST, "At least one productId is required for PRODUCT slider.");
        }
        const products = await prisma.product.findMany({
            where: { id: { in: payload.productIds } },
            select: { id: true }
        });
        if (products.length !== payload.productIds.length) {
            throw new ApiError(httpStatus.NOT_FOUND, "One or more products not found.");
        }
    }

    if (payload.type === "CATEGORY") {
        if (!payload.categoryId) {
            throw new ApiError(httpStatus.BAD_REQUEST, "categoryId is required for CATEGORY slider.");
        }
        const category = await prisma.category.findUnique({ where: { id: payload.categoryId } });
        if (!category) throw new ApiError(httpStatus.NOT_FOUND, "Category not found!");
    }

    if (payload.type === "BRAND") {
        if (!payload.brandId) {
            throw new ApiError(httpStatus.BAD_REQUEST, "brandId is required for BRAND slider.");
        }
        const brand = await prisma.brand.findUnique({ where: { id: payload.brandId } });
        if (!brand) throw new ApiError(httpStatus.NOT_FOUND, "Brand not found!");
    }

    const slider = await prisma.slider.create({
        data: {
            title: payload.title,
            type: payload.type,
            productIds: payload.type === "PRODUCT" ? (payload.productIds || []) : [],
            categoryId: payload.type === "CATEGORY" ? payload.categoryId : undefined,
            brandId: payload.type === "BRAND" ? payload.brandId : undefined,
            image: payload.image,
            active: payload.active ?? true,
            sortOrder: payload.sortOrder ?? 0,
        }
    });

    return { ...slider, image: slider.image ? filenameToUrl(slider.image) : slider.image };
};

const update = async (
    id: string,
    adminId: string,
    payload: {
        title?: string;
        type?: SliderType;
        productIds?: string[];
        categoryId?: string;
        brandId?: string;
        image?: string;
        active?: boolean;
        sortOrder?: number;
        removeImage?: boolean;
    }
) => {
    if (!adminId) throw new ApiError(httpStatus.BAD_REQUEST, "Admin ID is missing!");

    const adminExist = await prisma.user.findUnique({ where: { id: adminId } });
    if (!adminExist) throw new ApiError(httpStatus.NOT_FOUND, "Admin not found!");

    const sliderExist = await prisma.slider.findUnique({ where: { id } });
    if (!sliderExist) throw new ApiError(httpStatus.NOT_FOUND, "Slider not found!");

    const updateData: any = {};

    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.active !== undefined) updateData.active = payload.active;
    if (payload.sortOrder !== undefined) updateData.sortOrder = payload.sortOrder;

    const effectiveType = payload.type ?? sliderExist.type;
    if (payload.type) updateData.type = payload.type;

    if (effectiveType === "PRODUCT" && payload.productIds) {
        if (payload.productIds.length === 0) {
            throw new ApiError(httpStatus.BAD_REQUEST, "At least one productId is required for PRODUCT slider.");
        }
        const products = await prisma.product.findMany({
            where: { id: { in: payload.productIds } },
            select: { id: true }
        });
        if (products.length !== payload.productIds.length) {
            throw new ApiError(httpStatus.NOT_FOUND, "One or more products not found.");
        }
        updateData.productIds = payload.productIds;
        updateData.categoryId = null;
        updateData.brandId = null;
    }

    if (effectiveType === "CATEGORY" && payload.categoryId) {
        const category = await prisma.category.findUnique({ where: { id: payload.categoryId } });
        if (!category) throw new ApiError(httpStatus.NOT_FOUND, "Category not found!");
        updateData.categoryId = payload.categoryId;
        updateData.productIds = [];
        updateData.brandId = null;
    }

    if (effectiveType === "BRAND" && payload.brandId) {
        const brand = await prisma.brand.findUnique({ where: { id: payload.brandId } });
        if (!brand) throw new ApiError(httpStatus.NOT_FOUND, "Brand not found!");
        updateData.brandId = payload.brandId;
        updateData.productIds = [];
        updateData.categoryId = null;
    }

    // Handle image update - delete old image if new one provided
    if (payload.image && sliderExist.image) {
        deleteFiles([urlToFilename(sliderExist.image)]);
    }
    if (payload.image) updateData.image = payload.image;

    // Handle image removal
    if (payload.removeImage && sliderExist.image) {
        deleteFiles([urlToFilename(sliderExist.image)]);
        updateData.image = null;
    }

    const slider = await prisma.slider.update({
        where: { id },
        data: updateData
    });

    return { ...slider, image: slider.image ? filenameToUrl(slider.image) : slider.image };
};

const getAll = async () => {
    const sliders = await prisma.slider.findMany({
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
    });

    if (!sliders.length) throw new ApiError(httpStatus.NOT_FOUND, "No sliders found.");

    // Enrich each slider with the actual entity data
    const enriched = await Promise.all(sliders.map(async (slider) => {
        let entityData: any = null;

        if (slider.type === "PRODUCT" && slider.productIds.length > 0) {
            const products = await prisma.product.findMany({
                where: { id: { in: slider.productIds } },
                select: {
                    id: true, name: true, sku: true, images: true,
                    price: true, shippingFee: true, discount: true,
                    discountPercent: true, stock: true,
                    category: { select: { id: true, name: true } },
                    brand: { select: { id: true, name: true } }
                }
            });
            entityData = products.map(p => ({
                ...p,
                images: filenamesToUrls(p.images || [])
            }));
        }

        if (slider.type === "CATEGORY" && slider.categoryId) {
            const category = await prisma.category.findUnique({
                where: { id: slider.categoryId },
                include: {
                    products: {
                        take: 20,
                        select: {
                            id: true, name: true, sku: true, images: true,
                            price: true, shippingFee: true, discount: true,
                            discountPercent: true, stock: true,
                            brand: { select: { id: true, name: true } }
                        }
                    }
                }
            });
            if (category) {
                entityData = {
                    ...category,
                    img: category.img ? filenameToUrl(category.img) : category.img,
                    products: category.products.map(p => ({
                        ...p,
                        images: filenamesToUrls(p.images || [])
                    }))
                };
            }
        }

        if (slider.type === "BRAND" && slider.brandId) {
            const brand = await prisma.brand.findUnique({
                where: { id: slider.brandId },
                include: {
                    products: {
                        take: 20,
                        select: {
                            id: true, name: true, sku: true, images: true,
                            price: true, shippingFee: true, discount: true,
                            discountPercent: true, stock: true,
                            category: { select: { id: true, name: true } }
                        }
                    }
                }
            });
            if (brand) {
                entityData = {
                    ...brand,
                    img: brand.img ? filenameToUrl(brand.img) : brand.img,
                    products: brand.products.map(p => ({
                        ...p,
                        images: filenamesToUrls(p.images || [])
                    }))
                };
            }
        }

        return {
            ...slider,
            image: slider.image ? filenameToUrl(slider.image) : slider.image,
            data: entityData
        };
    }));

    return enriched;
};

const getAllByAdmin = async () => {
    const sliders = await prisma.slider.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
    });

    if (!sliders.length) throw new ApiError(httpStatus.NOT_FOUND, "No sliders found.");

    return sliders.map(s => ({
        ...s,
        image: s.image ? filenameToUrl(s.image) : s.image
    }));
};

const get = async (id: string) => {
    if (!id) throw new ApiError(httpStatus.BAD_REQUEST, "Slider Id is required!");
    const slider = await prisma.slider.findUnique({ where: { id } });
    if (!slider) throw new ApiError(httpStatus.NOT_FOUND, "Slider not found!");
    return { ...slider, image: slider.image ? filenameToUrl(slider.image) : slider.image };
};

const remove = async (id: string, adminId: string) => {
    if (!adminId) throw new ApiError(httpStatus.BAD_REQUEST, "Admin ID is missing!");
    const adminExist = await prisma.user.findUnique({ where: { id: adminId } });
    if (!adminExist) throw new ApiError(httpStatus.NOT_FOUND, "Admin not found!");

    const sliderExist = await prisma.slider.findUnique({ where: { id } });
    if (!sliderExist) throw new ApiError(httpStatus.NOT_FOUND, "Slider not found!");

    if (sliderExist.image) {
        deleteFiles([urlToFilename(sliderExist.image)]);
    }

    const deleted = await prisma.slider.delete({ where: { id } });
    return deleted;
};

export const SliderService = {
    create,
    update,
    getAll,
    getAllByAdmin,
    get,
    remove
};
