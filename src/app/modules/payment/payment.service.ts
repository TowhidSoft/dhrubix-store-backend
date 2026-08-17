import prisma from "../../../config/db.prisma";
import httpStatus from "http-status"
import ApiError from "../../../errors/apiError";

export const history = async (
  userId: string,
  req: any
) => {
  const queryLoad = req.query;

  // Parse with defaults
  const page = parseInt(queryLoad.page || "1");
  const limit = parseInt(queryLoad.limit || "10");
  const status = queryLoad.status || undefined;
  const sortOrder = queryLoad.sortOrder || 'desc';
  const sortBy = queryLoad.sortBy || 'createdAt'; // Default sorting by createdAt

  console.log('Query params:', req.query);
  const skip = (page - 1) * limit;

  const userExist = await prisma.user.findUnique({
    where: {
      id: userId
    }
  })
  if (!userExist) throw new ApiError(httpStatus.NOT_FOUND, "User not found")

  // Build where clause dynamically
  const where: any = { userId };
  if (status) where.status = status;
  // Get total count with filters
  const total = await prisma.payment.count({ where });

  if (total === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, "No payments found matching your criteria");
  }

  // Get paginated payments
  const payments = await prisma.payment.findMany({
    where,
    select: {
      id: true,
      userId: true,
      orderId: true,
      name: true,
      amount: true,
      paidAmount: true,
      currency: true,
      status: true,
      method: true,
      order: {
        select: {
          id: true,
          userId: true,
          orderNo: true,
          name: true,
          email: true,
          address: true,
          orderProducts: {
            select: {
              id: true,
              price: true,
              quantity: true,
              productId: true,
              isReviewed: true,
              product: {
                select: {
                  name: true,
                  images: true,
                }
              }
            }
          },
        }

      },
    },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder // Correct format: { createdAt: 'desc' }
    }
  });

  return {
    pagination: {
      total,
      page,
      limit
    },
    data: payments
  };
};

export const adminHistory = async (
  adminId: string,
  req: any
) => {
  const queryLoad = req.query;

  // Parse with defaults
  const page = parseInt(queryLoad.page || "1");
  const limit = parseInt(queryLoad.limit || "10");
  const status = queryLoad.status || undefined;

  const sortOrder = queryLoad.sortOrder || 'desc';
  const sortBy = queryLoad.sortBy || 'createdAt'; // Default sorting by createdAt

  console.log('Query params:', req.query);
  const skip = (page - 1) * limit;


  const adminExist = await prisma.user.findUnique({
    where: {
      id: adminId
    }
  })
  if (!adminExist) throw new ApiError(httpStatus.NOT_FOUND, "Admin not found")

  // Build where clause dynamically
  const where: any = {};
  if (status) where.status = status;

  // Get total count with filters
  const total = await prisma.payment.count({ where });

  if (total === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, "No payments found matching your criteria");
  }

  // Get paginated payments
  const payments = await prisma.payment.findMany({
    where,
    select: {
      id: true,
      userId: true,
      orderId: true,
      name: true,
      amount: true,
      paidAmount: true,
      currency: true,
      status: true,
      method: true,
      order: {
        select: {
          id: true,
          userId: true,
          orderNo: true,
          name: true,
          email: true,
          address: true,
          orderProducts: {
            select: {
              id: true,
              price: true,
              quantity: true,
              productId: true,
              isReviewed: true,
              product: {
                select: {
                  name: true,
                  images: true,
                }
              }
            }
          },
        }

      },
    },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder // Correct format: { createdAt: 'desc' }
    }
  });

  return {
    pagination: {
      total,
      page,
      limit
    },
    data: payments
  };
};


export const detais = async (
  adminId: string,
  id: string
) => {

  const adminExist = await prisma.user.findUnique({
    where: {
      id: adminId
    }
  })
  if (!adminExist) throw new ApiError(httpStatus.NOT_FOUND, "Admin not found")

  if (!id) throw new ApiError(httpStatus.NOT_IMPLEMENTED, "Payment id is required!")

  const paymentDetails = await prisma.payment.findUnique({
    where: {
      id
    },
    select: {
      id: true,
      orderId: true,
      name: true,
      amount: true,
      paidAmount: true,
      currency: true,
      status: true,
      method: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          photo: true,
        }
      },
      order: {
        select: {
          id: true,
          userId: true,
        }
      }
    }

  })

  return paymentDetails;
};


export const PaymentService = {
  history,
  adminHistory,
  detais
};