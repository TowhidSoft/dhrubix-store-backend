import prisma from "../../../config/db.prisma";
import ApiError from "../../../errors/apiError";
import httpStatus from "http-status";
import { filenamesToUrls } from "../../../helpers/files/utils/file-url.utils";


const create = async (
  userId: string,
  productId: string
) => {
  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User ID is missing!");
  }
  const userExist = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!userExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  }
  const productExist = await prisma.wishlist.findFirst({
    where: { userId, productId },
  });

  if (productExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "Product is already in wishlist");
  }
  const createWish = await prisma.wishlist.create({
    data: {
      productId,
      userId
    },
  });
  return createWish;
};




interface GetAllOptions {
  page?: string;
  limit?: string;
}

const getAll = async (userId: string, req: any) => {
  const payload: GetAllOptions = req.query;

  // Parse with defaults
  const page = parseInt(payload.page || '1');
  const limit = parseInt(payload.limit || '10');

  // Validate parsed values
  if (isNaN(page) || page < 1) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Page must be a positive number");
  }

  if (isNaN(limit) || limit < 1) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Limit must be a positive number");
  }

  const skip = (page - 1) * limit;

  const total = await prisma.wishlist.count({
    where: {
      userId
    }
  });

  if (total === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, "No products found in your wishlist");
  }

  // Get paginated wishlist items
  const wishes = await prisma.wishlist.findMany({
    where: {
      userId
    },
    select: {
      id: true,
      productId: true,
      createdAt: true,
      product: {
        select: {
          id: true,
          name: true,
          images: true,
          price: true,
          discountPercent: true,
          discount: true,
          category: {
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
          }
        }
      },
    },
    skip,
    take: limit,
    orderBy: {
      createdAt: 'desc'
    }
  });

  const wishesWithPhotoUrl = wishes.map((wish) => {
    return {
      ...wish,
      product: {
        ...wish.product,
        images: filenamesToUrls(wish.product.images)
      },
    };
  });

  return {
    pagination: {
      total,
      page,
      limit
    },
    data: wishesWithPhotoUrl
  };
};

const get = async (id: string, userId: string) => {
  if (!id) throw new ApiError(httpStatus.BAD_REQUEST, "WishList Id is required!")
  const wishExist = await prisma.wishlist.findUnique({
    where: {
      id,
      userId
    },
  });
  if (!wishExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "No wish found with this id");
  }
  return wishExist;
};

const remove = async (id: string, userId: string) => {
  if (!id) throw new ApiError(httpStatus.BAD_REQUEST, "WishList Id is required!")
  const wishExist = await prisma.wishlist.findFirst({
    where: {
      id,
      userId
    },
  });

  if (!wishExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "No wish found with this id");
  }

  const wishDeleted = await prisma.wishlist.delete({
    where: {
      id: wishExist.id
    }
  })

  return wishDeleted;
};


export const WishListService = {
  create,
  getAll,
  get,
  remove
};
