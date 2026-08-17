import { Prisma } from "@prisma/client";
import prisma from "../../../config/db.prisma";
import ApiError from "../../../errors/apiError";
import httpStatus from "http-status";
import { filenamesToUrls } from "../../../helpers/files/utils/file-url.utils";

const create = async (
  userId: string,
  payload: {
    productId: string,
    quantity: string
  }
) => {
  // Validate user
  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User ID is required");
  }

  const userExist = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!userExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // Validate product
  const productExist = await prisma.product.findUnique({
    where: { id: payload.productId },
  });

  if (!productExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
  }

  // Check if product is in stock
  if (!productExist.stock) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Product is out of stock");
  }

  // Parse quantities
  const requestedQuantity = parseInt(payload.quantity, 10);
  const availableQuantity = parseInt(productExist.quantity, 10);

  // Validate quantity format
  if (isNaN(requestedQuantity) || requestedQuantity <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid quantity. Must be a positive number");
  }

  if (isNaN(availableQuantity)) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Product quantity is invalid");
  }

  // Check if enough stock is available
  if (requestedQuantity > availableQuantity) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Only ${availableQuantity} items available in stock`
    );
  }

  // Check if product already exists in cart
  const existingCartItem = await prisma.cart.findFirst({
    where: {
      userId,
      productId: payload.productId
    }
  });

  let result;

  if (existingCartItem) {
    // Update existing cart item quantity
    const existingQuantity = parseInt(existingCartItem.quantity, 10);
    const newTotalQuantity = existingQuantity + requestedQuantity;

    // Check if updated quantity exceeds stock
    if (newTotalQuantity > availableQuantity) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Cannot add ${requestedQuantity} more items. Total would exceed available stock of ${availableQuantity}`
      );
    }

    result = await prisma.cart.update({
      where: { id: existingCartItem.id },
      data: {
        quantity: newTotalQuantity.toString()
      },
      include: {
        product: {
          include: {
            category: {
              select: { id: true, name: true }
            },
            brand: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });
  } else {
    // Create new cart item
    result = await prisma.cart.create({
      data: {
        userId,
        productId: payload.productId,
        quantity: payload.quantity
      },
      include: {
        product: {
          include: {
            category: {
              select: { id: true, name: true }
            },
            brand: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });
  }

  return result;
};

interface GetAllOptions {
  page?: string;
  limit?: string;
}

interface CartProductWithPrice extends Prisma.CartGetPayload<{
  select: {
    id: true,
    quantity: true,

    createdAt: true,
    product: {
      select: {
        id: true,
        name: true,
        images: true,
        price: true,
        discountPercent: true,
        discount: true,
        shippingFee: true,
        Size: true,
        Color: true,
        category: {
          select: {
            id: true,
            name: true,
          }
        },
        brand: {
          select: {
            id: true,
            name: true,
            img: true
          }
        }
      }
    }
  };
}> {
  quantity: string;
  priceInfo?: {
    shippingFee: number;
    unitPrice: number;
    discountPercent: number;
    discountAmount: number;
    finalPrice: number;
    itemTotal: number;
  };
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

  // Get total count
  const total = await prisma.cart.count({
    where: {
      userId
    }
  });

  if (total === 0) {
    throw new ApiError(httpStatus.OK, "Your cart is empty");
  }

  // Get paginated cart items
  const carts = await prisma.cart.findMany({
    where: {
      userId
    },
    select: {
      id: true,
      quantity: true,

      createdAt: true,
      product: {
        select: {
          id: true,
          name: true,
          images: true,
          price: true,
          discountPercent: true,
          discount: true,
          shippingFee: true,
          Size: true,
          Color: true,
          category: {
            select: {
              id: true,
              name: true,
            }
          },
          brand: {
            select: {
              id: true,
              name: true,
              img: true
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

  // Calculate price information for each cart item
  const cartsWithPriceInfo: CartProductWithPrice[] = carts.map(cart => {
    const product = cart.product;
    const quantity = parseInt(cart.quantity, 10) || 0;

    // Parse price and discount
    const unitPrice = parseFloat(product.price) || 0;
    const shippingFee = parseFloat(product.shippingFee) || 0;
    const discountPercent = parseFloat(product.discountPercent) || 0;

    // Calculate discount
    const discountAmount = product.discount ? (unitPrice * discountPercent) / 100 : 0;
    const finalPrice = unitPrice - discountAmount;
    const itemTotal = (finalPrice * quantity) + shippingFee;

    const images = filenamesToUrls(cart.product.images as string[])
    return {
      ...cart,
      product: {
        ...cart.product,
        images
      },
      priceInfo: {
        unitPrice,
        discountPercent,
        discountAmount,
        shippingFee,
        finalPrice,
        itemTotal
      }
    };
  });

  // Calculate cart summary
  let cartSummary = {
    subtotal: 0,
    totalDiscount: 0,
    totalItems: 0,
    totalQuantity: 0,
    totalShippingFee: 0,
    estimatedTotal: 0
  };

  cartsWithPriceInfo.forEach(item => {
    const quantity = parseInt(item.quantity, 10) || 0;
    const priceInfo = item.priceInfo!;

    cartSummary.subtotal += priceInfo.unitPrice * quantity;
    cartSummary.totalDiscount += priceInfo.discountAmount * quantity;
    cartSummary.totalItems += 1;
    cartSummary.totalQuantity += quantity;
    cartSummary.totalShippingFee += priceInfo.shippingFee,
      cartSummary.estimatedTotal += priceInfo.itemTotal;
  });

  return {
    pagination: {
      total,
      page,
      limit,
    },
    data: {
      carts: cartsWithPriceInfo,
      summary: cartSummary
    }
  };
};

const get = async (id: string, userId: string) => {
  if (!id) throw new ApiError(httpStatus.BAD_REQUEST, "Cart Id is required!")
  const cartExist = await prisma.cart.findUnique({
    where: {
      id,
      userId
    },
    include: {
      product: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
            }
          },
          brand: {
            select: {
              id: true,
              name: true,
              img: true
            }
          }
        }
      },
    }
  });
  if (!cartExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "No wish found with this id");
  }
  return cartExist;
};

const update = async (
  userId: string,
  payload: {
    productId: string,
    quantity: string
  }
) => {
  if (!payload.productId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Product ID is required");
  }

  // Parse and validate requested quantity
  const requestedQuantity = parseInt(payload.quantity, 10);
  if (isNaN(requestedQuantity) || requestedQuantity <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Quantity must be a positive number");
  }

  // Use transaction for data consistency
  const result = await prisma.$transaction(async (tx) => {
    // Check user
    const user = await tx.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    // Check product
    const product = await tx.product.findUnique({
      where: { id: payload.productId }
    });

    if (!product) {
      throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
    }

    // Check if product is in stock
    if (!product.stock) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Product is out of stock");
    }

    // Parse available quantity
    const availableQuantity = parseInt(product.quantity, 10);
    if (isNaN(availableQuantity)) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Invalid product quantity");
    }

    // Check if requested quantity exceeds available stock
    if (requestedQuantity > availableQuantity) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Only ${availableQuantity} items available in stock`
      );
    }

    // Check if cart item exists
    const existingCartItem = await tx.cart.findFirst({
      where: {
        userId,
        productId: payload.productId
      }
    });

    if (!existingCartItem) {
      throw new ApiError(httpStatus.NOT_FOUND, "Product not found in cart");
    }

    // Update cart item with new quantity
    const updatedCart = await tx.cart.update({
      where: { id: existingCartItem.id },
      data: {
        quantity: requestedQuantity.toString(),
        updatedAt: new Date()
      },
      include: {
        product: {
          include: {
            category: {
              select: { id: true, name: true }
            },
            brand: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    return updatedCart;
  });

  return result;
};

const remove = async (id: string, userId: string) => {
  if (!id) throw new ApiError(httpStatus.BAD_REQUEST, "WishList Id is required!")
  const cartExist = await prisma.cart.findUnique({
    where: {
      id,
      userId
    },
  });

  if (!cartExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "No cart found with this id");
  }

  const cartDeleted = await prisma.cart.delete({
    where: {
      id: cartExist.id
    }
  })

  return cartDeleted;
};


export const CartService = {
  create,
  getAll,
  get,
  update,
  remove
};
