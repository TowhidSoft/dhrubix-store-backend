import prisma from "../../../config/db.prisma";
import ApiError from "../../../errors/apiError";
import httpStatus from "http-status";

import { deleteFiles } from "../../../helpers/files/fileDelete";
import { filenamesToUrls, filenameToUrl, urlsToFilenames } from "../../../helpers/files/utils/file-url.utils";
import { SKUGenerator } from "../../../helpers/sku-generator";

const create = async (
  adminId: string,
  payload: {
    name: string;
    shortDes: string;
    des?: string;
    specification?: string;
    images: string[] | any;
    videos?: string[] | any;
    videoUrls?: string[]; // external video links (YouTube etc.)
    sizeId?: string;
    colorId?: string;
    categoryId: string;
    subcategoryId: string;
    brandId: string;
    tag?: string;
    price?: string;
    shippingFee?: string;
    discount?: boolean;
    discountPercent?: string | any;
    stock?: boolean;
    quantity?: string;
    affiliateItem?: boolean;
    affiliateLink?: string | null;
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

  if (payload.sizeId) {
    const size = await prisma.size.findUnique({
      where: { id: payload.sizeId }
    })
    if (!size) {
      throw new ApiError(httpStatus.NOT_FOUND, "Size not exist!")
    }
  }
  if (payload.colorId) {
    const color = await prisma.color.findUnique({
      where: { id: payload.colorId }
    })
    if (!color) {
      throw new ApiError(httpStatus.NOT_FOUND, "Color not exist!")
    }
  }

  const category = await prisma.category.findUnique({
    where: { id: payload.categoryId }
  })
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not exist!")
  }


  if (payload.subcategoryId) {
    const subCategory = await prisma.subcategory.findUnique({
      where: {
        id: payload.subcategoryId
      }
    })
    if (!subCategory) {
      throw new ApiError(httpStatus.NOT_FOUND, "Subcategory not exist!")
    }
  }

  if (payload.brandId) {
    const brand = await prisma.brand.findUnique({
      where: { id: payload.brandId }
    })
    if (!brand) {
      throw new ApiError(httpStatus.NOT_FOUND, "Brand not exist!")
    }
  }
  const videos: string[] = payload.videos || [];
  const videoUrls: string[] = payload.videoUrls || [];
  if (videos.length + videoUrls.length > 3) {
    throw new ApiError(httpStatus.BAD_REQUEST, "A product can have a maximum of 3 videos (uploads + external links combined)!");
  }
  if (payload.affiliateItem !== undefined && typeof payload.affiliateItem !== "boolean") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Affiliate item must be true or false!");
  }
  if (
    !payload.affiliateItem &&
    (!payload.price?.trim() || !payload.quantity?.trim())
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Price and quantity are required for non-affiliate products!");
  }
  if (payload.affiliateItem && !payload.affiliateLink) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Affiliate products require an affiliate link!");
  }
  if (payload.affiliateItem && !isHttpUrl(payload.affiliateLink)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Affiliate link must be a valid HTTP or HTTPS URL!");
  }

  const SKU = SKUGenerator()
  const product = await prisma.product.create({
    data: {
      name: payload.name,
      sku: SKU,
      shortDes: payload.shortDes,
      des: payload.des,
      specification: payload.specification,
      images: payload.images,
      videos: videos,
      videoUrls: videoUrls,
      tag: payload.tag,
      price: payload.price || "0",
      shippingFee: payload.shippingFee,
      discount: payload.discount,
      discountPercent: payload.discountPercent,
      stock: payload.stock,
      quantity: payload.quantity || "0",
      affiliateItem: payload.affiliateItem ?? false,
      affiliateLink: payload.affiliateItem ? payload.affiliateLink : null,
      ...(payload.sizeId && {
        Size: {
          connect: { id: payload.sizeId }
        },
      }),
      ...(payload.colorId && {
        Color: {
          connect: { id: payload.colorId }
        }
      }),
      category: {
        connect: { id: payload.categoryId },
      },
      ...(payload.subcategoryId && {
        Subcategory: {
          connect: { id: payload.subcategoryId }
        }
      }),
      ...(payload.brandId && {
        brand: {
          connect: { id: payload.brandId }
        }
      }),
    },
  });
  const productWithPhotoUrl = {
    ...product,
    images: filenamesToUrls(product.images || []),
    videos: filenamesToUrls(product.videos || []),
  };
  return productWithPhotoUrl;
};

interface UpdateProductPayload {
  name?: string;
  shortDes?: string;
  des?: string;
  specification?: string;
  images?: string[]; // Should be array of strings
  videos?: string[]; // Should be array of strings, max 3
  removeVideos?: string[]; // Should be array of video URLs to remove
  videoUrls?: string[]; // external video links (YouTube etc.), max 3 combined with `videos`
  removeVideoUrls?: string[]; // external links to remove
  sizeId?: string;
  colorId?: string;
  categoryId?: string;
  subcategoryId?: string;
  brandId?: string;
  tag?: string;
  price?: string;
  discount?: boolean;
  discountPercent?: string;
  stock?: boolean;
  quantity?: string;
  removeImages?: string[]; // Should be array of image URLs to remove
  affiliateItem?: boolean;
  affiliateLink?: string | null;
}

const isHttpUrl = (value?: string | null): boolean => {
  if (typeof value !== "string" || !value) return false;

  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
};

const update = async (
  id: string,
  adminId: string,
  payload: UpdateProductPayload,
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

  const productExist = await prisma.product.findUnique({
    where: { id },
  });

  if (!productExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "Product not found!");
  }
  const {
    categoryId,
    subcategoryId,
    brandId,
    sizeId,
    colorId,
    removeImages,
    images: newImages, // ✅ pulled out so it never pre-populates updateData.images
    removeVideos,
    videos: newVideos, // ✅ pulled out so it never pre-populates updateData.videos
    removeVideoUrls,
    videoUrls: newVideoUrls, // ✅ pulled out so it never pre-populates updateData.videoUrls
    ...restPayload
  } = payload;

  const updateData: any = { ...restPayload };
  if (payload.affiliateItem !== undefined && typeof payload.affiliateItem !== "boolean") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Affiliate item must be true or false!");
  }
  if (
    payload.affiliateLink !== undefined &&
    payload.affiliateLink !== null &&
    typeof payload.affiliateLink !== "string"
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Affiliate link must be a URL string!");
  }
  const affiliateItem = payload.affiliateItem ?? productExist.affiliateItem ?? false;
  const affiliateLink = payload.affiliateLink !== undefined
    ? payload.affiliateLink
    : productExist.affiliateLink;

  if (affiliateItem && !isHttpUrl(affiliateLink)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Affiliate products require a valid HTTP or HTTPS affiliate link!");
  }
  updateData.affiliateItem = affiliateItem;
  updateData.affiliateLink = affiliateItem ? affiliateLink : null;

  // Step 1: Handle removeImages — filter out deleted images from the DB list
  if (payload.removeImages && Array.isArray(payload.removeImages) && payload.removeImages.length > 0) {
    try {
      const removeFileNames = urlsToFilenames(payload.removeImages);
      await deleteFiles(removeFileNames);

      // Store the filtered list in updateData.images — new uploads will be appended to THIS list below
      const currentImages = productExist.images || [];
      updateData.images = currentImages.filter(
        (image) => !removeFileNames.includes(image)
      );
    } catch (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Error deleting files!");
    }
    delete updateData.removeImages;
  }

  // Step 2: Append newly uploaded images on top of the already-filtered list (or original if no removals)
  if (newImages && Array.isArray(newImages) && newImages.length > 0) {
    // Use updateData.images (post-filter) as the base, fall back to DB images if no removals happened.
    // `updateData.images` is only ever set above (Step 1), so this fallback now works correctly
    // whether or not a removal happened.
    const baseImages: string[] = updateData.images ?? productExist.images ?? [];
    updateData.images = [...baseImages, ...newImages];
  }

  // Step 3: Handle removeVideos — filter out deleted videos from the DB list
  if (removeVideos && Array.isArray(removeVideos) && removeVideos.length > 0) {
    try {
      const removeFileNames = urlsToFilenames(removeVideos);
      await deleteFiles(removeFileNames);

      const currentVideos = productExist.videos || [];
      updateData.videos = currentVideos.filter(
        (video) => !removeFileNames.includes(video)
      );
    } catch (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Error deleting video files!");
    }
  }

  // Step 4: Append newly uploaded videos on top of the already-filtered list (or original if no removals)
  if (newVideos && Array.isArray(newVideos) && newVideos.length > 0) {
    const baseVideos: string[] = updateData.videos ?? productExist.videos ?? [];
    updateData.videos = [...baseVideos, ...newVideos];
  }

  // Step 5: Handle removeVideoUrls — filter out removed external links (no file on disk to delete)
  if (removeVideoUrls && Array.isArray(removeVideoUrls) && removeVideoUrls.length > 0) {
    const currentVideoUrls = productExist.videoUrls || [];
    updateData.videoUrls = currentVideoUrls.filter(
      (url) => !removeVideoUrls.includes(url)
    );
  }

  // Step 6: Append newly added external video URLs on top of the already-filtered list
  if (newVideoUrls && Array.isArray(newVideoUrls) && newVideoUrls.length > 0) {
    const baseVideoUrls: string[] = updateData.videoUrls ?? productExist.videoUrls ?? [];
    updateData.videoUrls = [...baseVideoUrls, ...newVideoUrls];
  }

  // Step 7: Enforce max 3 videos per product (uploads + external links combined)
  const finalVideosCount = (updateData.videos ?? productExist.videos ?? []).length;
  const finalVideoUrlsCount = (updateData.videoUrls ?? productExist.videoUrls ?? []).length;
  if (finalVideosCount + finalVideoUrlsCount > 3) {
    throw new ApiError(httpStatus.BAD_REQUEST, "A product can have a maximum of 3 videos (uploads + external links combined)!");
  }

  if (payload.sizeId !== undefined) {
    if (payload.sizeId === null || payload.sizeId === "") {
      updateData.sizeId = null;
    } else {
      const sizeExists = await prisma.size.findUnique({
        where: { id: payload.sizeId },
      });
      if (!sizeExists) {
        throw new ApiError(httpStatus.NOT_FOUND, "Size not found!");
      }
      updateData.sizeId = payload.sizeId;
    }
  }

  if (payload.colorId !== undefined) {
    if (payload.colorId === null || payload.colorId === "") {
      updateData.colorId = null;
    } else {
      const colorExists = await prisma.color.findUnique({
        where: { id: payload.colorId },
      });
      if (!colorExists) {
        throw new ApiError(httpStatus.NOT_FOUND, "Color not found!");
      }
      updateData.colorId = payload.colorId;
    }
  }

  if (payload.categoryId) {
    const categoryExists = await prisma.category.findUnique({
      where: { id: payload.categoryId },
    });
    if (!categoryExists) {
      throw new ApiError(httpStatus.NOT_FOUND, "Category not found!");
    }
    updateData.categoryId = payload.categoryId;
  }

  if (payload.subcategoryId !== undefined) {
    if (payload.subcategoryId === null || payload.subcategoryId === "") {
      updateData.subcategoryId = null;
    } else {
      const subCategoryExists = await prisma.subcategory.findUnique({
        where: { id: payload.subcategoryId },
      });
      if (!subCategoryExists) {
        throw new ApiError(httpStatus.NOT_FOUND, "Subcategory not found!");
      }
      updateData.subcategoryId = payload.subcategoryId;
    }
  }

  if (payload.brandId !== undefined) {
    if (payload.brandId === null || payload.brandId === "") {
      updateData.brandId = null;
    } else {
      const brandExists = await prisma.brand.findUnique({
        where: { id: payload.brandId },
      });
      if (!brandExists) {
        throw new ApiError(httpStatus.NOT_FOUND, "Brand not found!");
      }
      updateData.brandId = payload.brandId;
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data: updateData,
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      Subcategory: {
        select: {
          id: true,
          name: true,
        }
      },
      brand: {
        select: {
          id: true,
          name: true,
        },
      },
      Size: {
        select: {
          id: true,
          name: true
        }
      },
      Color: {
        select: {
          id: true,
          name: true
        }
      }
    },
  });
  const productWithPhotoUrls = {
    ...product,
    images: filenamesToUrls(product.images || []),
    videos: filenamesToUrls(product.videos || []),
  }
  return productWithPhotoUrls;
};



interface GetAllOptions {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
  categoryId?: string;
  subcategoryId?: string;
  brandId?: string;
  sizeId?: string;
  colorId?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: string;
  hasDiscount?: string;
}

const getAll = async (req) => {
  const queryLoad: GetAllOptions = req.query;

  // Parse with defaults
  const page = parseInt(queryLoad.page || "1");
  const limit = parseInt(queryLoad.limit || "10");

  // Set defaults for sorting
  const sortBy = queryLoad.sortBy || 'createdAt';
  const sortOrder = queryLoad.sortOrder || 'desc';

  const categoryId = queryLoad.categoryId;
  const subcategoryId = queryLoad.subcategoryId;
  const brandId = queryLoad.brandId;
  const sizeId = queryLoad.sizeId;
  const colorId = queryLoad.colorId;
  const search = queryLoad.search;

  // Parse prices - only if provided
  const minPrice = queryLoad.minPrice ? parseInt(queryLoad.minPrice) : undefined;
  const maxPrice = queryLoad.maxPrice ? parseInt(queryLoad.maxPrice) : undefined;

  console.log('Query params:', req.query);

  // Handle boolean conversions
  let inStock: boolean | undefined;
  if (queryLoad.inStock === "true") {
    inStock = true;
  } else if (queryLoad.inStock === "false") {
    inStock = false;
  }

  let hasDiscount: boolean | undefined;
  if (queryLoad.hasDiscount === "true") {
    hasDiscount = true;
  } else if (queryLoad.hasDiscount === "false") {
    hasDiscount = false;
  }

  const skip = (page - 1) * limit;

  // Build where clause dynamically
  const where: any = {};

  if (categoryId) where.categoryId = categoryId;
  if (subcategoryId) where.subcategoryId = subcategoryId;
  if (brandId) where.brandId = brandId;
  if (sizeId) where.sizeId = sizeId;
  if (colorId) where.colorId = colorId;
  if (inStock !== undefined) where.stock = inStock;
  if (hasDiscount !== undefined) where.discount = hasDiscount;

  // Price filtering - only if values are valid numbers
  if ((minPrice !== undefined && !isNaN(minPrice)) ||
    (maxPrice !== undefined && !isNaN(maxPrice))) {
    where.price = {};

    if (minPrice !== undefined && !isNaN(minPrice)) {
      where.price.gte = minPrice.toString();
    }

    if (maxPrice !== undefined && !isNaN(maxPrice)) {
      where.price.lte = maxPrice.toString();
    }
  }

  // Search functionality
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { des: { contains: search, mode: 'insensitive' } },
      { shortDes: { contains: search, mode: 'insensitive' } },
      { brand: { name: { contains: search, mode: 'insensitive' } } },
      { category: { name: { contains: search, mode: 'insensitive' } } },
      { Subcategory: { name: { contains: search, mode: 'insensitive' } } },
      { Size: { name: { contains: search, mode: 'insensitive' } } },
      { Color: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }

  console.log('Where clause:', JSON.stringify(where, null, 2));

  // Get total count with filters
  const total = await prisma.product.count({ where });

  if (total === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, "No products found matching your criteria");
  }

  // Get paginated products
  const products = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      sku: true,
      images: true,
      price: true,
      shippingFee: true,
      discount: true,
      discountPercent: true,
      stock: true,
      quantity: true,
      affiliateItem: true,
      affiliateLink: true,
      createdAt: true,
      updatedAt: true,
      category: {
        select: {
          id: true,
          name: true
        }
      },
      Subcategory: {
        select: {
          id: true,
          name: true,
        }
      },
      brand: {
        select: {
          id: true,
          name: true
        }
      },
      Size: {
        select: {
          id: true,
          name: true
        }
      },
      Color: {
        select: {
          id: true,
          name: true
        }
      },
      _count: {
        select: {
          orderProducts: true
        }
      }
    },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder
    }
  });

  const productIds = products.map(p => p.id);
  const avgRatings = await prisma.review.groupBy({
    by: ['productId'],
    where: { isApproved: true, productId: { in: productIds } },
    _avg: { rating: true },
  });

  // 3. Merge into a Map
  const ratingMap = new Map(
    avgRatings.map(item => [item.productId, item._avg.rating])
  );


  const productsWithPhotoUrls = products.map((product) => ({
    ...product,
    images: filenamesToUrls(product.images || []),
    avgRating: ratingMap.get(product.id) || 0
  }));
  return {
    pagination: {
      total,
      page,
      limit,
    },
    data: productsWithPhotoUrls
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

  const categoryId = queryLoad.categoryId;
  const subcategoryId = queryLoad.subcategoryId;
  const brandId = queryLoad.brandId;
  const sizeId = queryLoad.sizeId;
  const colorId = queryLoad.colorId;
  const search = queryLoad.search;

  // Parse prices - only if provided
  const minPrice = queryLoad.minPrice ? parseInt(queryLoad.minPrice) : undefined;
  const maxPrice = queryLoad.maxPrice ? parseInt(queryLoad.maxPrice) : undefined;

  console.log('Query params:', req.query);

  // Handle boolean conversions
  let inStock: boolean | undefined;
  if (queryLoad.inStock === "true") {
    inStock = true;
  } else if (queryLoad.inStock === "false") {
    inStock = false;
  }

  let hasDiscount: boolean | undefined;
  if (queryLoad.hasDiscount === "true") {
    hasDiscount = true;
  } else if (queryLoad.hasDiscount === "false") {
    hasDiscount = false;
  }

  const skip = (page - 1) * limit;

  // Build where clause dynamically
  const where: any = {};

  if (categoryId) where.categoryId = categoryId;
  if (subcategoryId) where.subcategoryId = subcategoryId;
  if (brandId) where.brandId = brandId;
  if (sizeId) where.sizeId = sizeId;
  if (colorId) where.colorId = colorId;
  if (inStock !== undefined) where.stock = inStock;
  if (hasDiscount !== undefined) where.discount = hasDiscount;

  // Price filtering - only if values are valid numbers
  if ((minPrice !== undefined && !isNaN(minPrice)) ||
    (maxPrice !== undefined && !isNaN(maxPrice))) {
    where.price = {};

    if (minPrice !== undefined && !isNaN(minPrice)) {
      where.price.gte = minPrice.toString();
    }

    if (maxPrice !== undefined && !isNaN(maxPrice)) {
      where.price.lte = maxPrice.toString();
    }
  }

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
  const total = await prisma.product.count({ where });

  if (total === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, "No products found matching your criteria");
  }

  // Get paginated products
  const products = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      sku: true,
      images: true,
      price: true,
      shippingFee: true,
      discount: true,
      discountPercent: true,
      stock: true,
      quantity: true,
      affiliateItem: true,
      affiliateLink: true,
      createdAt: true,
      updatedAt: true,
      category: {
        select: {
          id: true,
          name: true
        }
      },
      Subcategory: {
        select: {
          id: true,
          name: true
        }
      },
      brand: {
        select: {
          id: true,
          name: true
        }
      },
      Size: {
        select: {
          id: true,
          name: true,
        }
      },
      Color: {
        select: {
          id: true,
          name: true,
        }
      },
      _count: {
        select: {
          orderProducts: true
        }
      }
    },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder
    }
  });

  // Get product IDs for batch statistics query
  const productIds = products.map(product => product.id);

  // Get order product statistics for these products
  const orderProducts = await prisma.orderProduct.findMany({
    where: {
      productId: { in: productIds },
      // order: {
      //   // Only count completed orders for sales statistics
      //   status: 'COMPLETED'
      // }
    },
    select: {
      productId: true,
      quantity: true,
      price: true,
      order: {
        select: {
          id: true,
          status: true,
          payments: {
            select: {
              amount: true,
              paidAmount: true
            }
          }
        }
      }
    }
  });

  // Calculate statistics per product
  const productStats = new Map();

  // Initialize all products with zero stats
  products.forEach(product => {
    productStats.set(product.id, {
      totalSales: 0,
      totalQuantitySold: 0,
      totalRevenue: 0,
      totalPayments: 0
    });
  });

  // Calculate stats from order products
  orderProducts.forEach(op => {
    const stats = productStats.get(op.productId);
    if (stats) {
      stats.totalQuantitySold += op.quantity;
      stats.totalRevenue += op.price * op.quantity;

      // Calculate payments from completed orders
      if (op.order?.payments?.length > 0) {
        const confirmedPayments = op.order.payments.filter((p: any) => p.status === 'CONFIRMED');
        stats.totalPayments += confirmedPayments.reduce((sum, payment) =>
          sum + (payment.paidAmount || payment.amount), 0);
        stats.totalSales++;
      }
    }
  });

  // Combine products with their statistics
  const productsWithStats = products.map(product => {
    const stats = productStats.get(product.id);
    const availableQuantity = parseInt(product.quantity) - (stats?.totalQuantitySold || 0);


    return {
      ...product,
      statistics: {
        totalSales: stats?.totalSales || 0,
        totalQuantitySold: stats?.totalQuantitySold || 0,
        totalRevenue: stats?.totalRevenue || 0,
        totalPayments: stats?.totalPayments || 0,
        totalAvailable: availableQuantity > 0 ? availableQuantity : 0,
        isOutOfStock: availableQuantity <= 0
      }
    };
  });

  // Get all order products for total revenue calculation
  const allOrderProductsForRevenue = await prisma.orderProduct.findMany({
    select: {
      price: true,
      quantity: true
    }
  });

  // Calculate total revenue manually (price * quantity)
  const totalRevenue = allOrderProductsForRevenue.reduce((sum, op) => {
    return sum + (op.price * op.quantity);
  }, 0);

  // Get overall dashboard statistics
  const overallStats = {
    totalProducts: total,
    totalProductsInStock: await prisma.product.count({ where: { ...where, stock: true } }),
    totalProductsOutOfStock: await prisma.product.count({ where: { ...where, stock: false } }),
    totalProductsWithDiscount: await prisma.product.count({ where: { ...where, discount: true } }),
    totalSales: await prisma.order.count(),
    totalRevenue: totalRevenue
  };

  const productsWithPhotoUrls = productsWithStats.map((product) => ({
    ...product,
    images: filenamesToUrls(product.images || []),
  }));

  return {
    pagination: {
      total,
      page,
      limit,
    },
    data: {
      dashboardStats: overallStats,
      productsWithPhotoUrls
    },
  };
};

const get = async (id: string) => {
  if (!id) throw new ApiError(httpStatus.BAD_REQUEST, "Product Id is required!")
  const product = await prisma.product.findUnique({
    where: {
      id
    },
    include: {
      category: true,
      Subcategory: true,
      brand: true,
      Size: true,
      Color: true,
      _count: {
        select: {
          orderProducts: true
        }
      },
      reviews: {
        where: {
          isApproved: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              photo: true
            }
          }
        }
      },
    }
  });
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, "No found found with this id");
  }

  // Calculate average rating
  let avgRating = 0;
  if (product.reviews && product.reviews.length > 0) {
    const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
    avgRating = totalRating / product.reviews.length;
  }

  // Add average rating to the product
  const productWithPhotoUrl = {
    ...product,
    images: filenamesToUrls(product.images || []),
    videos: filenamesToUrls(product.videos || []),
    reviews: {
      ...product.reviews.map((review) => {
        return {
          ...review,
          user: {
            ...review.user,
            photo: review.user.photo ? filenameToUrl(review.user.photo) : null
          }
        }
      })
    },
    avgRating: avgRating
  };
  return productWithPhotoUrl;
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

  if (!id) throw new ApiError(httpStatus.BAD_REQUEST, "Product Id is required!")
  const productExist = await prisma.product.findUnique({
    where: { id }
  });
  if (!productExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "No product found with this id");
  }

  const result = await prisma.$transaction(async (tx) => {
    // Delete reviews associated with the product first
    await tx.review.deleteMany({
      where: {
        productId: id
      }
    });

    await tx.cart.deleteMany({
      where: {
        productId: id
      }
    });

    await tx.wishlist.deleteMany({
      where: {
        productId: id
      }
    });

    // await tx.orderProduct.deleteMany({
    //   where: {
    //     productId: id
    //   }
    // });

    // Finally, delete the product
    const deletedProduct = await tx.product.delete({
      where: {
        id
      }
    });
    deleteFiles(productExist.images || []);
    deleteFiles(productExist.videos || []);

    return deletedProduct;
  });

  return result;
};

const getBestSell = async (req: any) => {
  const page = parseInt(req.query.page || "1");
  const limit = parseInt(req.query.limit || "10");
  const skip = (page - 1) * limit;

  const total = await prisma.product.count();

  const products = await prisma.product.findMany({
    orderBy: {
      orderProducts: {
        _count: 'desc'
      }
    },
    select: {
      id: true,
      name: true,
      sku: true,
      images: true,
      price: true,
      shippingFee: true,
      discount: true,
      discountPercent: true,
      stock: true,
      quantity: true,
      affiliateItem: true,
      affiliateLink: true,
      createdAt: true,
      updatedAt: true,
      category: {
        select: {
          id: true,
          name: true
        }
      },
      Subcategory: {
        select: {
          id: true,
          name: true
        }
      },
      brand: {
        select: {
          id: true,
          name: true
        }
      },
      Size: {
        select: {
          id: true,
          name: true
        }
      },
      Color: {
        select: {
          id: true,
          name: true
        }
      },
      _count: {
        select: {
          orderProducts: true
        }
      }
    },
    skip,
    take: limit
  });

  const productsWithPhotoUrls = products.map((product) => ({
    ...product,
    images: filenamesToUrls(product.images || []),
  }));

  return {
    pagination: {
      total,
      page,
      limit,
    },
    data: productsWithPhotoUrls
  };
};

const getOnSale = async (req: any) => {
  const page = parseInt(req.query.page || "1");
  const limit = parseInt(req.query.limit || "10");
  const skip = (page - 1) * limit;

  const where = { discount: true };
  const total = await prisma.product.count({ where });

  const products = await prisma.product.findMany({
    where,
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      name: true,
      sku: true,
      images: true,
      price: true,
      shippingFee: true,
      discount: true,
      discountPercent: true,
      stock: true,
      quantity: true,
      affiliateItem: true,
      affiliateLink: true,
      createdAt: true,
      updatedAt: true,
      category: {
        select: {
          id: true,
          name: true
        }
      },
      Subcategory: {
        select: {
          id: true,
          name: true
        }
      },
      brand: {
        select: {
          id: true,
          name: true
        }
      },
      Size: {
        select: {
          id: true,
          name: true
        }
      },
      Color: {
        select: {
          id: true,
          name: true
        }
      },
      _count: {
        select: {
          orderProducts: true
        }
      }
    },
    skip,
    take: limit
  });

  const productsWithPhotoUrls = products.map((product) => ({
    ...product,
    images: filenamesToUrls(product.images || []),
  }));

  return {
    pagination: {
      total,
      page,
      limit,
    },
    data: productsWithPhotoUrls
  };
};

const getTopRated = async (req: any) => {
  const page = parseInt(req.query.page || "1");
  const limit = parseInt(req.query.limit || "10");
  const skip = (page - 1) * limit;

  const products = await prisma.product.findMany({
    include: {
      reviews: {
        select: {
          rating: true
        }
      },
      category: {
        select: {
          id: true,
          name: true
        }
      },
      Subcategory: {
        select: {
          id: true,
          name: true
        }
      },
      brand: {
        select: {
          id: true,
          name: true
        }
      },
      Size: {
        select: {
          id: true,
          name: true
        }
      },
      Color: {
        select: {
          id: true,
          name: true
        }
      },
      _count: {
        select: {
          orderProducts: true
        }
      }
    }
  });

  const productsWithAvgRating = products.map(product => {
    const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = product.reviews.length > 0 ? totalRating / product.reviews.length : 0;
    return {
      ...product,
      avgRating,
      reviews: undefined
    };
  });

  productsWithAvgRating.sort((a, b) => {
    if (b.avgRating !== a.avgRating) {
      return b.avgRating - a.avgRating;
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const total = productsWithAvgRating.length;
  const paginatedProducts = productsWithAvgRating.slice(skip, skip + limit);

  const productsWithPhotoUrls = paginatedProducts.map((product) => ({
    ...product,
    images: filenamesToUrls(product.images || []),
  }));

  return {
    pagination: {
      total,
      page,
      limit,
    },
    data: productsWithPhotoUrls
  };
};

export const ProductService = {
  create,
  update,
  getAll,
  getAllByAdmin,
  get,
  remove,
  getBestSell,
  getOnSale,
  getTopRated
};