// services/dashboard.service.ts
import { PaymentStatus } from '@prisma/client';
import prisma from "../../../config/db.prisma";
import httpStatus from "http-status"
import {
    startOfMonth,
    endOfMonth,
    subMonths,
    getMonth,
    getYear
} from 'date-fns';
import ApiError from "../../../errors/apiError";
import { getDateRange, RangeType } from './utils/dateRange';

interface DashboardStats {
    totalEarnings: {
        entireTotal: string;
        selectedMonthTotal: string;
        change: number;
    };
    totalOrders: {
        entireTotal: number;
        selectedMonthTotal: number;
        change: number;
    };
    totalCustomers: {
        entireTotal: number;
        selectedMonthTotal: number;
        change: number;
    };
    totalProducts: {
        entireTotal: number;
        selectedMonthTotal: number;
        change: number;
    };
}

const getTotalEarnings = async (startDate?: Date, endDate?: Date): Promise<number> => {
    const where: any = {
        status: PaymentStatus.PAID
    };

    if (startDate && endDate) {
        where.createdAt = {
            gte: startDate,
            lte: endDate
        };
    }

    const result = await prisma.payment.aggregate({
        where,
        _sum: {
            amount: true
        }
    });

    return result._sum.amount || 0;
};

const getTotalOrders = async (startDate?: Date, endDate?: Date): Promise<number> => {
    const where: any = {};

    if (startDate && endDate) {
        where.createdAt = {
            gte: startDate,
            lte: endDate
        };
    }

    return await prisma.order.count({ where });
};

const getTotalCustomers = async (startDate?: Date, endDate?: Date): Promise<number> => {
    const where: any = {
        role: 'CUSTOMER'
    };

    if (startDate && endDate) {
        where.createdAt = {
            gte: startDate,
            lte: endDate
        };
    }

    return await prisma.user.count({ where });
};

const getTotalProducts = async (startDate?: Date, endDate?: Date): Promise<number> => {
    const where: any = {};

    if (startDate && endDate) {
        where.createdAt = {
            gte: startDate,
            lte: endDate
        };
    }

    return await prisma.product.count({ where });
};

const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) {
        return current > 0 ? 100 : 0;
    }

    const change = ((current - previous) / previous) * 100;
    return parseFloat(change.toFixed(2));
};

export const DashboardStats = async (query: { month?: string; year?: string }): Promise<DashboardStats> => {
    // Parse query parameters
    const month = query.month ? parseInt(query.month) : getMonth(new Date());
    const year = query.year ? parseInt(query.year) : getYear(new Date());

    // Validate month (0-11)
    const selectedMonth = Math.max(0, Math.min(11, month));
    const selectedYear = year;

    // Create dates for selected month
    const selectedMonthStart = new Date(selectedYear, selectedMonth, 1);
    const selectedMonthEnd = endOfMonth(selectedMonthStart);

    // Previous month for comparison
    const previousMonthStart = startOfMonth(subMonths(selectedMonthStart, 1));
    const previousMonthEnd = endOfMonth(previousMonthStart);

    // Get all stats in parallel
    const [
        entireEarnings,
        selectedMonthEarnings,
        previousMonthEarnings,
        entireOrders,
        selectedMonthOrders,
        previousMonthOrders,
        entireCustomers,
        selectedMonthCustomers,
        previousMonthCustomers,
        entireProducts,
        selectedMonthProducts,
        previousMonthProducts
    ] = await Promise.all([
        // Entire earnings (all time)
        getTotalEarnings(),

        // Selected month earnings
        getTotalEarnings(selectedMonthStart, selectedMonthEnd),

        // Previous month earnings for comparison
        getTotalEarnings(previousMonthStart, previousMonthEnd),

        // Entire orders (all time)
        getTotalOrders(),

        // Selected month orders
        getTotalOrders(selectedMonthStart, selectedMonthEnd),

        // Previous month orders for comparison
        getTotalOrders(previousMonthStart, previousMonthEnd),

        // Entire customers (all time)
        getTotalCustomers(),

        // Selected month customers
        getTotalCustomers(selectedMonthStart, selectedMonthEnd),

        // Previous month customers for comparison
        getTotalCustomers(previousMonthStart, previousMonthEnd),

        // Entire products (all time)
        getTotalProducts(),

        // Selected month products
        getTotalProducts(selectedMonthStart, selectedMonthEnd),

        // Previous month products for comparison
        getTotalProducts(previousMonthStart, previousMonthEnd)
    ]);

    // Calculate percentage changes
    const earningsChange = calculatePercentageChange(selectedMonthEarnings, previousMonthEarnings);
    const ordersChange = calculatePercentageChange(selectedMonthOrders, previousMonthOrders);
    const customersChange = calculatePercentageChange(selectedMonthCustomers, previousMonthCustomers);
    const productsChange = calculatePercentageChange(selectedMonthProducts, previousMonthProducts);

    return {
        totalEarnings: {
            entireTotal: `$${entireEarnings.toFixed(3)}`,
            selectedMonthTotal: `$${selectedMonthEarnings.toFixed(3)}`,
            change: earningsChange
        },
        totalOrders: {
            entireTotal: entireOrders,
            selectedMonthTotal: selectedMonthOrders,
            change: ordersChange
        },
        totalCustomers: {
            entireTotal: entireCustomers,
            selectedMonthTotal: selectedMonthCustomers,
            change: customersChange
        },
        totalProducts: {
            entireTotal: entireProducts,
            selectedMonthTotal: selectedMonthProducts,
            change: productsChange
        }
    };
};

export const RecentActivity = async (adminId: string) => {

    const reviews = await prisma.review.findMany({
        take: 2,
        orderBy: { createdAt: "desc" },
        include: {
            user: { select: { name: true } },
            product: { select: { name: true } }
        }
    });
    const orders = await prisma.order.findMany({
        take: 2,
        orderBy: { createdAt: "desc" },
        select: {
            orderNo: true,
            status: true,
            createdAt: true
        }
    });
    const payments = await prisma.payment.findMany({
        take: 2,
        orderBy: { createdAt: "desc" },
        select: {
            amount: true,
            status: true,
            createdAt: true
        }
    });
    const activities = [
        ...reviews.map(r => ({
            type: "REVIEW",
            text: `${r.user?.name} reviewed ${r.product?.name}`,
            time: r.createdAt
        })),
        ...orders.map(o => ({
            type: "ORDER",
            text: `Order ${o.orderNo} ${o.status.toLowerCase()}`,
            time: o.createdAt
        })),
        ...payments.map(p => ({
            type: "PAYMENT",
            text: `Payment of $${p.amount} ${p.status.toLowerCase()}`,
            time: p.createdAt
        })),
    ]
        .sort((a, b) => b.time.getTime() - a.time.getTime())
        .slice(0, 10);

    return activities
}

export const OrdersChart = async (type: RangeType) => {

    const { start, end } = getDateRange(type);

    const orders = await prisma.order.findMany({
        where: {
            createdAt: {
                gte: start,
                lte: end,
            },
        },
        select: {
            createdAt: true,
        },
    });

    const map = new Map<string, number>();

    for (const order of orders) {
        const date = new Date(order.createdAt);
        let key = "";

        if (type === "daily") {
            key = date.toISOString().slice(0, 10); // YYYY-MM-DD
        }

        if (type === "weekly") {
            const week = Math.ceil(date.getDate() / 7);
            key = `${date.getFullYear()}-${date.getMonth() + 1}-W${week}`;
        }

        if (type === "monthly") {
            key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        }

        map.set(key, (map.get(key) || 0) + 1);
    }

    const chartData = Array.from(map.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => a.label.localeCompare(b.label));
    return chartData
}

export const RecentOrders = async () => {
    const orders = await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            createdAt: true,
            status: true,
            user: {
                select: {
                    id: true,
                    name: true
                }
            },
            orderProducts: {
                select: {
                    productId: true,
                    quantity: true,
                    price: true,
                    product: {
                        select: {
                            id: true,
                            name: true,
                            Color: {
                                select: {
                                    name: true
                                }
                            },
                            Size: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    },
                }
            },
            payments: {
                select: {
                    amount: true,
                    status: true,
                    createdAt: true,
                    id: true
                }
            }
        }
    });
    if (!orders.length) {
        throw new ApiError(httpStatus.NOT_FOUND, "No orders found");
    }
    return orders;
}

export const DashboardService = {
    DashboardStats,
    RecentActivity,
    OrdersChart,
    RecentOrders
};