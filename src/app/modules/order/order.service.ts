import httpStatus from 'http-status';
import ApiError from "../../../errors/apiError";
import prisma from '../../../config/db.prisma';
import { randomInt } from 'crypto';
import { Currency, OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { filenamesToUrls, filenameToUrl } from '../../../helpers/files/utils/file-url.utils';
import SendEmailUtility from '../../../helpers/utility/sendEmailUtility';
import { orderStatusEmailTemplate, invoiceEmailTemplate } from './order.mail.template';
import { generateInvoicePdf } from '../../../helpers/invoice/generateInvoicePdf';
import { frontend_url } from '../../../config/config';

// Helper type for frontend cart items (what the client sends)
interface FrontendCartItem {
  productId: string;
  quantity: number; // or string, but we'll parse
}

export const createOrderFromCart = async (
  userId: string | null, // can be null for guest orders
  shippingDetails: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    currency?: Currency;
    paymentMethod?: PaymentMethod;
  },
  // New optional parameter: frontend cart items
  frontendCartItems?: FrontendCartItem[],
) => {
  // Start transaction
  return await prisma.$transaction(async (tx) => {
    // 1. Determine which cart items to use
    let rawCartItems: any[] = []; // will hold objects with product relation
    let source: 'db' | 'frontend' = 'db';

    if (frontendCartItems && frontendCartItems.length > 0) {
      // Use frontend-provided items
      source = 'frontend';
      // Fetch product details for each item
      const productIds = frontendCartItems.map(item => item.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        include: {
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true, img: true } },
        },
      });
      // Build a map for quick lookup
      const productMap = new Map(products.map(p => [p.id, p]));

      // Validate that all productIds exist
      for (const item of frontendCartItems) {
        if (!productMap.has(item.productId)) {
          throw new ApiError(httpStatus.NOT_FOUND, `Product with id ${item.productId} not found`);
        }
      }

      // Create a structure similar to cart items (with a 'product' property)
      rawCartItems = frontendCartItems.map(item => ({
        product: productMap.get(item.productId)!,
        quantity: String(item.quantity), // store as string to match your DB type
        // we don't have cart id, but we only need product and quantity
      }));
    } else {
      // Fallback: get cart from DB
      if (!userId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'User ID is required when no cart items are provided');
      }
      rawCartItems = await tx.cart.findMany({
        where: { userId },
        include: {
          product: {
            include: {
              category: { select: { id: true, name: true } },
              brand: { select: { id: true, name: true, img: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!rawCartItems || rawCartItems.length === 0) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Your cart is empty');
      }
    }

    // 2. Build items with price info (same calculation as before)
    const itemsWithPriceInfo = rawCartItems.map(cart => {
      const product = cart.product;
      const quantity = parseInt(cart.quantity, 10) || 0;

      const unitPrice = parseFloat(product.price) || 0;
      const shippingFee = parseFloat(product.shippingFee) || 0;
      const discountPercent = parseFloat(product.discountPercent) || 0;

      const discountAmount = product.discount ? (unitPrice * discountPercent) / 100 : 0;
      const finalPrice = unitPrice - discountAmount;
      const itemTotal = (finalPrice * quantity) + shippingFee;

      return {
        cartId: cart.id, // may be undefined for frontend items
        productId: product.id,
        name: product.name,
        price: unitPrice,
        finalPrice,
        discountAmount,
        discountPercent,
        shippingFee,
        quantity,
        itemTotal,
        image: product.images?.[0] || null,
        productData: product, // keep full product for stock update
      };
    });

    // 3. Calculate cart summary (same as before)
    let cartSummary = {
      subtotal: 0,
      totalDiscount: 0,
      totalItems: 0,
      totalQuantity: 0,
      totalShippingFee: 0,
      estimatedTotal: 0,
    };

    itemsWithPriceInfo.forEach(item => {
      cartSummary.subtotal += item.price * item.quantity;
      cartSummary.totalDiscount += item.discountAmount * item.quantity;
      cartSummary.totalItems += 1;
      cartSummary.totalQuantity += item.quantity;
      cartSummary.totalShippingFee += item.shippingFee;
      cartSummary.estimatedTotal += item.itemTotal;
    });

    // 4. Validate stock (same as before)
    for (const item of itemsWithPriceInfo) {
      const product = item.productData;
      const availableQuantity = parseInt(product.quantity, 10) || 0;
      if (availableQuantity < item.quantity) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Insufficient stock for ${product.name}. Available: ${availableQuantity}, Requested: ${item.quantity}`
        );
      }
    }

    // 5. Generate order number
    const orderNo = `ORD-${Date.now()}-${randomInt(1000, 9999)}`;

    // 6. Create order (userId can be null)
    const order = await tx.order.create({
      data: {
        orderNo,
        userId, // may be null for guest orders
        name: shippingDetails.name,
        email: shippingDetails.email,
        phone: shippingDetails.phone,
        address: shippingDetails.address,
        city: shippingDetails.city,
        state: shippingDetails.state,
        country: shippingDetails.country,
        zipCode: shippingDetails.zipCode,
        paymentMethod: shippingDetails.paymentMethod,
        currency: shippingDetails.currency,
        amount: cartSummary.estimatedTotal,
        shippingFee: cartSummary.totalShippingFee,
        statusHistory: [{ status: OrderStatus.PENDING, changedAt: new Date() }],
        orderProducts: {
          create: itemsWithPriceInfo.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.finalPrice,
          })),
        },
      },
      include: {
        orderProducts: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
          },
        },
      },
    });

    // 7. Create payment record (always PENDING)
    await tx.payment.create({
      data: {
        userId,
        orderId: order.id,
        amount: cartSummary.estimatedTotal,
        status: 'PENDING',
        currency: shippingDetails.currency,
        method: shippingDetails.paymentMethod,
      },
    });

    // 8. Update product quantities (both cases)
    for (const item of itemsWithPriceInfo) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          quantity: (parseInt(item.productData.quantity, 10) - item.quantity).toString(),
          stock: parseInt(item.productData.quantity, 10) - item.quantity > 0,
        },
      });
    }

    // 9. Clear the database cart ONLY if the order was created from it
    if (source === 'db' && userId) {
      await tx.cart.deleteMany({
        where: { userId },
      });
    }
    // If source === 'frontend', we do NOT delete the user's DB cart (if any) – 
    // the user might want to keep it. If you prefer to clear it anyway, you can remove the condition.

    // 10. Return the order (or summary)
    return {
      order,
      orderSummary: cartSummary,
    };
  });
};

export const allOrder = async (userId, req) => {
  const queryLoad: {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
    status?: OrderStatus;
  } = req.query;

  // Parse pagination parameters with defaults
  const page = parseInt(queryLoad.page || "1");
  const limit = parseInt(queryLoad.limit || "10");
  const status = queryLoad.status || undefined;
  // Set defaults for sorting
  const sortBy = queryLoad.sortBy || 'createdAt';
  const sortOrder = queryLoad.sortOrder || 'desc';

  const skip = (page - 1) * limit;

  let where: any = { userId }
  if (status) {
    where.status = status
  }
  // Get total count
  const total = await prisma.order.count({ where });

  if (total === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, "No orders found");
  }


  // Get paginated orders with related data
  const orders = await prisma.order.findMany({
    where,
    select: {
      id: true,
      orderNo: true,
      status: true,
      paymentMethod: true,
      amount: true,
      shippingFee: true,
      currency: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      country: true,
      zipCode: true,
      trackingNumber: true,
      shippingCarrier: true,
      estimatedDelivery: true,
      invoiceUrl: true,
      statusHistory: true,
      createdAt: true,
      updatedAt: true,
      orderProducts: {
        select: {
          id: true,
          quantity: true,
          price: true,
          isReviewed: true,
          product: {
            select: {
              id: true,
              name: true,
              images: true,
              price: true
            }
          }
        }
      },
      payments: {
        select: {
          id: true,
          amount: true,
          paidAmount: true,
          status: true,
          method: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      }
    },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder
    }
  });

  const ordersWithPhotoUrls = orders.map((order) => ({
    ...order,
    invoiceUrl: order.invoiceUrl ? filenameToUrl(order.invoiceUrl) : null,
    orderProducts: order.orderProducts.map((product) => ({
      ...product,
      product: {
        ...product.product,
        images: filenamesToUrls(product.product.images || []),
      },
    })),
  }));

  return {
    pagination: {
      total,
      page,
      limit,
    },
    data: ordersWithPhotoUrls
  };
};
export const allOrderAdmin = async (req) => {
  const queryLoad: {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
    status?: OrderStatus;
  } = req.query;

  // Parse pagination parameters with defaults
  const page = parseInt(queryLoad.page || "1");
  const limit = parseInt(queryLoad.limit || "10");
  const status = queryLoad.status || undefined;

  // Set defaults for sorting
  const sortBy = queryLoad.sortBy || 'createdAt';
  const sortOrder = queryLoad.sortOrder || 'desc';

  const skip = (page - 1) * limit;

  let where: any = {};
  if (status) {
    where.status = status
  }
  // Get total count
  const total = await prisma.order.count({ where });

  if (total === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, "No orders found");
  }


  // Get paginated orders with related data
  const orders = await prisma.order.findMany({
    where,
    select: {
      id: true,
      orderNo: true,
      status: true,
      paymentMethod: true,
      amount: true,
      shippingFee: true,
      currency: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      country: true,
      zipCode: true,
      trackingNumber: true,
      shippingCarrier: true,
      estimatedDelivery: true,
      invoiceUrl: true,
      statusHistory: true,
      createdAt: true,
      updatedAt: true,
      // User info
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          photo: true
        }
      },
      // Order products with product details
      orderProducts: {
        select: {
          id: true,
          quantity: true,
          price: true,
          isReviewed: true,
          product: {
            select: {
              id: true,
              name: true,
              images: true,
              price: true
            }
          }
        }
      },
      // Payment info
      payments: {
        select: {
          id: true,
          amount: true,
          paidAmount: true,
          status: true,
          method: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit // Get latest payment
      }
    },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder
    }
  });

  const ordersWithPhotoUrls = orders.map((order) => ({
    ...order,
    invoiceUrl: order.invoiceUrl ? filenameToUrl(order.invoiceUrl) : null,
    orderProducts: order.orderProducts.map((product) => ({
      ...product,
      product: {
        ...product.product,
        images: filenamesToUrls(product.product.images || []),
      },
    })),
  }));

  return {
    pagination: {
      total,
      page,
      limit,
    },
    data: ordersWithPhotoUrls
  };
};

export const orderDetails = async (adminId, id) => {

  if (!adminId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Admin ID is missing!");
  }
  const adminExist = await prisma.user.findUnique({
    where: { id: adminId },
  });
  if (!adminExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "Admin not found!");
  }

  if (!id) throw new ApiError(httpStatus.BAD_REQUEST, "Product Id is required!")

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      orderProducts: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              images: true,
              price: true,
            }
          }
        }
      },
      payments: true
    },
  });
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "No order found with this id");
  }
  const orderWithPhotoUrls = {
    ...order,
    invoiceUrl: order.invoiceUrl ? filenameToUrl(order.invoiceUrl) : null,
    orderProducts: order.orderProducts.map((product) => ({
      ...product,
      product: {
        ...product.product,
        images: filenamesToUrls(product.product.images || []),
      },
    })),
  };

  return orderWithPhotoUrls;
};

// --------------------------------------------------------------------------
// Order status state machine
// --------------------------------------------------------------------------
// Forward-only. Once an order moves to a given status, it can only move to
// one of the statuses listed here — never back to an earlier one, and never
// to a status not listed (e.g. DISPATCHED -> PENDING is impossible).
// DELIVERED and CANCELLED are terminal — no further transitions allowed.
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
  ACCEPTED: [OrderStatus.DISPATCHED, OrderStatus.CANCELLED],
  // Once dispatched (in the courier's hands), it can no longer be cancelled —
  // only completed as delivered. Adjust here if you want to allow returns-in-transit.
  DISPATCHED: [OrderStatus.DELIVERED],
  DELIVERED: [],
  CANCELLED: [],
};

export const updateStatus = async (
  adminId: string,
  id: string,
  payload: {
    status: OrderStatus,
    trackingNumber?: string,
    shippingCarrier?: string,
    estimatedDelivery?: string | Date,
  }) => {

  if (!adminId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Admin ID is missing!");
  }
  const adminExist = await prisma.user.findUnique({
    where: { id: adminId },
  });
  if (!adminExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "Admin not found!");
  }

  if (!id) throw new ApiError(httpStatus.BAD_REQUEST, "Order Id is required!")

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      orderProducts: {
        include: {
          product: { select: { id: true, name: true, images: true } },
        },
      },
    },
  });
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "No order found with this id");
  }

  const statusUnchanged = order.status === payload.status;
  const hasTrackingUpdate =
    payload.trackingNumber !== undefined ||
    payload.shippingCarrier !== undefined ||
    payload.estimatedDelivery !== undefined;

  // Re-submitting the same status with no other changes is a no-op.
  if (statusUnchanged && !hasTrackingUpdate) {
    return { orderUpdate: order };
  }

  // Only validate the transition when the status is actually changing —
  // same-status requests here are just updating tracking info (e.g. adding
  // a tracking number after the fact) and don't need to pass the state machine.
  if (!statusUnchanged) {
    const nextAllowed = ALLOWED_TRANSITIONS[order.status] || [];
    if (!nextAllowed.includes(payload.status)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Invalid status change: cannot move order from "${order.status}" to "${payload.status}". ` +
        (nextAllowed.length > 0
          ? `Allowed next status: ${nextAllowed.join(", ")}.`
          : `"${order.status}" is a final status and cannot be changed.`)
      );
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const orderUpdate = await tx.order.update({
      where: { id: order.id },
      data: {
        status: payload.status,
        ...(payload.trackingNumber !== undefined && { trackingNumber: payload.trackingNumber }),
        ...(payload.shippingCarrier !== undefined && { shippingCarrier: payload.shippingCarrier }),
        ...(payload.estimatedDelivery !== undefined && { estimatedDelivery: new Date(payload.estimatedDelivery) }),
        // Only append to the audit trail when the status is actually changing —
        // a tracking-info-only update shouldn't create a duplicate history entry.
        ...(!statusUnchanged && {
          statusHistory: {
            push: { status: payload.status, changedAt: new Date() },
          },
        }),
      },
      select: {
        id: true,
        orderNo: true,
        status: true,
        userId: true,
        trackingNumber: true,
      }
    })

    if (!statusUnchanged) {
      let paymentStatus: PaymentStatus | undefined;
      if (orderUpdate.status === "DELIVERED") {
        paymentStatus = PaymentStatus.PAID;
      }
      if (orderUpdate.status === "CANCELLED") {
        paymentStatus = PaymentStatus.CANCELLED;
      }

      if (paymentStatus) {
        await tx.payment.update({
          where: { orderId: order.id },
          data: {
            status: paymentStatus,
            ...(paymentStatus === PaymentStatus.PAID && {
              paidAmount: order.amount,
            })
          }
        })
      }
    }
    return { orderUpdate };
  })

  // -------------------------------------------------------------------
  // Customer notification email — only on an actual status change, and
  // skipped for PENDING (that's the initial "order placed" state, already
  // covered by the order-confirmation email sent at checkout).
  // -------------------------------------------------------------------
  if (!statusUnchanged && result.orderUpdate.status !== "PENDING") {
    const user = await prisma.user.findUnique({
      where: { id: result.orderUpdate.userId },
    });
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
    }

    const emailProducts = order.orderProducts.map((op) => ({
      name: op.product?.name || "Product",
      image: op.product?.images?.[0] ? filenameToUrl(op.product.images[0]) : undefined,
      quantity: op.quantity,
      price: op.price,
    }));

    const trackingUrl = `${frontend_url}/order/${order.id}`;

    const html = orderStatusEmailTemplate({
      orderNo: result.orderUpdate.orderNo,
      status: result.orderUpdate.status,
      customerName: order.name,
      email: order.email,
      phone: order.phone,
      address: order.address,
      city: order.city,
      state: order.state,
      country: order.country,
      zipCode: order.zipCode,
      amount: order.amount,
      shippingFee: order.shippingFee,
      currency: order.currency,
      paymentMethod: order.paymentMethod,
      trackingNumber: result.orderUpdate.trackingNumber,
      trackingUrl,
      products: emailProducts,
    });

    await SendEmailUtility(
      user.email,
      `Order Update: ${result.orderUpdate.orderNo} — ${result.orderUpdate.status}`,
      html
    );

    // -----------------------------------------------------------------
    // On DELIVERED: generate a downloadable invoice PDF, save its URL on
    // the order, and email it to the customer as an attachment.
    // -----------------------------------------------------------------
    if (result.orderUpdate.status === "DELIVERED") {
      try {
        const invoice = await generateInvoicePdf({
          orderNo: order.orderNo,
          orderDate: order.createdAt,
          deliveredDate: new Date(),
          customerName: order.name,
          email: order.email,
          phone: order.phone,
          address: order.address,
          city: order.city,
          state: order.state,
          country: order.country,
          zipCode: order.zipCode,
          paymentMethod: order.paymentMethod,
          currency: order.currency,
          amount: order.amount,
          shippingFee: order.shippingFee,
          products: order.orderProducts.map((op) => ({
            name: op.product?.name || "Product",
            quantity: op.quantity,
            price: op.price,
          })),
        });

        await prisma.order.update({
          where: { id: order.id },
          data: { invoiceUrl: invoice.filename },
        });

        const invoiceHtml = invoiceEmailTemplate({
          orderNo: order.orderNo,
          customerName: order.name,
          invoiceUrl: invoice.url,
        });

        await SendEmailUtility(
          user.email,
          `Your Invoice for Order ${order.orderNo}`,
          invoiceHtml,
          [{ filename: invoice.filename, path: invoice.filePath, contentType: "application/pdf" }]
        );
      } catch (err) {
        // Don't fail the whole status update if invoice generation/email fails —
        // log it so an admin can regenerate/resend manually if needed.
        console.error("Invoice generation/email failed for order", order.orderNo, err);
      }
    }
  }

  return result;
};

// --------------------------------------------------------------------------
// Customer-facing single-order fetch — used by the order tracking page.
// Unlike `orderDetails` (admin-only, any order), this enforces that the
// requesting user actually owns the order.
// --------------------------------------------------------------------------
export const customerOrderDetails = async (userId: string, id: string) => {
  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "You must be logged in to view this order!");
  }
  if (!id) throw new ApiError(httpStatus.BAD_REQUEST, "Order Id is required!");

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      orderProducts: {
        include: {
          product: {
            select: { id: true, name: true, images: true, price: true },
          },
        },
      },
      payments: true,
    },
  });

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "No order found with this id");
  }
  if (order.userId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, "You do not have permission to view this order!");
  }

  return {
    ...order,
    invoiceUrl: order.invoiceUrl ? filenameToUrl(order.invoiceUrl) : null,
    orderProducts: order.orderProducts.map((product) => ({
      ...product,
      product: {
        ...product.product,
        images: filenamesToUrls(product.product.images || []),
      },
    })),
  };
};

// --------------------------------------------------------------------------
// Tells the admin UI which statuses this order is legally allowed to move to
// next, so the dropdown can't even offer an invalid/reversed transition.
// --------------------------------------------------------------------------
export const getNextStatuses = async (id: string) => {
  if (!id) throw new ApiError(httpStatus.BAD_REQUEST, "Order Id is required!");

  const order = await prisma.order.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "No order found with this id");
  }

  return {
    currentStatus: order.status,
    nextStatuses: ALLOWED_TRANSITIONS[order.status] || [],
  };
};

export const OrderService = {
  createOrderFromCart,
  allOrder,
  allOrderAdmin,
  orderDetails,
  customerOrderDetails,
  updateStatus,
  getNextStatuses,
};
